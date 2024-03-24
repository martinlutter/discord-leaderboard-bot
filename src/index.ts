import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { type ContextMenuCommandBuilder, type SlashCommandBuilder } from '@discordjs/builders'
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import { type APIChatInputApplicationCommandInteraction, type APIInteractionResponse, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { showLeaderboardCommand } from './commands/showLeaderboard'
import { voteCommand } from './commands/vote'

export interface Command {
  builder: Omit<SlashCommandBuilder | ContextMenuCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction) => Promise<APIInteractionResponse>
}

export const commands = [
  voteCommand,
  showLeaderboardCommand
]

// const discordToken = process.env.DISCORD_TOKEN!
const publicKey = process.env.APPLICATION_PUBLIC_KEY!

const client = new DynamoDB()
export const db = DynamoDBDocument.from(client)

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

    return {
      statusCode: 200,
      body: JSON.stringify(await command.execute(interaction))
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: 'Not supported' })
  }
}
