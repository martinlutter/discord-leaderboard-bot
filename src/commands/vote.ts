import { type PutCommandOutput, type QueryCommandOutput, type UpdateCommandOutput } from '@aws-sdk/lib-dynamodb'
import { ContextMenuCommandBuilder, EmbedBuilder } from '@discordjs/builders'
import { isContextMenuApplicationCommandInteraction } from 'discord-api-types/utils'
import { ApplicationCommandType, InteractionResponseType, MessageFlags, type APIChatInputApplicationCommandInteraction, type APIEmbedField, type APIInteractionResponseChannelMessageWithSource, type APIMessage, type APIMessageApplicationCommandInteraction, type APIUser } from 'discord-api-types/v10'
import { db, type Command } from '..'

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

  // if (votee.id === voter.id) {
  //   return {
  //     type: InteractionResponseType.ChannelMessageWithSource,
  //     data: {
  //       content: 'You cannot vote for yourself',
  //       flags: MessageFlags.Ephemeral
  //     }
  //   }
  // }

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

  const saveVotePromise = saveVote(voter, currentWeekNumber, message, messageId)
  const incrementVotesResult = await incrementVotes(votee)
  const currentVotes = Number(incrementVotesResult.Attributes?.count)
  const leaderboardResult = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'votes'
    }
  })

  await saveVotePromise

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `You voted for ${votee.username}, they now have ${currentVotes} votes!`,
      embeds: [
        new EmbedBuilder()
          .setTitle('Leaderboard')
          .setFields(transformLeaderboardIntoEmbedFields(leaderboardResult))
          .data
      ],
      flags: MessageFlags.Ephemeral
    }
  }
}

export const voteCommand: Command = { builder, execute }

function transformLeaderboardIntoEmbedFields (leaderboardResult: QueryCommandOutput): APIEmbedField[] {
  return Object.entries(leaderboardResult.Items ?? {})
    .map(([key, value]): APIEmbedField => {
      return {
        name: value.name,
        value: String(value.count)
      }
    })
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 24)
}

async function saveVote (voter: APIUser, currentWeekNumber: number, message: APIMessage, messageId: string): Promise<PutCommandOutput> {
  return await db.put({
    TableName: leaderboardTableName,
    Item: {
      pk: `vote${currentWeekNumber}`,
      sk: `user${voter.id}`,
      votedAt: new Date().toISOString(),
      channelId: message.channel_id,
      messageId
    }
  })
}

async function incrementVotes (votee: APIUser): Promise<UpdateCommandOutput> {
  return await db.update({
    TableName: leaderboardTableName,
    Key: {
      pk: 'votes',
      sk: `user${votee.id}`
    },
    UpdateExpression: 'ADD #count :inc SET #name = :name',
    ExpressionAttributeNames: {
      '#count': 'count',
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':name': votee.username
    },
    ReturnValues: 'ALL_NEW'
  })
}

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
