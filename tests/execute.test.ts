import { handler } from '../src/execute';
import { discordApi } from '../src/clients/discordApi';
import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { InteractionType, ApplicationCommandType } from 'discord-api-types/v10';

jest.mock('../src/clients/discordApi', () => ({
  discordApi: {
    interactions: {
      followUp: jest.fn().mockResolvedValue({}),
    },
  },
}));

// Mock the command modules before importing
jest.mock('../src/commands/vote', () => ({
  voteCommand: {
    builder: { name: 'vote' },
    execute: jest.fn(),
  },
}));
jest.mock('../src/commands/showLeaderboard', () => ({
  showLeaderboardCommand: {
    builder: { name: 'showleaderboard' },
    execute: jest.fn(),
  },
}));
jest.mock('../src/commands/showVoteMessages', () => ({
  showVoteMessagesCommand: {
    builder: { name: 'showvotemessages' },
    execute: jest.fn(),
  },
}));

// Import after mocking
import { voteCommand } from '../src/commands/vote';

const mockFollowUp = discordApi.interactions.followUp as jest.Mock;
const mockVoteExecute = voteCommand.execute as jest.Mock;

function createInteraction(
  commandName: string,
): APIChatInputApplicationCommandInteraction {
  return {
    type: InteractionType.ApplicationCommand,
    id: 'interaction1',
    application_id: 'app1',
    token: 'token1',
    version: 1,
    data: {
      id: 'cmd1',
      name: commandName,
      type: ApplicationCommandType.ChatInput,
    },
  } as unknown as APIChatInputApplicationCommandInteraction;
}

describe('execute handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes the matching command and sends followUp', async () => {
    const responseData = { content: 'Vote recorded!' };
    mockVoteExecute.mockResolvedValue(responseData);

    const interaction = createInteraction('vote');
    await handler(interaction);

    expect(mockVoteExecute).toHaveBeenCalledWith(interaction);
    expect(mockFollowUp).toHaveBeenCalledWith('app1', 'token1', responseData);
  });
});
