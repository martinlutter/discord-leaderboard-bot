import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders'
import { InteractionResponseType, type APIApplicationCommandInteractionDataUserOption, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10'
import { type Command } from '..'

const USER_OPTION_NAME = 'user'

const builder = new SlashCommandBuilder()
  .setName('vote')
  .setDescription('Give your vote to a user.')
  .addUserOption(option => option
    .setName(USER_OPTION_NAME)
    .setDescription('The user you want to vote for.')
    .setRequired(true)
  )

const execute = async (interaction: APIChatInputApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
  const user = interaction.data.resolved?.users?.[(interaction.data.options!.find(option => option.name === USER_OPTION_NAME)! as APIApplicationCommandInteractionDataUserOption).value]
  if (!user) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'User not found'
      }
    }
  }

  if (user.id === interaction.member!.user.id) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'You cannot vote for yourself'
      }
    }
  }

  // check if user has already voted this week
  // add vote to user
  // fetch current votes for user
  // fetch current leaderboard and put it into embed

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `You voted for ${user.username}, they now have 10 votes!`,
      embeds: [
        new EmbedBuilder()
          .setTitle('Leaderboard')
          .setFields([
            {
              name: user.username,
              value: '10 votes'
            },
            {
              name: 'User 2',
              value: '5 votes'
            }
          ])
          .data
      ]
    }
  }
}

export const voteCommand: Command = { builder, execute }
