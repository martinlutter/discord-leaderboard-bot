import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import dotenv from 'dotenv'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { type APIChatInputApplicationCommandInteraction, type APIApplicationCommandInteractionDataStringOption } from 'discord-api-types/v10'
import { REST } from '@discordjs/rest'
import { API } from '@discordjs/core'

dotenv.config()
const discordToken = process.env.DISCORD_TOKEN!
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

    if (interaction.data.name === 'ping') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Pong!'
          }
        })
      }
    }

    if (interaction.data.name === 'user') {
      // const rest = new REST({ version: '10' }).setToken(discordToken)
      // const api = new API(rest)

      const target = (interaction.data.options?.find(option => option.name === 'target') as APIApplicationCommandInteractionDataStringOption | null)?.value
      console.log(target)
      // const userResponse = await api.users.get(target!)
      const user = interaction.data.resolved?.users?.[target!]
      if (!user) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'User not found'
            }
          })
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `User: ${user.username} - ${user.email}`
          }
        })
      }
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: 'Not supported' })
  }
}
