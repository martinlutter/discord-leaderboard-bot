import { SlashCommandBuilder } from '@discordjs/builders';
import { type APIInteractionResponseCallbackData } from 'discord-api-types/v10';
import { type Command } from '..';
import { buildLeaderboard } from '../process/buildLeaderboardEmbed';

const builder = new SlashCommandBuilder()
  .setName('showleaderboard')
  .setDescription('Show the current leaderboard');

const execute = async (): Promise<APIInteractionResponseCallbackData> => {
  const leaderboard = await buildLeaderboard();

  return {
    embeds: [leaderboard.data],
  };
};

export const showLeaderboardCommand: Command = {
  builder,
  execute,
};
