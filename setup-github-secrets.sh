#!/bin/bash
################################################################################
# GitHub Secrets Setup Helper
# Configures GitHub repository secrets from local AWS credentials using gh CLI
# Prerequisites: gh CLI installed and authenticated (run: gh auth login)
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  GitHub Secrets Setup — AgentCore                          ${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}  Install: https://cli.github.com/${NC}"
    echo -e "${YELLOW}  Or set secrets manually in GitHub → Settings → Secrets${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠ Not authenticated with GitHub CLI${NC}"
    echo -e "${BLUE}  Running: gh auth login${NC}"
    gh auth login
fi

echo -e "\n${CYAN}→ Reading AWS credentials from local configuration...${NC}"

# Read AWS credentials from qubitz profile
AWS_KEY=$(aws configure get aws_access_key_id --profile qubitz 2>/dev/null || echo "")
AWS_SECRET=$(aws configure get aws_secret_access_key --profile qubitz 2>/dev/null || echo "")
AWS_REG=$(aws configure get region --profile qubitz 2>/dev/null || echo "us-west-2")
AWS_ACCOUNT=$(aws sts get-caller-identity --profile qubitz --query Account --output text 2>/dev/null || echo "")

# Prompt if missing
if [ -z "$AWS_KEY" ]; then
    read -sp "$(echo -e ${BLUE}Enter AWS_ACCESS_KEY_ID:${NC} )" AWS_KEY
    echo ""
fi

if [ -z "$AWS_SECRET" ]; then
    read -sp "$(echo -e ${BLUE}Enter AWS_SECRET_ACCESS_KEY:${NC} )" AWS_SECRET
    echo ""
fi

if [ -z "$AWS_REG" ]; then
    read -p "$(echo -e ${BLUE}Enter AWS_DEFAULT_REGION [us-west-2]:${NC} )" AWS_REG
    AWS_REG=${AWS_REG:-us-west-2}
fi

if [ -z "$AWS_ACCOUNT" ]; then
    read -p "$(echo -e ${BLUE}Enter AWS_ACCOUNT_ID:${NC} )" AWS_ACCOUNT
fi

echo -e "\n${CYAN}→ Setting GitHub repository secrets...${NC}"

# Set secrets using gh CLI
echo "$AWS_KEY" | gh secret set AWS_ACCESS_KEY_ID
echo -e "${GREEN}✓ AWS_ACCESS_KEY_ID${NC}"

echo "$AWS_SECRET" | gh secret set AWS_SECRET_ACCESS_KEY
echo -e "${GREEN}✓ AWS_SECRET_ACCESS_KEY${NC}"

echo "$AWS_ACCOUNT" | gh secret set AWS_ACCOUNT_ID
echo -e "${GREEN}✓ AWS_ACCOUNT_ID${NC}"

echo "$AWS_REG" | gh secret set AWS_DEFAULT_REGION
echo -e "${GREEN}✓ AWS_DEFAULT_REGION${NC}"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  GitHub Secrets Configured! ✓                              ${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}  Now you can push to GitHub and the workflow will run.${NC}"
echo -e "${CYAN}  Verify secrets: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions${NC}"
