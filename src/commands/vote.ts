import { ContextMenuCommandBuilder } from '@discordjs/builders'
import { isContextMenuApplicationCommandInteraction } from 'discord-api-types/utils'
import { ApplicationCommandType, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseCallbackData, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { type Command } from '..'
import { hasUserVotedByWeek } from '../db/hasUserVoted'
import { saveVote } from '../db/storeVote'
import { voteForUser } from '../db/voteForUser'
import { buildLeaderboard } from '../process/buildLeaderboard'

const builder = new ContextMenuCommandBuilder()
  .setName('vote')
  .setType(ApplicationCommandType.Message)

const execute = async (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction): Promise<APIInteractionResponseCallbackData> => {
  if (!isContextMenuApplicationCommandInteraction(interaction)) {
    throw new Error('Expected a context menu interaction')
  }

  const messages = interaction.data.resolved?.messages
  if (!messages) {
    return {
      content: 'No messages found :('
    }
  }

  const [[messageId, message]] = Object.entries(messages)
  const votee = message.author
  const voter = interaction.member!.user

  if (votee.id === voter.id) {
    return {
      content: 'You cannot vote for yourself'
    }
  }

  const currentWeekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  if (await hasUserVotedByWeek(voter.id, currentWeekNumber)) {
    return {
      content: 'You have already voted this week'
    }
  }

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
    content: `You voted for ${votee.username}, they now have ${userVotes.count} vote${userVotes.count > 1 ? 's' : ''}!`,
    embeds: [leaderboard.data]
  }
}

export const voteCommand: Command = { builder, execute }
