import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { config } from 'dotenv'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

config()

const app = new cdk.App()

const stack = new cdk.Stack(app, 'MyStack')

const myLambda = new NodejsFunction(stack, 'MyLambda', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: 'src/index.ts',
  bundling: {
    minify: true
  },
  environment: {
    APPLICATION_PUBLIC_KEY: process.env.APPLICATION_PUBLIC_KEY!
  },
  logRetention: RetentionDays.ONE_MONTH,
  timeout: cdk.Duration.seconds(4),
  memorySize: 256
})

const api = new apigateway.RestApi(stack, 'MyApi', {
  restApiName: 'My API',
  deployOptions: {
    stageName: 'prod'
  }
})

const lambdaIntegration = new apigateway.LambdaIntegration(myLambda)

api.root.addMethod('POST', lambdaIntegration)

new cdk.CfnOutput(stack, 'MyApiUrl', {
  value: api.url
})

app.synth()
