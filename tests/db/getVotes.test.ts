import { getVotesByWeekForUser } from '../../src/db/getVotes';
import { db } from '../../src/clients/db';

jest.mock('../../src/clients/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('getVotesByWeekForUser', () => {
  const yearAndWeek = { year: 2025, week: 47 };
  const userId = 'user123';

  it('returns mapped votes from db query', async () => {
    const dynamoItems = [
      {
        pk: 'vote2025W47',
        sk: 'user123',
        voteeId: 'user456',
        channelId: 'channel789',
        messageId: 'msg101',
        votedAt: new Date('2025-11-22T10:00:00Z').toISOString(),
      },
    ];
    (db.query as jest.Mock).mockResolvedValue({ Items: dynamoItems });

    const result = await getVotesByWeekForUser(yearAndWeek, userId);
    expect(db.query).toHaveBeenCalled();
    expect(result).toEqual([
      {
        yearAndWeek: { year: 2025, week: 47 },
        voterId: '123',
        voteeId: 'user456',
        channelId: 'channel789',
        messageId: 'msg101',
        votedAt: new Date('2025-11-22T10:00:00Z'),
      },
    ]);
  });

  it('returns empty array if no Items', async () => {
    (db.query as jest.Mock).mockResolvedValue({});
    const result = await getVotesByWeekForUser(yearAndWeek, userId);
    expect(result).toEqual([]);
  });
});
