import { SlashCommandBuilder } from '@discordjs/builders'
import { InteractionResponseType, MessageFlags, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseChannelMessageWithSource, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { type Command } from '..'
import { buildLeaderboard } from '../process/buildLeaderboard'

const builder = new SlashCommandBuilder()
  .setName('showleaderboard')
  .setDescription('Show the current leaderboard')

const execute = async (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
  const leaderboard = await buildLeaderboard()

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [leaderboard.data],
      flags: MessageFlags.Ephemeral
    }
  }
}

export const showLeaderboardCommand: Command = {
  builder,
  execute
}
