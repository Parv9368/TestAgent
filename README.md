# parv

AWS Bedrock AgentCore agent with CDK deployment and GitHub Actions CI/CD.

## What is AgentCore?

Amazon Bedrock AgentCore enables you to deploy and operate highly effective agents securely, at scale using any framework and model.

Key components:

- **Runtime**: Secure, serverless runtime for deploying and scaling AI agents (up to 8-hour workloads)
- **Memory**: Managed memory infrastructure for context-aware agents
- **Gateway**: Managed MCP server that converts APIs and Lambda functions into MCP tools
- **Observability**: Trace, debug, and monitor agent performance via OpenTelemetry

## Agent Configuration

- **Agent**: test
- **Framework**: strands
- **Model**: us.anthropic.claude-sonnet-4-5-20250929-v1:0
- **Memory**: false (SEMANTIC)
- **Gateway**: false
- **Network**: PUBLIC
- **Region**: us-west-2

## Prerequisites

- Node.js 20+
- Python 3.12+
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker (for local testing)
- GitHub account with Actions enabled

## Installation

```bash
# Bootstrap CDK (first time only)
./scripts/bootstrap.sh

# Install dependencies
cd cdk && npm install
cd ../agent && pip install -r requirements.txt
```

## Deployment

### GitHub Actions (Recommended)

1. Configure GitHub Secrets (Settings → Secrets and variables → Actions):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ACCOUNT_ID`
   - `AWS_DEFAULT_REGION`

   See `.github/github-secrets-example.md` for detailed instructions.

2. Push to GitHub:
   ```bash
   git add -A
   git commit -m "Deploy agent"
   git push origin main
   ```

3. Workflow stages: build → deploy

### Local Deployment

```bash
./scripts/deploy.sh dev
./scripts/deploy.sh staging
./scripts/deploy.sh prod
```

## Testing

```bash
# Invoke agent
./scripts/invoke.sh dev "What can you help me with?"

# View logs
./scripts/logs.sh dev
```

## Project Structure

```
parv/
├── agent/
│   ├── agent.py              # Agent entrypoint
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container definition
│   └── .dockerignore
├── cdk/
│   ├── bin/app.ts            # CDK app entry point
│   ├── lib/agentcore-stack.ts # Infrastructure stack
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── scripts/
│   ├── bootstrap.sh          # CDK bootstrap
│   ├── deploy.sh             # Local deployment
│   ├── invoke.sh             # Test invocation
│   ├── logs.sh               # View logs
│   └── destroy.sh            # Clean up resources
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions workflow
└── README.md
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CI/CD       │────▶│  CDK Deploy  │────▶│ AgentCore    │
│  Pipeline    │     │  (Auto ECR)  │     │  Runtime     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Memory  │ │ Gateway  │ │   Logs   │
              │(Optional)│ │(Optional)│ │(CloudWatch│
              └──────────┘ └──────────┘ └──────────┘
```

## Cleanup

```bash
./scripts/destroy.sh dev
```

## Required IAM Permissions

- `iam:CreateServiceLinkedRole` for AgentCore
- `cloudformation:*` for CDK stack management
- `ecr:*` for container image management
- `bedrock:*` for AgentCore resources
- `logs:*` for CloudWatch Logs
- `sts:GetCallerIdentity`
