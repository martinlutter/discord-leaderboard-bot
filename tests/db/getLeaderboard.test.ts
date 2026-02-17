import { getLeaderboard } from '../../src/db/getLeaderboard';
import { db } from '../../src/clients/db';

jest.mock('../../src/clients/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('getLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mapped user votes from DynamoDB', async () => {
    (db.query as jest.Mock).mockResolvedValue({
      Items: [
        {
          pk: 'votes',
          sk: 'user123',
          name: 'Alice',
          count: 5,
          ttl: 1234567890,
          votingPeriod: '2026-02',
        },
        {
          pk: 'votes',
          sk: 'user456',
          name: 'Bob',
          count: 3,
          ttl: 1234567890,
          votingPeriod: '2026-02',
        },
      ],
    });

    const result = await getLeaderboard();

    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toEqual({
      userId: '123',
      name: 'Alice',
      count: 5,
    });
    expect(result.users[1]).toEqual({
      userId: '456',
      name: 'Bob',
      count: 3,
    });
  });

  it('returns empty users array when no items exist', async () => {
    (db.query as jest.Mock).mockResolvedValue({ Items: undefined });

    const result = await getLeaderboard();

    expect(result.users).toEqual([]);
  });

  it('queries with correct key condition', async () => {
    (db.query as jest.Mock).mockResolvedValue({ Items: [] });

    await getLeaderboard();

    expect(db.query).toHaveBeenCalledWith(
      expect.objectContaining({
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'votes' },
      }),
    );
  });
});
