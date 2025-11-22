import { hasUserVotedByWeek } from '../../src/db/hasUserVoted';
import { db } from '../../src/clients/db';

jest.mock('../../src/clients/db', () => ({
  db: {
    get: jest.fn(),
  },
}));

describe('hasUserVotedByWeek', () => {
  const userId = 'user123';
  const yearAndWeek = { year: 2025, week: 47 };

  it('returns true if Item is defined', async () => {
    (db.get as jest.Mock).mockResolvedValue({ Item: { some: 'data' } });
    await expect(hasUserVotedByWeek(userId, yearAndWeek)).resolves.toBe(true);
  });

  it('returns false if Item is undefined', async () => {
    (db.get as jest.Mock).mockResolvedValue({});
    await expect(hasUserVotedByWeek(userId, yearAndWeek)).resolves.toBe(false);
  });
});
