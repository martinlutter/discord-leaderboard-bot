import { API } from '@discordjs/core/http-only';
import { REST } from '@discordjs/rest';
import { buildLeaderboard } from './process/buildLeaderboardEmbed';

const discordToken = process.env.DISCORD_TOKEN!;
const channelId = process.env.CHANNEL_ID!;

const rest = new REST({ version: '10' }).setToken(discordToken);
const api = new API(rest);

/**
 * Handler for end-of-month leaderboard posting.
 *
 * NOTE: Vote cleanup is now handled automatically via DynamoDB TTL.
 * UserVotes items expire 1 day after month end, ensuring this handler
 * can post the final leaderboard before items are deleted.
 *
 * SETUP REQUIRED: Enable TTL on the DynamoDB table with attribute name 'ttl'
 */
export const handler = async (): Promise<void> => {
  const leaderboard = await buildLeaderboard();
  await api.channels.createMessage(channelId, {
    content: 'The month has ended! Here are the final results:',
    embeds: [leaderboard.data],
  });
  // Vote cleanup is now automatic via TTL - no manual deletion needed
};
