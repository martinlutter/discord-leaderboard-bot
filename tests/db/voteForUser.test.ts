import { voteForUser } from '../../src/db/voteForUser';
import { db } from '../../src/clients/db';
import { getCurrentVotingPeriod } from '../../src/db/model/userVotes';

jest.mock('../../src/clients/db', () => ({
  db: {
    get: jest.fn(),
    update: jest.fn(),
  },
}));

describe('voteForUser', () => {
  const votee = { id: 'user123', username: 'TestUser' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resets count to 1 when voting in a new period', async () => {
    const currentPeriod = getCurrentVotingPeriod();

    // Simulate existing vote from previous period
    (db.get as jest.Mock).mockResolvedValue({
      Item: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 5,
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: '2025-05', // Previous month
      },
    });

    // Mock the update response
    (db.update as jest.Mock).mockResolvedValue({
      Attributes: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 1, // Reset to 1
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    const result = await voteForUser(votee);

    expect(result.count).toBe(1);

    // Verify the update used SET, not ADD
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        UpdateExpression: expect.stringContaining('SET #count = :newCount'),
      }),
    );
  });

  it('increments count when voting in the same period', async () => {
    const currentPeriod = getCurrentVotingPeriod();

    // Simulate existing vote from current period
    (db.get as jest.Mock).mockResolvedValue({
      Item: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 3,
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod, // Same month
      },
    });

    // Mock the update response
    (db.update as jest.Mock).mockResolvedValue({
      Attributes: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 4, // Incremented
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    const result = await voteForUser(votee);

    expect(result.count).toBe(4);

    // Verify the update used ADD
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        UpdateExpression: expect.stringContaining('ADD #count :inc'),
      }),
    );
  });

  it('creates new vote with count 1 when no existing vote', async () => {
    const currentPeriod = getCurrentVotingPeriod();

    // No existing vote
    (db.get as jest.Mock).mockResolvedValue({});

    // Mock the update response
    (db.update as jest.Mock).mockResolvedValue({
      Attributes: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 1,
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    const result = await voteForUser(votee);

    expect(result.count).toBe(1);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        UpdateExpression: expect.stringContaining('SET #count = :newCount'),
      }),
    );
  });

  it('handles TTL expiration edge case (vote before auto-deletion)', async () => {
    const currentPeriod = getCurrentVotingPeriod();

    // Simulate vote from previous month that hasn't been deleted yet by TTL
    // (TTL has expired but DynamoDB hasn't deleted it yet)
    const expiredTTL = Math.floor(Date.now() / 1000) - 86400; // 1 day ago

    (db.get as jest.Mock).mockResolvedValue({
      Item: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 7,
        ttl: expiredTTL,
        votingPeriod: '2025-05', // Previous month
      },
    });

    (db.update as jest.Mock).mockResolvedValue({
      Attributes: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser',
        count: 1, // Reset, not incremented
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    const result = await voteForUser(votee);

    // Should reset to 1, not carry over the 7 votes
    expect(result.count).toBe(1);
  });

  it('updates username on each vote', async () => {
    const currentPeriod = getCurrentVotingPeriod();

    (db.get as jest.Mock).mockResolvedValue({
      Item: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'OldName',
        count: 2,
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    (db.update as jest.Mock).mockResolvedValue({
      Attributes: {
        pk: 'votes',
        sk: 'useruser123',
        name: 'TestUser', // Updated name
        count: 3,
        ttl: Math.floor(Date.now() / 1000),
        votingPeriod: currentPeriod,
      },
    });

    await voteForUser(votee);

    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({
          ':name': 'TestUser',
        }),
      }),
    );
  });
});
