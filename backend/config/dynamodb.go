package config

// DynamoConfig holds configuration for connecting to DynamoDB.
type DynamoConfig struct {
	Region   string
	Endpoint string
}

// GetDynamoConfig reads DynamoDB configuration from environment variables.
func GetDynamoConfig() DynamoConfig {
	return DynamoConfig{
		Region:   GetEnv("AWS_REGION", "us-west-2"),
		Endpoint: GetEnv("DYNAMODB_ENDPOINT", ""),
	}
}
