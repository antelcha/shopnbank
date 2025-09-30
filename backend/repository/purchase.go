package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var (
	ErrProductOutOfStock = errors.New("insufficient stock")
)

func PurchaseProduct(ctx context.Context, accountID, productID string, quantity int) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	account, err := GetAccountByID(ctx, accountID)
	if err != nil {
		return err
	}

	product, err := GetProductByID(ctx, productID)
	if err != nil {
		return err
	}

	if product.Stock < quantity {
		return ErrProductOutOfStock
	}

	totalCost := product.Price * int64(quantity)
	if account.Balance < totalCost {
		return ErrInsufficientBalance
	}

	txn := Transaction{
		ID:              fmt.Sprintf("txn_%d", time.Now().UnixNano()),
		UserID:          account.UserID,
		AccountID:       account.ID,
		ProductID:       product.ID,
		Quantity:        quantity,
		UnitPrice:       product.Price,
		TotalAmount:     totalCost,
		TransactionType: "purchase",
		CreatedAt:       time.Now(),
	}

	txnItem, err := attributevalue.MarshalMap(txn)
	if err != nil {
		return fmt.Errorf("marshal transaction: %w", err)
	}

	amountValue := &types.AttributeValueMemberN{Value: strconv.FormatInt(totalCost, 10)}
	qtyValue := &types.AttributeValueMemberN{Value: strconv.Itoa(quantity)}

	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Update: &types.Update{
					TableName:           aws.String(accountsTable),
					Key:                 map[string]types.AttributeValue{"id": &types.AttributeValueMemberS{Value: accountID}},
					UpdateExpression:    aws.String("SET balance = balance - :amount"),
					ConditionExpression: aws.String("attribute_exists(id) AND balance >= :amount"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":amount": amountValue,
					},
				},
			},
			{
				Update: &types.Update{
					TableName:           aws.String(productsTable),
					Key:                 map[string]types.AttributeValue{"id": &types.AttributeValueMemberS{Value: productID}},
					UpdateExpression:    aws.String("SET stock = stock - :qty"),
					ConditionExpression: aws.String("attribute_exists(id) AND stock >= :qty"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":qty": qtyValue,
					},
				},
			},
			{
				Put: &types.Put{
					TableName:           aws.String(transactionsTable),
					Item:                txnItem,
					ConditionExpression: aws.String("attribute_not_exists(id)"),
				},
			},
		},
	}

	if _, err := client.TransactWriteItems(ctx, input); err != nil {
		var txCancel *types.TransactionCanceledException
		if errors.As(err, &txCancel) {
			for _, reason := range txCancel.CancellationReasons {
				if reason.Code != nil && *reason.Code == "ConditionalCheckFailed" {
					// Fallback to precise error based on current state.
					if account.Balance < totalCost {
						return ErrInsufficientBalance
					}
					if product.Stock < quantity {
						return ErrProductOutOfStock
					}
					return ErrAccountNotFound
				}
			}
			return ErrAccountNotFound
		}
		return fmt.Errorf("purchase transaction: %w", err)
	}

	return nil
}
