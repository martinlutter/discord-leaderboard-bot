import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import { MessageFlags, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseCallbackData, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { showLeaderboardCommand } from './commands/showLeaderboard'
import { showVoteMessagesCommand } from './commands/showVoteMessages'
import { voteCommand } from './commands/vote'

export interface Command {
  builder: { readonly name: string, toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody }
  execute: (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction) => Promise<APIInteractionResponseCallbackData>
}

export const commands = [
  voteCommand,
  showLeaderboardCommand,
  showVoteMessagesCommand
]

const publicKey = process.env.APPLICATION_PUBLIC_KEY!
const executeFunctionName = process.env.EXECUTE_FUNCTION_NAME!

const lambda = new LambdaClient()

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const lowercaseHeaders = Object.fromEntries(
    Object.entries(event.headers).map(([key, value]) => [key.toLowerCase(), value])
  )
  const signature = lowercaseHeaders['x-signature-ed25519']
  const timestamp = lowercaseHeaders['x-signature-timestamp']
  const body = event.body!

  if (!verifyKey(body, signature!, timestamp!, publicKey)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid request signature' })
    }
  }

  const bodyObject = JSON.parse(body)

  if (bodyObject.type === InteractionType.PING) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: InteractionResponseType.PONG })
    }
  }

  if (bodyObject.type === InteractionType.APPLICATION_COMMAND) {
    const interaction = bodyObject as APIChatInputApplicationCommandInteraction
    const command = commands.find(command => command.builder.name === interaction.data.name)

    if (!command) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Command not found' })
      }
    }

    await lambda.send(
      new InvokeCommand({
        FunctionName: executeFunctionName,
        Payload: JSON.stringify(interaction),
        InvocationType: InvocationType.Event
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: MessageFlags.Ephemeral } })
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: 'Not supported' })
  }
}
