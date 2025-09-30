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

// User represents a user in the system.
type User struct {
	ID           string    `json:"id" dynamodbav:"id"`
	Username     string    `json:"username" dynamodbav:"username"`
	Email        string    `json:"email" dynamodbav:"email"`
	PasswordHash string    `json:"-" dynamodbav:"password_hash"`
	FullName     string    `json:"full_name" dynamodbav:"full_name"`
	Role         string    `json:"role" dynamodbav:"role"`
	CreatedAt    time.Time `json:"created_at" dynamodbav:"created_at"`
	LastLogin    time.Time `json:"last_login" dynamodbav:"last_login"`
}

var (
	ErrUserNotFound = errors.New("user not found")
)

// CreateUser persists a new user.
func CreateUser(ctx context.Context, user User) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("marshal user: %w", err)
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(usersTable),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
	})
	if err != nil {
		return fmt.Errorf("put user: %w", err)
	}

	return nil
}

// GetUserByEmail fetches a user by email address.
func GetUserByEmail(ctx context.Context, email string) (User, error) {
	client, err := getClient()
	if err != nil {
		return User{}, err
	}

	out, err := client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(usersTable),
		IndexName:              aws.String("email-index"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":email": &types.AttributeValueMemberS{Value: email},
		},
		Limit: aws.Int32(1),
	})
	if err != nil {
		return User{}, fmt.Errorf("query user by email: %w", err)
	}

	if len(out.Items) == 0 {
		return User{}, ErrUserNotFound
	}

	var user User
	if err := attributevalue.UnmarshalMap(out.Items[0], &user); err != nil {
		return User{}, fmt.Errorf("unmarshal user: %w", err)
	}

	return user, nil
}

// GetUserByID fetches a user by id.
func GetUserByID(ctx context.Context, id string) (User, error) {
	client, err := getClient()
	if err != nil {
		return User{}, err
	}

	out, err := client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return User{}, fmt.Errorf("get user: %w", err)
	}

	if out.Item == nil {
		return User{}, ErrUserNotFound
	}

	var user User
	if err := attributevalue.UnmarshalMap(out.Item, &user); err != nil {
		return User{}, fmt.Errorf("unmarshal user: %w", err)
	}

	return user, nil
}

// UpdateUser updates mutable columns for a user.
func UpdateUser(ctx context.Context, user User) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	exprVals := map[string]types.AttributeValue{
		":username":     &types.AttributeValueMemberS{Value: user.Username},
		":email":        &types.AttributeValueMemberS{Value: user.Email},
		":passwordHash": &types.AttributeValueMemberS{Value: user.PasswordHash},
		":fullName":     &types.AttributeValueMemberS{Value: user.FullName},
		":role":         &types.AttributeValueMemberS{Value: user.Role},
	}

	if user.LastLogin.IsZero() {
		exprVals[":lastLogin"] = &types.AttributeValueMemberNULL{Value: true}
	} else {
		exprVals[":lastLogin"] = &types.AttributeValueMemberS{Value: user.LastLogin.Format(time.RFC3339Nano)}
	}

	_, err = client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: user.ID},
		},
		UpdateExpression:          aws.String("SET username = :username, email = :email, password_hash = :passwordHash, full_name = :fullName, #role = :role, last_login = :lastLogin"),
		ConditionExpression:       aws.String("attribute_exists(id)"),
		ExpressionAttributeValues: exprVals,
		ExpressionAttributeNames: map[string]string{
			"#role": "role",
		},
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return ErrUserNotFound
		}
		return fmt.Errorf("update user: %w", err)
	}

	return nil
}

// UserExists tests for existing username or email conflicts.
func UserExists(ctx context.Context, username, email string) (bool, error) {
	client, err := getClient()
	if err != nil {
		return false, err
	}

	if email != "" {
		out, err := client.Query(ctx, &dynamodb.QueryInput{
			TableName:              aws.String(usersTable),
			IndexName:              aws.String("email-index"),
			KeyConditionExpression: aws.String("email = :email"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":email": &types.AttributeValueMemberS{Value: email},
			},
			Limit: aws.Int32(1),
		})
		if err != nil {
			return false, fmt.Errorf("check email existence: %w", err)
		}
		if len(out.Items) > 0 {
			return true, nil
		}
	}

	if username != "" {
		out, err := client.Query(ctx, &dynamodb.QueryInput{
			TableName:              aws.String(usersTable),
			IndexName:              aws.String("username-index"),
			KeyConditionExpression: aws.String("username = :username"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":username": &types.AttributeValueMemberS{Value: username},
			},
			Limit: aws.Int32(1),
		})
		if err != nil {
			return false, fmt.Errorf("check username existence: %w", err)
		}
		if len(out.Items) > 0 {
			return true, nil
		}
	}

	return false, nil
}

func UpdateUserLastLogin(ctx context.Context, id string, lastLogin time.Time) error {
	client, err := getClient()
	if err != nil {
		return err
	}

	var value types.AttributeValue
	if lastLogin.IsZero() {
		value = &types.AttributeValueMemberNULL{Value: true}
	} else {
		value = &types.AttributeValueMemberS{Value: lastLogin.Format(time.RFC3339Nano)}
	}

	_, err = client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
		UpdateExpression:          aws.String("SET last_login = :lastLogin"),
		ConditionExpression:       aws.String("attribute_exists(id)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{":lastLogin": value},
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return ErrUserNotFound
		}
		return fmt.Errorf("update last login: %w", err)
	}

	return nil
}

// GetAllUsers returns non-admin users for directory views.
func GetAllUsers(ctx context.Context) ([]User, error) {
	client, err := getClient()
	if err != nil {
		return nil, err
	}

	out, err := client.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(usersTable),
		FilterExpression: aws.String("#role <> :admin"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":admin": &types.AttributeValueMemberS{Value: "admin"},
		},
		ExpressionAttributeNames: map[string]string{
			"#role": "role",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("scan users: %w", err)
	}

	var users []User
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &users); err != nil {
		return nil, fmt.Errorf("unmarshal users: %w", err)
	}

	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, nil
}
