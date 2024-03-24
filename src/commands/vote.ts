import { type PutCommandOutput, type UpdateCommandOutput } from '@aws-sdk/lib-dynamodb'
import { ContextMenuCommandBuilder, EmbedBuilder } from '@discordjs/builders'
import { isContextMenuApplicationCommandInteraction } from 'discord-api-types/utils'
import { ApplicationCommandType, InteractionResponseType, MessageFlags, type APIChatInputApplicationCommandInteraction, type APIEmbedField, type APIInteractionResponseChannelMessageWithSource, type APIMessage, type APIMessageApplicationCommandInteraction, type APIUser } from 'discord-api-types/v10'
import { db, type Command } from '..'

// const USER_OPTION_NAME = 'user'
export const leaderboardTableName = process.env.LEADERBOARD_TABLE_NAME!

// const builder = new SlashCommandBuilder()
//   .setName('vote')
//   .setDescription('Give your vote to a user.')
//   .addUserOption(option => option
//     .setName(USER_OPTION_NAME)
//     .setDescription('The user you want to vote for.')
//     .setRequired(true)
//   )
const builder = new ContextMenuCommandBuilder()
  .setName('vote')
  .setType(ApplicationCommandType.Message)

const execute = async (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
  if (!isContextMenuApplicationCommandInteraction(interaction)) {
    throw new Error('Expected a context menu interaction')
  }

  console.log('interaction', interaction)
  console.log('interaction', interaction.data.resolved?.messages)

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
  if (await hasUserVotedThisWeek(voter.id, currentWeekNumber)) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'You have already voted this week',
        flags: MessageFlags.Ephemeral
      }
    }
  }
  await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'user'
    }
  })

  const saveVotePromise = saveVote(voter, currentWeekNumber, message, messageId)
  const incrementVotesResult = await incrementVotes(votee)
  const currentVotes = Number(incrementVotesResult.Attributes?.count)
  // todo: should probably invert partition and sort keys so we don't have to keep a singleton leaderboard record but can query all voted users instead
  const leaderboardResult = await updateLeaderboard(votee, currentVotes)

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

function transformLeaderboardIntoEmbedFields (leaderboardResult: UpdateCommandOutput): APIEmbedField[] {
  return Object.entries(leaderboardResult.Attributes!)
    .filter(([key, value]) => key.startsWith('user'))
    .map(([key, value]): APIEmbedField => {
      return {
        name: value.name,
        value: String(value.count)
      }
    })
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 24)
}

async function updateLeaderboard (votee: APIUser, currentVotes: number): Promise<UpdateCommandOutput> {
  return await db.update({
    TableName: leaderboardTableName,
    Key: {
      pk: 'leaderboard',
      sk: 'votes'
    },
    UpdateExpression: 'SET #user = :user',
    ExpressionAttributeNames: {
      '#user': `user${votee.id}`
    },
    ExpressionAttributeValues: {
      ':user': {
        name: votee.username,
        count: currentVotes
      }
    },
    ReturnValues: 'ALL_NEW'
  })
}

async function saveVote (voter: APIUser, currentWeekNumber: number, message: APIMessage, messageId: string): Promise<PutCommandOutput> {
  return await db.put({
    TableName: leaderboardTableName,
    Item: {
      pk: `user${voter.id}`,
      sk: `vote${currentWeekNumber}`,
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
      pk: `user${votee.id}`,
      sk: 'votes'
    },
    UpdateExpression: 'ADD #count :inc',
    ExpressionAttributeNames: {
      '#count': 'count'
    },
    ExpressionAttributeValues: {
      ':inc': 1
    },
    ReturnValues: 'ALL_NEW'
  })
}

async function hasUserVotedThisWeek (userId: string, weekNumber: number): Promise<boolean> {
  const result = await db.get({
    TableName: leaderboardTableName,
    Key: {
      pk: `user${userId}`,
      sk: `vote${weekNumber}`
    }
  })

  return result.Item !== undefined
}
