#!/bin/bash
set -e

STAGE=${1:-dev}

echo "=========================================="
echo "  Deploying AgentCore ($STAGE)"
echo "=========================================="

cd cdk
npm install
npm run build

export STAGE=$STAGE
export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}

npx cdk deploy --all --require-approval never --outputs-file outputs.json

echo ""
echo "✓ Deployment complete"
echo ""

if [ -f outputs.json ]; then
    echo "Stack Outputs:"
    cat outputs.json | python3 -m json.tool
fi
