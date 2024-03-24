import { API } from '@discordjs/core/http-only'
import { REST } from '@discordjs/rest'
import { type Context, type EventBridgeEvent } from 'aws-lambda'
import { clearVotesFromUsers } from './db/clearVotesFromUsers'
import { buildLeaderboard } from './process/buildLeaderboard'

const discordToken = process.env.DISCORD_TOKEN!
const channelId = process.env.CHANNEL_ID!

const rest = new REST({ version: '10' }).setToken(discordToken)
const api = new API(rest)

export const handler = async (event: EventBridgeEvent<'MonthlyCron', void>, context: Context): Promise<void> => {
  const leaderboard = await buildLeaderboard()
  const createMessage = api.channels.createMessage(channelId, {
    content: 'The month has ended! Here are the final results:',
    embeds: [leaderboard.data]
  })

  await Promise.all([createMessage, clearVotesFromUsers()])
}
