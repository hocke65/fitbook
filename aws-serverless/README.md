# Lynx Fitbook - AWS Serverless

Serverless version of the Lynx Fitness Booking Platform using AWS SAM.

## Architecture

- **API Gateway** (HTTP API) - Cost-effective API routing
- **Lambda** (Node.js 20) - Serverless compute
- **DynamoDB** (On-Demand) - Pay-per-request NoSQL database
- **S3 + CloudFront** - Static frontend hosting with HTTPS

## Cost Optimization

This architecture is optimized for low cost:

1. **HTTP API** instead of REST API (~70% cheaper)
2. **DynamoDB On-Demand** - Pay only for what you use
3. **Lambda 256MB** - Minimal memory allocation
4. **Single DynamoDB table** - Reduced table costs

Expected costs for low traffic (~50 users):
- **Lambda**: ~$0.00 (free tier: 1M requests/month)
- **API Gateway**: ~$0.00 (free tier: 1M requests/month)
- **DynamoDB**: ~$0.00 - $1.00 (on-demand pricing)
- **S3**: ~$0.01 (a few MB of static files)
- **CloudFront**: ~$0.50 - $1.00 (PriceClass_100 - EU/NA only)

**Total estimated: $0.50 - $2.00/month**

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20.x

## Deployment

### First-time deployment

```bash
cd aws-serverless

# Install dependencies
cd src && npm install && cd ..

# Build and deploy (guided)
sam build
sam deploy --guided
```

You'll be prompted for:
- **Stack Name**: fitbook-serverless
- **AWS Region**: your preferred region (e.g., eu-north-1)
- **JwtSecret**: A secure string (min 32 characters)
- **AzureTenantId**: Your Microsoft Entra ID tenant (optional)
- **AzureClientId**: Your Microsoft Entra ID client ID (optional)
- **Stage**: prod or dev

### Subsequent deployments

```bash
sam build && sam deploy
```

### Deploy Frontend

After backend deployment, deploy the React frontend:

```bash
# Set your Azure/Entra ID credentials (if using)
export REACT_APP_AZURE_CLIENT_ID=your-client-id
export REACT_APP_AZURE_TENANT_ID=your-tenant-id

# Deploy frontend
./scripts/deploy-frontend.sh
```

This script will:
1. Build the React app with the correct API URL
2. Upload to S3
3. Invalidate CloudFront cache

The CloudFront URL will be printed at the end.

### Seed initial data

After deployment, seed the database with sample data:

```bash
# Get the table name from CloudFormation outputs
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name fitbook-serverless \
  --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" \
  --output text)

# Run seed script
node scripts/seed-data.js $TABLE_NAME
```

Default admin credentials: `admin@example.com` / `admin123`

## Local Development

```bash
# Start local API
sam local start-api

# Test a function
sam local invoke GetClassesFunction
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Local login | - |
| POST | /api/auth/entra-login | Entra ID login | - |
| GET | /api/auth/me | Get current user | JWT |
| GET | /api/classes | List future classes | - |
| GET | /api/classes/{id} | Get class details | - |
| POST | /api/classes | Create class | Admin |
| PUT | /api/classes/{id} | Update class | Admin |
| DELETE | /api/classes/{id} | Delete class | Admin |
| GET | /api/bookings | User's bookings | JWT |
| POST | /api/bookings/{classId} | Book a class | JWT |
| DELETE | /api/bookings/{classId} | Cancel booking | JWT |
| GET | /api/bookings/class/{classId} | Class participants | JWT |
| GET | /api/users | List users | Admin |
| GET | /api/users/{id} | Get user | Admin |
| POST | /api/users | Create user | Admin |
| PUT | /api/users/{id} | Update user | Admin |
| DELETE | /api/users/{id} | Delete user | Admin |
| GET | /api/health | Health check | - |

## DynamoDB Data Model

Single-table design with the following access patterns:

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| User | USER#{id} | USER#{id} | EMAIL#{email} | USER#{id} |
| Class | CLASS#{id} | CLASS#{id} | CLASSES | {scheduledAt}#{id} |
| Booking | USER#{userId} | BOOKING#{classId} | CLASS#{classId} | BOOKING#{userId} |

GSI2 is used for Entra ID lookups: `GSI2PK=ENTRA#{entraId}`

## Frontend Configuration

The `deploy-frontend.sh` script automatically configures the frontend with the correct API URL and CloudFront redirect URI. Just set the Azure environment variables before running:

```bash
export REACT_APP_AZURE_CLIENT_ID=your-client-id
export REACT_APP_AZURE_TENANT_ID=your-tenant-id
./scripts/deploy-frontend.sh
```

**Important**: Update your Entra ID app registration to add the CloudFront URL as an allowed redirect URI.

## Cleanup

To delete all resources:

```bash
# Empty the S3 bucket first (required before stack deletion)
aws s3 rm s3://$(aws cloudformation describe-stacks --stack-name fitbook-serverless \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucket'].OutputValue" --output text) --recursive

# Delete the stack
sam delete --stack-name fitbook-serverless
```

Note: DynamoDB table and S3 bucket are deleted with the stack. Add `DeletionPolicy: Retain` to keep data.
