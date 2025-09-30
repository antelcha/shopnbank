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

type Account struct {
	ID          string    `json:"id" dynamodbav:"id"`
	UserID      string    `json:"user_id" dynamodbav:"user_id"`
	AccountName string    `json:"account_name" dynamodbav:"account_name"`
	Balance     int64     `json:"balance" dynamodbav:"balance"`
	CreatedAt   time.Time `json:"created_at" dynamodbav:"created_at"`
}

var (
	ErrAccountNotFound     = errors.New("account not found")
	ErrInsufficientBalance = errors.New("insufficient balance")
)

// CreateAccount persists a new bank account for the user.
func CreateAccount(ctx context.Context, account Account) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	item, err := attributevalue.MarshalMap(account)
	if err != nil {
		return fmt.Errorf("marshal account: %w", err)
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(accountsTable),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
	})
	if err != nil {
		return fmt.Errorf("put account: %w", err)
	}

	return nil
}

// GetAccountsByUserID lists accounts owned by the given user.
func GetAccountsByUserID(ctx context.Context, userID string) ([]Account, error) {
	client, err := getClient()
	if err != nil {
		return nil, err
	}

	out, err := client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(accountsTable),
		IndexName:              aws.String("user_id-index"),
		KeyConditionExpression: aws.String("user_id = :user"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":user": &types.AttributeValueMemberS{Value: userID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("query accounts: %w", err)
	}

	var accounts []Account
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &accounts); err != nil {
		return nil, fmt.Errorf("unmarshal accounts: %w", err)
	}

	return accounts, nil
}

// GetAccountByID fetches a single account.
func GetAccountByID(ctx context.Context, id string) (Account, error) {
	client, err := getClient()
	if err != nil {
		return Account{}, err
	}

	out, err := client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(accountsTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return Account{}, fmt.Errorf("get account: %w", err)
	}

	if out.Item == nil {
		return Account{}, ErrAccountNotFound
	}

	var account Account
	if err := attributevalue.UnmarshalMap(out.Item, &account); err != nil {
		return Account{}, fmt.Errorf("unmarshal account: %w", err)
	}

	return account, nil
}

// TransferMoney moves funds atomically between two accounts.
func TransferMoney(ctx context.Context, fromAccountID, toAccountID string, amount int64) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	amountValue := &types.AttributeValueMemberN{Value: strconv.FormatInt(amount, 10)}

	_, err = client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Update: &types.Update{
					TableName:           aws.String(accountsTable),
					Key:                 map[string]types.AttributeValue{"id": &types.AttributeValueMemberS{Value: fromAccountID}},
					UpdateExpression:    aws.String("SET balance = balance - :amount"),
					ConditionExpression: aws.String("attribute_exists(id) AND balance >= :amount"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":amount": amountValue,
					},
				},
			},
			{
				Update: &types.Update{
					TableName:           aws.String(accountsTable),
					Key:                 map[string]types.AttributeValue{"id": &types.AttributeValueMemberS{Value: toAccountID}},
					UpdateExpression:    aws.String("SET balance = balance + :amount"),
					ConditionExpression: aws.String("attribute_exists(id)"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":amount": amountValue,
					},
				},
			},
		},
	})
	if err != nil {
		var txCancel *types.TransactionCanceledException
		if errors.As(err, &txCancel) {
			for _, reason := range txCancel.CancellationReasons {
				if reason.Code != nil && *reason.Code == "ConditionalCheckFailed" {
					return ErrInsufficientBalance
				}
			}
			return ErrAccountNotFound
		}
		return fmt.Errorf("transfer money: %w", err)
	}

	return nil
}

// DepositMoney increments an account balance within a transaction.
func DepositMoney(ctx context.Context, accountID string, amount int64) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	amountValue := &types.AttributeValueMemberN{Value: strconv.FormatInt(amount, 10)}

	_, err = client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(accountsTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: accountID},
		},
		UpdateExpression:          aws.String("SET balance = balance + :amount"),
		ConditionExpression:       aws.String("attribute_exists(id)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{":amount": amountValue},
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return ErrAccountNotFound
		}
		return fmt.Errorf("deposit money: %w", err)
	}

	return nil
}
