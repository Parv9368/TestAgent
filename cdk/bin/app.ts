#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AgentCoreStack } from '../lib/agentcore-stack';

const app = new cdk.App();

const stage = process.env.STAGE || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '599138915470';
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

new AgentCoreStack(app, `parv-${stage}`, {
  stage,
  agentName: 'test',
  modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  enableMemory: false,
  memoryStrategy: 'SEMANTIC',
  enableGateway: false,
  networkMode: 'PUBLIC',
  env: { account, region },
  tags: {
    Project: 'parv',
    Environment: stage,
    ManagedBy: 'CDK',
    Service: 'BedrockAgentCore',
  },
});

app.synth();
