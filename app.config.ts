import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { config } from 'dotenv'

config()
const leaderboardTableName = 'LeaderboardTable'

const app = new App()

const stack = new Stack(app, 'LeaderboardBot')

const interactionLambda = new NodejsFunction(stack, 'BotInteraction', {
  runtime: Runtime.NODEJS_20_X,
  entry: 'src/index.ts',
  bundling: {
    minify: true
  },
  environment: {
    APPLICATION_PUBLIC_KEY: process.env.APPLICATION_PUBLIC_KEY!,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
    LEADERBOARD_TABLE_NAME: leaderboardTableName
  },
  logRetention: RetentionDays.ONE_WEEK,
  timeout: Duration.seconds(4),
  memorySize: 256
})

const api = new RestApi(stack, 'BotInteractionEndpoint', {
  deployOptions: {
    stageName: 'prod',
    throttlingRateLimit: 10,
    throttlingBurstLimit: 20
  }
})

api.root.addMethod('POST', new LambdaIntegration(interactionLambda))

const closeMonthLambda = new NodejsFunction(stack, 'CloseMonth', {
  runtime: Runtime.NODEJS_20_X,
  entry: 'src/closeMonth.ts',
  bundling: {
    minify: true
  },
  environment: {
    CHANNEL_ID: process.env.CHANNEL_ID!,
    DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
    LEADERBOARD_TABLE_NAME: leaderboardTableName
  },
  logRetention: RetentionDays.ONE_WEEK,
  timeout: Duration.seconds(10),
  memorySize: 256
})

const monthlyRule = new Rule(stack, 'MonthlyCron', {
  schedule: Schedule.cron({ minute: '0', hour: '0', day: '1', month: '*' })
})

monthlyRule.addTarget(new LambdaFunction(closeMonthLambda))

const leaderboardTable = new TableV2(stack, 'LeaderboardTable', {
  tableName: 'LeaderboardTable',
  partitionKey: { name: 'pk', type: AttributeType.STRING },
  sortKey: { name: 'sk', type: AttributeType.STRING },
  removalPolicy: RemovalPolicy.DESTROY
})
leaderboardTable.grantReadWriteData(interactionLambda)
leaderboardTable.grantReadWriteData(closeMonthLambda)

app.synth()
