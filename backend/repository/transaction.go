package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Transaction struct {
	ID              string    `json:"id" dynamodbav:"id"`
	UserID          string    `json:"user_id" dynamodbav:"user_id"`
	AccountID       string    `json:"account_id" dynamodbav:"account_id"`
	ProductID       string    `json:"product_id" dynamodbav:"product_id"`
	Quantity        int       `json:"quantity" dynamodbav:"quantity"`
	UnitPrice       int64     `json:"unit_price" dynamodbav:"unit_price"`
	TotalAmount     int64     `json:"total_amount" dynamodbav:"total_amount"`
	TransactionType string    `json:"transaction_type" dynamodbav:"transaction_type"`
	CreatedAt       time.Time `json:"created_at" dynamodbav:"created_at"`
}

func CreateTransaction(ctx context.Context, txData Transaction) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	item, err := attributevalue.MarshalMap(txData)
	if err != nil {
		return fmt.Errorf("marshal transaction: %w", err)
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(transactionsTable),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
	})
	if err != nil {
		return fmt.Errorf("put transaction: %w", err)
	}

	return nil
}

func GetTransactionsByUserID(ctx context.Context, userID string) ([]Transaction, error) {
	client, err := getClient()
	if err != nil {
		return nil, err
	}

	out, err := client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(transactionsTable),
		IndexName:              aws.String("user_id-index"),
		KeyConditionExpression: aws.String("user_id = :user"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":user": &types.AttributeValueMemberS{Value: userID},
		},
		ScanIndexForward: aws.Bool(false),
	})
	if err != nil {
		return nil, fmt.Errorf("query transactions by user: %w", err)
	}

	var transactions []Transaction
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &transactions); err != nil {
		return nil, fmt.Errorf("unmarshal transactions: %w", err)
	}

	return transactions, nil
}

func GetTransactionsByAccountID(ctx context.Context, accountID string) ([]Transaction, error) {
	client, err := getClient()
	if err != nil {
		return nil, err
	}

	out, err := client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(transactionsTable),
		IndexName:              aws.String("account_id-index"),
		KeyConditionExpression: aws.String("account_id = :account"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":account": &types.AttributeValueMemberS{Value: accountID},
		},
		ScanIndexForward: aws.Bool(false),
	})
	if err != nil {
		return nil, fmt.Errorf("query transactions by account: %w", err)
	}

	var transactions []Transaction
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &transactions); err != nil {
		return nil, fmt.Errorf("unmarshal transactions: %w", err)
	}

	return transactions, nil
}
