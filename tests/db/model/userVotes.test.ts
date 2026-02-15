import {
  calculateMonthEndTTL,
  getCurrentVotingPeriod,
  mapDynamoItemToUserVotes,
  mapDynamoItemsToUserVotes,
  toUserVotesPk,
  toUserVotesSk,
  type DynamoUserVotes,
} from '../../../src/db/model/userVotes';

describe('calculateMonthEndTTL', () => {
  it('calculates TTL for end of current month + 1 day', () => {
    // Test with a specific date in the middle of June 2025
    const testDate = new Date('2025-06-15T14:30:00Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: July 2, 2025 00:00:00 UTC (end of June + 1 day)
    const expectedDate = new Date('2025-07-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('handles end of year correctly', () => {
    // Test with December
    const testDate = new Date('2025-12-15T10:00:00Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: January 2, 2026 00:00:00 UTC
    const expectedDate = new Date('2026-01-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('handles beginning of month correctly', () => {
    // First day of month
    const testDate = new Date('2025-06-01T00:00:00Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: July 2, 2025 00:00:00 UTC
    const expectedDate = new Date('2025-07-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('handles end of month correctly', () => {
    // Last day of month
    const testDate = new Date('2025-06-30T23:59:59Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: July 2, 2025 00:00:00 UTC
    const expectedDate = new Date('2025-07-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('handles February in leap year', () => {
    // February 2024 (leap year)
    const testDate = new Date('2024-02-15T12:00:00Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: March 2, 2024 00:00:00 UTC (Feb has 29 days in 2024)
    const expectedDate = new Date('2024-03-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('handles February in non-leap year', () => {
    // February 2025 (non-leap year)
    const testDate = new Date('2025-02-15T12:00:00Z');

    const ttl = calculateMonthEndTTL(testDate);

    // Expected: March 2, 2025 00:00:00 UTC (Feb has 28 days in 2025)
    const expectedDate = new Date('2025-03-02T00:00:00Z');
    const expectedTTL = Math.floor(expectedDate.getTime() / 1000);

    expect(ttl).toBe(expectedTTL);
  });

  it('returns Unix timestamp in seconds (not milliseconds)', () => {
    const testDate = new Date('2025-06-15T14:30:00Z');
    const ttl = calculateMonthEndTTL(testDate);

    // Verify it's in seconds by checking magnitude
    // Timestamps in seconds are ~10 digits, milliseconds are ~13 digits
    expect(ttl.toString().length).toBeLessThan(12);
    expect(ttl).toBeGreaterThan(1700000000); // After 2023
    expect(ttl).toBeLessThan(2000000000); // Before 2033
  });

  it('uses current date when no argument provided', () => {
    const before = Date.now();
    const ttl = calculateMonthEndTTL();
    const after = Date.now();

    // TTL should be in the future (end of current month + 1 day)
    const ttlInMs = ttl * 1000;
    expect(ttlInMs).toBeGreaterThan(before);

    // TTL should be within the next 2 months at most
    const twoMonthsFromNow = after + 60 * 24 * 60 * 60 * 1000;
    expect(ttlInMs).toBeLessThan(twoMonthsFromNow);
  });

  it('sets TTL to midnight UTC', () => {
    const testDate = new Date('2025-06-15T14:30:45.123Z');
    const ttl = calculateMonthEndTTL(testDate);

    // Convert back to date and verify it's midnight
    const ttlDate = new Date(ttl * 1000);
    expect(ttlDate.getUTCHours()).toBe(0);
    expect(ttlDate.getUTCMinutes()).toBe(0);
    expect(ttlDate.getUTCSeconds()).toBe(0);
    expect(ttlDate.getUTCMilliseconds()).toBe(0);
  });

  it('provides 1 day buffer after month end', () => {
    const testDate = new Date('2025-06-15T14:30:00Z');
    const ttl = calculateMonthEndTTL(testDate);

    // TTL should be July 2 (not July 1)
    const ttlDate = new Date(ttl * 1000);
    expect(ttlDate.getUTCDate()).toBe(2);
    expect(ttlDate.getUTCMonth()).toBe(6); // July (0-indexed)
  });
});

describe('mapDynamoItemToUserVotes', () => {
  it('maps DynamoUserVotes to UserVotes correctly', () => {
    const dynamoItem: DynamoUserVotes = {
      pk: 'votes',
      sk: 'useruser123',
      name: 'JohnDoe',
      count: 5,
      ttl: 1719878400,
      votingPeriod: '2025-06',
    };

    const result = mapDynamoItemToUserVotes(dynamoItem);

    expect(result).toEqual({
      userId: 'user123',
      name: 'JohnDoe',
      count: 5,
    });
  });

  it('strips "user" prefix from sk to get userId', () => {
    const dynamoItem: DynamoUserVotes = {
      pk: 'votes',
      sk: 'user987654321',
      name: 'Alice',
      count: 10,
      ttl: 1719878400,
      votingPeriod: '2025-06',
    };

    const result = mapDynamoItemToUserVotes(dynamoItem);

    expect(result.userId).toBe('987654321');
  });
});

describe('mapDynamoItemsToUserVotes', () => {
  it('maps array of DynamoUserVotes to UserVotes array', () => {
    const items: DynamoUserVotes[] = [
      {
        pk: 'votes',
        sk: 'useruser1',
        name: 'Alice',
        count: 3,
        ttl: 1719878400,
        votingPeriod: '2025-06',
      },
      {
        pk: 'votes',
        sk: 'useruser2',
        name: 'Bob',
        count: 7,
        ttl: 1719878400,
        votingPeriod: '2025-06',
      },
    ];

    const result = mapDynamoItemsToUserVotes(items);

    expect(result).toEqual([
      { userId: 'user1', name: 'Alice', count: 3 },
      { userId: 'user2', name: 'Bob', count: 7 },
    ]);
  });

  it('handles empty array', () => {
    const result = mapDynamoItemsToUserVotes([]);
    expect(result).toEqual([]);
  });
});

describe('toUserVotesPk', () => {
  it('returns constant "votes" partition key', () => {
    expect(toUserVotesPk()).toBe('votes');
  });
});

describe('toUserVotesSk', () => {
  it('generates correct sort key format', () => {
    expect(toUserVotesSk('123')).toBe('user123');
    expect(toUserVotesSk('987654321')).toBe('user987654321');
  });

  it('adds "user" prefix to userId', () => {
    const userId = 'abc123';
    const sk = toUserVotesSk(userId);
    expect(sk).toBe('userabc123');
    expect(sk.startsWith('user')).toBe(true);
  });
});

describe('getCurrentVotingPeriod', () => {
  it('returns current period in YYYY-MM format', () => {
    const testDate = new Date('2025-06-15T14:30:00Z');
    const period = getCurrentVotingPeriod(testDate);
    expect(period).toBe('2025-06');
  });

  it('handles January correctly', () => {
    const testDate = new Date('2025-01-01T00:00:00Z');
    const period = getCurrentVotingPeriod(testDate);
    expect(period).toBe('2025-01');
  });

  it('handles December correctly', () => {
    const testDate = new Date('2025-12-31T23:59:59Z');
    const period = getCurrentVotingPeriod(testDate);
    expect(period).toBe('2025-12');
  });

  it('pads single-digit months with zero', () => {
    const periods = [
      { date: new Date('2025-01-15T12:00:00Z'), expected: '2025-01' },
      { date: new Date('2025-02-15T12:00:00Z'), expected: '2025-02' },
      { date: new Date('2025-09-15T12:00:00Z'), expected: '2025-09' },
      { date: new Date('2025-10-15T12:00:00Z'), expected: '2025-10' },
      { date: new Date('2025-11-15T12:00:00Z'), expected: '2025-11' },
    ];

    periods.forEach(({ date, expected }) => {
      expect(getCurrentVotingPeriod(date)).toBe(expected);
    });
  });

  it('uses current date when no argument provided', () => {
    const period = getCurrentVotingPeriod();
    // Should match format YYYY-MM
    expect(period).toMatch(/^\d{4}-\d{2}$/);
  });

  it('uses UTC month, not local month', () => {
    // Test date that might be different month in different timezones
    // Jan 1 00:30 UTC could be Dec 31 in some timezones
    const testDate = new Date('2025-01-01T00:30:00Z');
    const period = getCurrentVotingPeriod(testDate);
    expect(period).toBe('2025-01'); // Should be January, not December
  });
});
