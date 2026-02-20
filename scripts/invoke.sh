#!/bin/bash
set -e

STAGE=${1:-dev}
PROMPT="${2:-Hello, how can you help me?}"

STACK_NAME="${PROJECT_NAME:-my-agentcore-project}-$STAGE"

echo "=========================================="
echo "  Invoking AgentCore Runtime"
echo "=========================================="

# Get Runtime ARN from CloudFormation outputs
RUNTIME_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`RuntimeArn`].OutputValue' \
  --output text \
  --region ${AWS_DEFAULT_REGION:-us-west-2})

if [ -z "$RUNTIME_ARN" ]; then
    echo "✗ Could not find Runtime ARN"
    echo "  Make sure the stack $STACK_NAME is deployed"
    exit 1
fi

echo "Runtime ARN: $RUNTIME_ARN"
echo "Prompt: $PROMPT"
echo ""

# Create invocation payload
PAYLOAD=$(cat <<EOF
{
  "prompt": "$PROMPT"
}
EOF
)

# Invoke the agent runtime
python3 << 'PYEOF'
import boto3
import json
import sys
import os

runtime_arn = os.environ.get('RUNTIME_ARN')
payload = os.environ.get('PAYLOAD')
region = os.environ.get('AWS_DEFAULT_REGION', 'us-west-2')

client = boto3.client('bedrock-agentcore', region_name=region)

try:
    response = client.invoke_agent_runtime(
        agentRuntimeArn=runtime_arn,
        payload=payload.encode('utf-8')
    )
    
    result = json.loads(response['body'].read().decode('utf-8'))
    print(json.dumps(result, indent=2))
    
except Exception as e:
    print(f"Error invoking agent: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF
