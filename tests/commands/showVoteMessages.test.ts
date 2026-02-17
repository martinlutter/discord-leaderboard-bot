import { showVoteMessagesCommand } from '../../src/commands/showVoteMessages';
import { getVotesByWeekForUser } from '../../src/db/getVotes';
import { discordApi } from '../../src/clients/discordApi';
import {
  InteractionType,
  ApplicationCommandType,
  type APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/v10';

jest.mock('../../src/db/getVotes');
jest.mock('../../src/clients/discordApi', () => ({
  discordApi: {
    channels: {
      getMessage: jest.fn(),
    },
  },
}));

const mockGetVotes = getVotesByWeekForUser as jest.MockedFunction<
  typeof getVotesByWeekForUser
>;
const mockGetMessage = discordApi.channels.getMessage as jest.Mock;

function createInteraction(
  userId: string = 'targetUser123',
): APIChatInputApplicationCommandInteraction {
  return {
    type: InteractionType.ApplicationCommand,
    id: 'interaction1',
    application_id: 'app1',
    token: 'token1',
    version: 1,
    channel: { id: 'chan1', type: 0 },
    locale: 'en-US',
    entitlements: [],
    authorizing_integration_owners: {},
    guild_id: 'guild1',
    data: {
      id: 'cmd1',
      name: 'showvotemessages',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'user',
          type: 6, // USER type
          value: userId,
        },
      ],
      resolved: {
        users: {
          [userId]: {
            id: userId,
            username: 'TargetUser',
            discriminator: '0',
            avatar: null,
            global_name: null,
          },
        },
      },
    },
  } as unknown as APIChatInputApplicationCommandInteraction;
}

describe('showVoteMessages command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns "no votes" when user has no votes this month', async () => {
    mockGetVotes.mockResolvedValue([]);

    const interaction = createInteraction();
    const result = await showVoteMessagesCommand.execute(interaction);

    expect(result.content).toBe('No votes for TargetUser');
  });

  it('returns "User not found" when user is not in resolved data', async () => {
    const interaction = createInteraction('user1');
    // Override resolved to not contain the user
    (interaction.data as any).resolved = { users: {} };

    const result = await showVoteMessagesCommand.execute(interaction);

    expect(result.content).toBe('User not found');
  });

  it('returns grouped vote messages with embeds', async () => {
    const now = new Date();
    const votedAt = new Date(now.getFullYear(), now.getMonth(), 15);

    // Return votes only on the first call, empty for the rest
    mockGetVotes.mockResolvedValueOnce([
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter1',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msg1',
        votedAt,
      },
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter2',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msg1', // Same message = grouped
        votedAt,
      },
    ]);
    mockGetVotes.mockResolvedValue([]);

    mockGetMessage.mockResolvedValue({
      id: 'msg1',
      content: 'This is the voted message content',
    });

    const interaction = createInteraction();
    const result = await showVoteMessagesCommand.execute(interaction);

    expect(result.content).toBe('Votes for TargetUser:');
    expect(result.embeds).toBeDefined();
    expect(result.embeds![0].fields).toBeDefined();

    const fields = result.embeds![0].fields!;
    // Two votes on the same message should be grouped
    expect(fields[0].name).toBe('2 votes');
    expect(fields[0].value).toContain('This is the voted message content');
    expect(fields[0].value).toContain('Jump to full message');
  });

  it('sorts grouped messages by vote count descending', async () => {
    const now = new Date();
    const votedAt = new Date(now.getFullYear(), now.getMonth(), 15);

    mockGetVotes.mockResolvedValueOnce([
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter1',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msgA',
        votedAt,
      },
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter2',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msgB',
        votedAt,
      },
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter3',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msgB', // msgB gets 2 votes
        votedAt,
      },
    ]);
    mockGetVotes.mockResolvedValue([]);

    mockGetMessage.mockImplementation((channelId: string, messageId: string) =>
      Promise.resolve({
        id: messageId,
        content: `Content of ${messageId}`,
      }),
    );

    const interaction = createInteraction();
    const result = await showVoteMessagesCommand.execute(interaction);

    const fields = result.embeds![0].fields!;
    expect(fields[0].name).toBe('2 votes');
    expect(fields[1].name).toBe('1 vote');
  });

  it('uses singular "vote" for single vote messages', async () => {
    const now = new Date();
    const votedAt = new Date(now.getFullYear(), now.getMonth(), 15);

    mockGetVotes.mockResolvedValueOnce([
      {
        yearAndWeek: { year: now.getFullYear(), week: 1 },
        voterId: 'voter1',
        voteeId: 'targetUser123',
        channelId: 'chan1',
        messageId: 'msg1',
        votedAt,
      },
    ]);
    mockGetVotes.mockResolvedValue([]);

    mockGetMessage.mockResolvedValue({
      id: 'msg1',
      content: 'Some message',
    });

    const interaction = createInteraction();
    const result = await showVoteMessagesCommand.execute(interaction);

    const fields = result.embeds![0].fields!;
    expect(fields[0].name).toBe('1 vote');
  });
});
