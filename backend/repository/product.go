package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Product struct {
	ID          string    `json:"id" dynamodbav:"id"`
	Name        string    `json:"name" dynamodbav:"name"`
	Description string    `json:"description" dynamodbav:"description"`
	Price       int64     `json:"price" dynamodbav:"price"`
	Stock       int       `json:"stock" dynamodbav:"stock"`
	CreatedAt   time.Time `json:"created_at" dynamodbav:"created_at"`
}

var ErrProductNotFound = errors.New("product not found")

func CreateProduct(ctx context.Context, product Product) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	item, err := attributevalue.MarshalMap(product)
	if err != nil {
		return fmt.Errorf("marshal product: %w", err)
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(productsTable),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
	})
	if err != nil {
		return fmt.Errorf("put product: %w", err)
	}

	return nil
}

func GetAllProducts(ctx context.Context) ([]Product, error) {
	client, err := getClient()
	if err != nil {
		return nil, err
	}

	out, err := client.Scan(ctx, &dynamodb.ScanInput{TableName: aws.String(productsTable)})
	if err != nil {
		return nil, fmt.Errorf("scan products: %w", err)
	}

	var products []Product
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &products); err != nil {
		return nil, fmt.Errorf("unmarshal products: %w", err)
	}

	return products, nil
}

func GetProductByID(ctx context.Context, id string) (Product, error) {
	client, err := getClient()
	if err != nil {
		return Product{}, err
	}

	out, err := client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(productsTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return Product{}, fmt.Errorf("get product: %w", err)
	}

	if out.Item == nil {
		return Product{}, ErrProductNotFound
	}

	var product Product
	if err := attributevalue.UnmarshalMap(out.Item, &product); err != nil {
		return Product{}, fmt.Errorf("unmarshal product: %w", err)
	}

	return product, nil
}

func UpdateProduct(ctx context.Context, product Product) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	exprValues := map[string]types.AttributeValue{
		":name":  &types.AttributeValueMemberS{Value: product.Name},
		":desc":  &types.AttributeValueMemberS{Value: product.Description},
		":price": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", product.Price)},
		":stock": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", product.Stock)},
	}

	_, err = client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(productsTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: product.ID},
		},
		UpdateExpression:          aws.String("SET name = :name, description = :desc, price = :price, stock = :stock"),
		ConditionExpression:       aws.String("attribute_exists(id)"),
		ExpressionAttributeValues: exprValues,
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return ErrProductNotFound
		}
		return fmt.Errorf("update product: %w", err)
	}

	return nil
}

func DeleteProduct(ctx context.Context, id string) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	_, err = client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(productsTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
		ConditionExpression: aws.String("attribute_exists(id)"),
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return ErrProductNotFound
		}
		return fmt.Errorf("delete product: %w", err)
	}

	return nil
}
