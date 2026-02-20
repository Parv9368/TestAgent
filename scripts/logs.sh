#!/bin/bash
set -e

STAGE=${1:-dev}
STACK_NAME="${PROJECT_NAME:-my-agentcore-project}-$STAGE"

# Get log group name from CloudFormation outputs
LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`LogGroupName`].OutputValue' \
  --output text \
  --region ${AWS_DEFAULT_REGION:-us-west-2})

if [ -z "$LOG_GROUP" ]; then
    echo "✗ Could not find Log Group"
    echo "  Make sure the stack $STACK_NAME is deployed"
    exit 1
fi

echo "Tailing logs from: $LOG_GROUP"
echo "Press Ctrl+C to exit"
echo ""

aws logs tail "$LOG_GROUP" --follow --region ${AWS_DEFAULT_REGION:-us-west-2}
