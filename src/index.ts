import { Client, Events, GatewayIntentBits, type Interaction } from 'discord.js'
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import dotenv from 'dotenv'
import { verifyKey } from 'discord-interactions'

dotenv.config()
// const discordToken = process.env.DISCORD_TOKEN!
const publicKey = process.env.APPLICATION_PUBLIC_KEY!

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] })

  client.once(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}`)
  })

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    const { commandName } = interaction

    if (commandName === 'ping') {
      await interaction.reply('Pong!')
    }
  })

  const signature = event.headers['X-Signature-Ed25519']
  const timestamp = event.headers['X-Signature-Timestamp']
  const body = event.body

  if (!verifyKey(body!, signature!, timestamp!, publicKey)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid request signature' })
    }
  }

  client.emit(Events.InteractionCreate, JSON.parse(body!) as Interaction)

  // client.login(discordToken)

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from AWS Lambda!' })
  }
}
