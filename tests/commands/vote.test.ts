import { voteCommand } from '../../src/commands/vote';
import { hasUserVotedByWeek } from '../../src/db/hasUserVoted';
import { voteForUser } from '../../src/db/voteForUser';
import { saveVote } from '../../src/db/storeVote';
import { buildLeaderboard } from '../../src/process/buildLeaderboardEmbed';
import { EmbedBuilder } from '@discordjs/builders';
import {
  ApplicationCommandType,
  InteractionType,
  type APIMessageApplicationCommandInteraction,
} from 'discord-api-types/v10';

jest.mock('../../src/db/hasUserVoted');
jest.mock('../../src/db/voteForUser');
jest.mock('../../src/db/storeVote');
jest.mock('../../src/process/buildLeaderboardEmbed');

const mockHasUserVoted = hasUserVotedByWeek as jest.MockedFunction<
  typeof hasUserVotedByWeek
>;
const mockVoteForUser = voteForUser as jest.MockedFunction<typeof voteForUser>;
const mockSaveVote = saveVote as jest.MockedFunction<typeof saveVote>;
const mockBuildLeaderboard = buildLeaderboard as jest.MockedFunction<
  typeof buildLeaderboard
>;

function createInteraction(
  overrides: Partial<{
    voteeId: string;
    voteeUsername: string;
    voterId: string;
    voterUsername: string;
    messageId: string;
    channelId: string;
    hasMessages: boolean;
  }> = {},
): APIMessageApplicationCommandInteraction {
  const {
    voteeId = 'votee123',
    voteeUsername = 'VoteeUser',
    voterId = 'voter456',
    messageId = 'msg789',
    channelId = 'chan001',
    hasMessages = true,
  } = overrides;

  return {
    type: InteractionType.ApplicationCommand,
    id: 'interaction1',
    application_id: 'app1',
    token: 'token1',
    version: 1,
    channel: { id: channelId, type: 0 },
    locale: 'en-US',
    entitlements: [],
    authorizing_integration_owners: {},
    data: {
      id: 'cmd1',
      name: 'vote',
      type: ApplicationCommandType.Message,
      target_id: messageId,
      resolved: {
        messages: hasMessages
          ? {
              [messageId]: {
                id: messageId,
                channel_id: channelId,
                author: {
                  id: voteeId,
                  username: voteeUsername,
                  discriminator: '0',
                  avatar: null,
                  global_name: null,
                },
                content: 'Hello world',
                timestamp: new Date().toISOString(),
                edited_timestamp: null,
                tts: false,
                mention_everyone: false,
                mentions: [],
                mention_roles: [],
                attachments: [],
                embeds: [],
                pinned: false,
                type: 0,
              },
            }
          : undefined,
      },
    },
    member: {
      user: {
        id: voterId,
        username: 'VoterUser',
        discriminator: '0',
        avatar: null,
        global_name: null,
      },
      roles: [],
      joined_at: '',
      deaf: false,
      mute: false,
      flags: 0,
    },
    guild_id: 'guild1',
  } as unknown as APIMessageApplicationCommandInteraction;
}

describe('vote command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when no messages are resolved', async () => {
    const interaction = createInteraction({ hasMessages: false });

    const result = await voteCommand.execute(interaction);

    expect(result.content).toBe('No messages found :(');
  });

  it('prevents self-voting', async () => {
    const interaction = createInteraction({
      voteeId: 'sameUser',
      voterId: 'sameUser',
    });

    const result = await voteCommand.execute(interaction);

    expect(result.content).toBe('You cannot vote for yourself');
  });

  it('prevents duplicate voting in the same week', async () => {
    mockHasUserVoted.mockResolvedValue(true);
    const interaction = createInteraction();

    const result = await voteCommand.execute(interaction);

    expect(result.content).toBe('You have already voted this week');
  });

  it('processes a valid vote successfully', async () => {
    mockHasUserVoted.mockResolvedValue(false);
    mockVoteForUser.mockResolvedValue({
      userId: 'votee123',
      name: 'VoteeUser',
      count: 3,
    });
    mockSaveVote.mockResolvedValue();
    const embed = new EmbedBuilder().setTitle('Leaderboard');
    mockBuildLeaderboard.mockResolvedValue(embed);

    const interaction = createInteraction();

    const result = await voteCommand.execute(interaction);

    expect(result.content).toContain('You voted for VoteeUser');
    expect(result.content).toContain('3 votes');
    expect(result.embeds).toBeDefined();
    expect(mockVoteForUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'votee123', username: 'VoteeUser' }),
    );
    expect(mockSaveVote).toHaveBeenCalledWith(
      expect.objectContaining({
        voterId: 'voter456',
        voteeId: 'votee123',
      }),
    );
  });

  it('uses singular "vote" when count is 1', async () => {
    mockHasUserVoted.mockResolvedValue(false);
    mockVoteForUser.mockResolvedValue({
      userId: 'votee123',
      name: 'VoteeUser',
      count: 1,
    });
    mockSaveVote.mockResolvedValue();
    mockBuildLeaderboard.mockResolvedValue(
      new EmbedBuilder().setTitle('Leaderboard'),
    );

    const interaction = createInteraction();

    const result = await voteCommand.execute(interaction);

    expect(result.content).toContain('1 vote!');
    expect(result.content).not.toContain('1 votes');
  });
});
