import * as cdk from 'aws-cdk-lib';
import * as agentcore from '@aws-cdk/aws-bedrock-agentcore-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';

export interface AgentCoreStackProps extends cdk.StackProps {
  stage: string;
  agentName: string;
  modelId: string;
  enableMemory: boolean;
  memoryStrategy: string;
  enableGateway: boolean;
  networkMode: string;
}

export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentCoreStackProps) {
    super(scope, id, props);

    const { stage, agentName, modelId, enableMemory, memoryStrategy, enableGateway, networkMode } = props;
    const namePrefix = `${agentName}-${stage}`;

    // ── IAM Execution Role ──────────────────────────────────────────────────
    const agentRole = new iam.Role(this, 'AgentRole', {
      roleName: `${namePrefix}-agentcore-role`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
        new iam.ServicePrincipal('bedrock.amazonaws.com'),
      ),
      description: `Execution role for AgentCore agent ${agentName}`,
    });

    // Bedrock model access
    agentRole.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockModelAccess',
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));

    // CloudWatch logs
    agentRole.addToPolicy(new iam.PolicyStatement({
      sid: 'CloudWatchLogs',
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    // X-Ray tracing
    agentRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // ECR access for pulling images
    agentRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ECRAccess',
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
      ],
      resources: ['*'],
    }));

    // ── Memory (Optional) ───────────────────────────────────────────────────
    let memory: agentcore.Memory | undefined;
    if (enableMemory) {
      let strategies: agentcore.ManagedMemoryStrategy[] = [];
      switch (memoryStrategy) {
        case 'SUMMARY':
          strategies = [agentcore.MemoryStrategy.usingBuiltInSummarization()];
          break;
        case 'USER_PREFERENCE':
          strategies = [agentcore.MemoryStrategy.usingBuiltInUserPreference()];
          break;
        case 'EPISODIC':
          strategies = [agentcore.MemoryStrategy.usingBuiltInEpisodic()];
          break;
        case 'SEMANTIC':
        default:
          strategies = [agentcore.MemoryStrategy.usingBuiltInSemantic()];
      }

      memory = new agentcore.Memory(this, 'Memory', {
        memoryName: `${namePrefix}_memory`.replace(/-/g, '_'),
        description: `Memory for ${agentName}`,
        expirationDuration: cdk.Duration.days(90),
        memoryStrategies: strategies,
      });

      agentRole.addToPolicy(new iam.PolicyStatement({
        sid: 'MemoryAccess',
        actions: [
          'bedrock:GetAgentMemory',
          'bedrock:DeleteAgentMemory',
        ],
        resources: [memory.memoryArn],
      }));

      new cdk.CfnOutput(this, 'MemoryName', {
        value: memory.memoryName,
        description: 'Memory Name',
      });
      
      new cdk.CfnOutput(this, 'MemoryArn', {
        value: memory.memoryArn,
        description: 'Memory ARN',
      });
    }

    // ── Gateway (Optional) ──────────────────────────────────────────────────
    let gateway: agentcore.Gateway | undefined;
    if (enableGateway) {
      gateway = new agentcore.Gateway(this, 'Gateway', {
        gatewayName: `${namePrefix}-gateway`,
        description: `MCP Gateway for ${agentName}`,
      });

      new cdk.CfnOutput(this, 'GatewayArn', {
        value: gateway.gatewayArn,
        description: 'Gateway ARN',
      });
      
      new cdk.CfnOutput(this, 'GatewayId', {
        value: gateway.gatewayId,
        description: 'Gateway ID',
      });
    }

    // ── AgentCore Runtime ───────────────────────────────────────────────────
    const runtimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
      path.join(__dirname, '../../agent'),
      {
        bundling: {
          platform: 'linux/arm64',
        },
      }
    );

    const runtime = new agentcore.Runtime(this, 'Runtime', {
      runtimeName: `${namePrefix}_runtime`.replace(/-/g, '_'),
      description: `AgentCore Runtime for ${agentName}`,
      executionRole: agentRole,
      agentRuntimeArtifact: runtimeArtifact,
      networkConfiguration: agentcore.RuntimeNetworkConfiguration.usingPublicNetwork(),
      environmentVariables: {
        STAGE: stage,
        BEDROCK_MODEL_ID: modelId,
        LOG_LEVEL: stage === 'prod' ? 'INFO' : 'DEBUG',
        AWS_REGION: this.region,
        AWS_DEFAULT_REGION: this.region,
        ...(enableMemory && memory ? { MEMORY_NAME: memory.memoryName } : {}),
        ...(enableGateway && gateway ? { GATEWAY_ID: gateway.gatewayId } : {}),
      },
    });

    // ── Runtime Endpoint ────────────────────────────────────────────────────
    const endpoint = runtime.addEndpoint('DEFAULT', {
      description: 'Default endpoint for the latest runtime version',
    });

    // ── Observability ───────────────────────────────────────────────────────
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/bedrock-agentcore/runtimes/${namePrefix}`,
      retention: stage === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.TWO_WEEKS,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ── Outputs ─────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'RuntimeArn', {
      value: runtime.agentRuntimeArn,
      description: 'AgentCore Runtime ARN',
      exportName: `${id}-RuntimeArn`,
    });

    new cdk.CfnOutput(this, 'RuntimeName', {
      value: runtime.agentRuntimeName,
      description: 'AgentCore Runtime Name',
    });

    new cdk.CfnOutput(this, 'RuntimeId', {
      value: runtime.agentRuntimeId,
      description: 'AgentCore Runtime ID',
    });

    new cdk.CfnOutput(this, 'EndpointName', {
      value: 'DEFAULT',
      description: 'Runtime Endpoint Name',
    });

    new cdk.CfnOutput(this, 'AgentRoleArn', {
      value: agentRole.roleArn,
      description: 'Agent execution role ARN',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group name',
    });

    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: this.region,
      description: 'Deployment region',
    });

    new cdk.CfnOutput(this, 'DeploymentAccount', {
      value: this.account,
      description: 'Deployment account',
    });
  }
}
