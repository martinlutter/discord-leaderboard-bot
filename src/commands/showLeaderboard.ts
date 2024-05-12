import { SlashCommandBuilder } from '@discordjs/builders'
import { type APIChatInputApplicationCommandInteraction, type APIInteractionResponseCallbackData, type APIMessageApplicationCommandInteraction } from 'discord-api-types/v10'
import { type Command } from '..'
import { buildLeaderboard } from '../process/buildLeaderboardEmbed'

const builder = new SlashCommandBuilder()
  .setName('showleaderboard')
  .setDescription('Show the current leaderboard')

const execute = async (interaction: APIChatInputApplicationCommandInteraction | APIMessageApplicationCommandInteraction): Promise<APIInteractionResponseCallbackData> => {
  const leaderboard = await buildLeaderboard()

  return {
    embeds: [leaderboard.data]
  }
}

export const showLeaderboardCommand: Command = {
  builder,
  execute
}
