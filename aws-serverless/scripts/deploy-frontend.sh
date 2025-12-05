#!/bin/bash
set -e

STACK_NAME="${1:-fitbook-serverless}"
FRONTEND_DIR="../frontend"

echo "Fetching stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output json)

API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')
BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucket") | .OutputValue')
DISTRIBUTION_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
FRONTEND_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendUrl") | .OutputValue')

if [ -z "$BUCKET" ] || [ "$BUCKET" == "null" ]; then
    echo "Error: Could not find FrontendBucket in stack outputs"
    exit 1
fi

echo "API URL: $API_URL"
echo "S3 Bucket: $BUCKET"
echo "CloudFront Distribution: $DISTRIBUTION_ID"

# Build frontend with API URL
echo ""
echo "Building frontend..."
cd "$FRONTEND_DIR"

# Create .env file with API URL
cat > .env.production <<EOF
REACT_APP_API_URL=${API_URL}/api
REACT_APP_AZURE_CLIENT_ID=${REACT_APP_AZURE_CLIENT_ID:-}
REACT_APP_AZURE_TENANT_ID=${REACT_APP_AZURE_TENANT_ID:-}
REACT_APP_AZURE_REDIRECT_URI=${FRONTEND_URL}
EOF

npm install
npm run build

# Upload to S3
echo ""
echo "Uploading to S3..."
aws s3 sync build/ "s3://$BUCKET" --delete

# Invalidate CloudFront cache
echo ""
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" > /dev/null

echo ""
echo "Done! Frontend deployed to:"
echo "$FRONTEND_URL"
echo ""
echo "Note: CloudFront invalidation may take a few minutes to propagate."
