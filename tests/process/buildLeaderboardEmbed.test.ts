import { buildLeaderboard } from '../../src/process/buildLeaderboardEmbed';
import { getLeaderboard } from '../../src/db/getLeaderboard';

jest.mock('../../src/db/getLeaderboard');

const mockGetLeaderboard = getLeaderboard as jest.MockedFunction<
  typeof getLeaderboard
>;

describe('buildLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns "no votes" embed when leaderboard is empty', async () => {
    mockGetLeaderboard.mockResolvedValue({ users: [] });

    const embed = await buildLeaderboard();
    const data = embed.data;

    expect(data.title).toBe('Leaderboard');
    expect(data.description).toBe('No votes this month, fuck you all');
    expect(data.fields).toBeUndefined();
  });

  it('returns embed with user fields when votes exist', async () => {
    mockGetLeaderboard.mockResolvedValue({
      users: [
        { userId: '1', name: 'Alice', count: 3 },
        { userId: '2', name: 'Bob', count: 5 },
      ],
    });

    const embed = await buildLeaderboard();
    const data = embed.data;

    expect(data.title).toBe('Leaderboard');
    expect(data.description).toBeUndefined();
    expect(data.fields).toHaveLength(2);
  });

  it('sorts users by vote count descending', async () => {
    mockGetLeaderboard.mockResolvedValue({
      users: [
        { userId: '1', name: 'Alice', count: 2 },
        { userId: '2', name: 'Bob', count: 10 },
        { userId: '3', name: 'Charlie', count: 5 },
      ],
    });

    const embed = await buildLeaderboard();
    const fields = embed.data.fields!;

    expect(fields[0].name).toBe('Bob');
    expect(fields[0].value).toBe('10');
    expect(fields[1].name).toBe('Charlie');
    expect(fields[1].value).toBe('5');
    expect(fields[2].name).toBe('Alice');
    expect(fields[2].value).toBe('2');
  });

  it('limits to 24 fields', async () => {
    const users = Array.from({ length: 30 }, (_, i) => ({
      userId: String(i),
      name: `User${i}`,
      count: 30 - i,
    }));
    mockGetLeaderboard.mockResolvedValue({ users });

    const embed = await buildLeaderboard();

    expect(embed.data.fields).toHaveLength(24);
  });
});
