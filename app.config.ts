import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { config } from 'dotenv'

config()

const app = new cdk.App()

const stack = new cdk.Stack(app, 'LeaderboardBot')

const interactionLambda = new NodejsFunction(stack, 'BotInteraction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: 'src/index.ts',
  bundling: {
    minify: false,
    sourceMap: true
  },
  environment: {
    APPLICATION_PUBLIC_KEY: process.env.APPLICATION_PUBLIC_KEY!,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN!
  },
  logRetention: RetentionDays.ONE_WEEK,
  timeout: cdk.Duration.seconds(4),
  memorySize: 256
})

const api = new apigateway.RestApi(stack, 'BotInteractionEndpoint', {
  deployOptions: {
    stageName: 'prod',
    throttlingRateLimit: 10,
    throttlingBurstLimit: 20
  }
})

api.root.addMethod('POST', new apigateway.LambdaIntegration(interactionLambda))

const leaderboardTable = new TableV2(stack, 'LeaderboardTable', {
  tableName: 'LeaderboardTable',
  partitionKey: { name: 'pk', type: AttributeType.STRING },
  sortKey: { name: 'sk', type: AttributeType.STRING },
  removalPolicy: cdk.RemovalPolicy.DESTROY
})
leaderboardTable.grantReadWriteData(interactionLambda)

interactionLambda.addEnvironment('LEADERBOARD_TABLE_NAME', 'LeaderboardTable')

app.synth()
