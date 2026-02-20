# GitHub Secrets Configuration

Configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUt...EXAMPLEKEY` |
| `AWS_ACCOUNT_ID` | AWS Account ID (12 digits) | `123456789012` |
| `AWS_DEFAULT_REGION` | AWS Region | `us-west-2` |

## How to Set Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret name and value from the table above
5. Click **Add secret**

## Getting AWS Credentials

Run these commands to get your AWS credentials:

```bash
# Get AWS Account ID
aws sts get-caller-identity --query Account --output text

# View AWS credentials (from ~/.aws/credentials)
cat ~/.aws/credentials
```

## Optional: Use GitHub CLI

You can also set secrets using the GitHub CLI (`gh`):

```bash
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set AWS_ACCOUNT_ID
gh secret set AWS_DEFAULT_REGION
```
