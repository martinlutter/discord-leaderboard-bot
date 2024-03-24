import { ContextMenuCommandBuilder } from '@discordjs/builders'
import { isContextMenuApplicationCommandInteraction } from 'discord-api-types/utils'
import { ApplicationCommandType, InteractionResponseType, MessageFlags, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseChannelMessageWithSource, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { db, type Command } from '..'
import { saveVote } from '../db/storeVote'
import { voteForUser } from '../db/voteForUser'
import { buildLeaderboard } from '../process/buildLeaderboard'

export const leaderboardTableName = process.env.LEADERBOARD_TABLE_NAME!

const builder = new ContextMenuCommandBuilder()
  .setName('vote')
  .setType(ApplicationCommandType.Message)

const execute = async (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
  if (!isContextMenuApplicationCommandInteraction(interaction)) {
    throw new Error('Expected a context menu interaction')
  }

  const messages = interaction.data.resolved?.messages
  if (!messages) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'No messages found :(',
        flags: MessageFlags.Ephemeral
      }
    }
  }

  const [[messageId, message]] = Object.entries(messages)
  const votee = message.author
  const voter = interaction.member!.user

  if (votee.id === voter.id) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'You cannot vote for yourself',
        flags: MessageFlags.Ephemeral
      }
    }
  }

  const currentWeekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  // if (await hasUserVotedThisWeek(voter.id, currentWeekNumber)) {
  //   return {
  //     type: InteractionResponseType.ChannelMessageWithSource,
  //     data: {
  //       content: 'You have already voted this week',
  //       flags: MessageFlags.Ephemeral
  //     }
  //   }
  // }

  const userVotes = await voteForUser(votee)

  const [leaderboard] = await Promise.all([
    buildLeaderboard(),
    saveVote({
      voterId: voter.id,
      voteeId: votee.id,
      weekNumber: currentWeekNumber,
      channelId: message.channel_id,
      messageId,
      votedAt: new Date().toISOString()
    })
  ])

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `You voted for ${votee.username}, they now have ${Number(userVotes.count)} votes!`,
      embeds: [leaderboard.data],
      flags: MessageFlags.Ephemeral
    }
  }
}

export const voteCommand: Command = { builder, execute }

async function hasUserVotedThisWeek (userId: string, weekNumber: number): Promise<boolean> {
  const result = await db.get({
    TableName: leaderboardTableName,
    Key: {
      pk: `vote${weekNumber}`,
      sk: `user${userId}`
    }
  })

  return result.Item !== undefined
}
