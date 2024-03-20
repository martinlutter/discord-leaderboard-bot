import { type SlashCommandBuilder } from '@discordjs/builders'
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import { type APIChatInputApplicationCommandInteraction, type APIInteractionResponse } from 'discord-api-types/v10'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { commands } from '../scripts/deployCommands'

export interface Command {
  builder: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: APIChatInputApplicationCommandInteraction) => Promise<APIInteractionResponse>
}

// const discordToken = process.env.DISCORD_TOKEN!
const publicKey = process.env.APPLICATION_PUBLIC_KEY!

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
  console.log(bodyObject)

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
