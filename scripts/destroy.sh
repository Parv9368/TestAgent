#!/bin/bash
set -e

STAGE=${1:-dev}

echo "=========================================="
echo "  WARNING: DESTROYING STACK ($STAGE)"
echo "=========================================="
echo ""
echo "This will delete all resources in the stack."
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

cd cdk
export STAGE=$STAGE

npx cdk destroy --all --force

echo "✓ Stack destroyed"
