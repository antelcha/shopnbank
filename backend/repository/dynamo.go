package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var (
	dynamoClient *dynamodb.Client
)

const (
	usersTable        = "users"
	accountsTable     = "accounts"
	productsTable     = "products"
	transactionsTable = "transactions"
)

// SetDynamoDBClient stores the active DynamoDB client for repository operations.
func SetDynamoDBClient(client *dynamodb.Client) {
	dynamoClient = client
}

func getClient() (*dynamodb.Client, error) {
	if dynamoClient == nil {
		return nil, errors.New("repository: dynamodb client not initialised")
	}
	return dynamoClient, nil
}

// EnsureTables creates the required DynamoDB tables if they do not exist.
func EnsureTables(ctx context.Context) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	tables := []struct {
		name       string
		createFunc func(context.Context, *dynamodb.Client) error
	}{
		{name: usersTable, createFunc: createUsersTable},
		{name: accountsTable, createFunc: createAccountsTable},
		{name: productsTable, createFunc: createProductsTable},
		{name: transactionsTable, createFunc: createTransactionsTable},
	}

	for _, table := range tables {
		if err := ensureTable(ctx, client, table.name, table.createFunc); err != nil {
			return fmt.Errorf("ensure table %s: %w", table.name, err)
		}
	}

	return nil
}

func ensureTable(ctx context.Context, client *dynamodb.Client, tableName string, create func(context.Context, *dynamodb.Client) error) error {
	_, err := client.DescribeTable(ctx, &dynamodb.DescribeTableInput{TableName: aws.String(tableName)})
	if err == nil {
		return nil
	}

	var rnfe *types.ResourceNotFoundException
	if !errors.As(err, &rnfe) {
		return err
	}

	if err := create(ctx, client); err != nil {
		return err
	}

	waiter := dynamodb.NewTableExistsWaiter(client)
	return waiter.Wait(ctx, &dynamodb.DescribeTableInput{TableName: aws.String(tableName)}, 2*time.Minute)
}

func createUsersTable(ctx context.Context, client *dynamodb.Client) error {
	_, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: aws.String(usersTable),
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("id"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("email"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("username"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("id"), KeyType: types.KeyTypeHash},
		},
		BillingMode: types.BillingModePayPerRequest,
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName:  aws.String("email-index"),
				KeySchema:  []types.KeySchemaElement{{AttributeName: aws.String("email"), KeyType: types.KeyTypeHash}},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName:  aws.String("username-index"),
				KeySchema:  []types.KeySchemaElement{{AttributeName: aws.String("username"), KeyType: types.KeyTypeHash}},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
		},
	})
	return err
}

func createAccountsTable(ctx context.Context, client *dynamodb.Client) error {
	_, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: aws.String(accountsTable),
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("id"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("user_id"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("id"), KeyType: types.KeyTypeHash},
		},
		BillingMode: types.BillingModePayPerRequest,
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName:  aws.String("user_id-index"),
				KeySchema:  []types.KeySchemaElement{{AttributeName: aws.String("user_id"), KeyType: types.KeyTypeHash}},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
		},
	})
	return err
}

func createProductsTable(ctx context.Context, client *dynamodb.Client) error {
	_, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: aws.String(productsTable),
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("id"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("id"), KeyType: types.KeyTypeHash},
		},
		BillingMode: types.BillingModePayPerRequest,
	})
	return err
}

func createTransactionsTable(ctx context.Context, client *dynamodb.Client) error {
	_, err := client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: aws.String(transactionsTable),
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("id"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("user_id"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("account_id"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("id"), KeyType: types.KeyTypeHash},
		},
		BillingMode: types.BillingModePayPerRequest,
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName:  aws.String("user_id-index"),
				KeySchema:  []types.KeySchemaElement{{AttributeName: aws.String("user_id"), KeyType: types.KeyTypeHash}},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName:  aws.String("account_id-index"),
				KeySchema:  []types.KeySchemaElement{{AttributeName: aws.String("account_id"), KeyType: types.KeyTypeHash}},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
		},
	})
	return err
}
