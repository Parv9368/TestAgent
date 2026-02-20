#!/bin/bash
set -e

echo "=========================================="
echo "  Bootstrapping AWS CDK"
echo "=========================================="

cd cdk
npm install

ACCOUNT=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
REGION=${AWS_DEFAULT_REGION:-us-west-2}

echo "Account: $ACCOUNT"
echo "Region:  $REGION"

npx cdk bootstrap aws://$ACCOUNT/$REGION

echo "✓ CDK bootstrap complete"
