import {
  getYearAndWeekByDate,
  mapRecordedVoteToDynamoItem,
  mapDynamoItemsToRecordedVote,
  toRecordedVotePk,
  toRecordedVoteSk,
  type YearAndWeek,
  type RecordedVote,
  type DynamoRecordedVote,
} from '../../../src/db/model/recordedVote';

describe('getYearAndWeekByDate', () => {
  describe('ISO 8601 week calculation', () => {
    it('calculates week 1 for first Thursday of the year', () => {
      // 2025-01-02 is Thursday (first Thursday), so it's week 1
      const result = getYearAndWeekByDate(new Date('2025-01-02'));
      expect(result).toEqual({ year: 2025, week: 1 });
    });

    it('handles dates in early January that belong to previous year', () => {
      // 2021-01-01 is Friday, first Thursday is 2021-01-07
      // So week 1 starts Mon 2021-01-04, meaning Jan 1-3 are in 2020-W53
      const result = getYearAndWeekByDate(new Date('2021-01-01'));
      expect(result).toEqual({ year: 2020, week: 53 });
    });

    it('handles dates in late December that belong to next year', () => {
      // 2024-12-30 is Monday, and 2025-01-02 is first Thursday of 2025
      // So 2024-12-30 is the start of 2025-W01
      const result = getYearAndWeekByDate(new Date('2024-12-30'));
      expect(result).toEqual({ year: 2025, week: 1 });
    });

    it('calculates correct week for mid-year date', () => {
      // 2025-06-16 is a Monday in week 25
      const result = getYearAndWeekByDate(new Date('2025-06-16'));
      expect(result).toEqual({ year: 2025, week: 25 });
    });

    it('handles year boundaries correctly for different years', () => {
      // Test several year transitions
      const cases: Array<{ date: string; expected: YearAndWeek }> = [
        // 2023-01-01 is Sunday, first Thu is 2023-01-05, week 1 starts Mon 2023-01-02
        // So 2023-01-01 belongs to 2022-W52
        { date: '2023-01-01', expected: { year: 2022, week: 52 } },
        // 2023-01-02 is Monday, start of week 1
        { date: '2023-01-02', expected: { year: 2023, week: 1 } },
        // 2024-01-01 is Monday, first Thu is 2024-01-04, so this is week 1
        { date: '2024-01-01', expected: { year: 2024, week: 1 } },
        // 2026-01-01 is Thursday (first Thursday), so it's week 1
        { date: '2026-01-01', expected: { year: 2026, week: 1 } },
      ];

      cases.forEach(({ date, expected }) => {
        const result = getYearAndWeekByDate(new Date(date));
        expect(result).toEqual(expected);
      });
    });

    it('handles week 52 and 53 correctly', () => {
      // 2024 has 52 weeks, last day is Sunday 2024-12-29
      const result52 = getYearAndWeekByDate(new Date('2024-12-29'));
      expect(result52).toEqual({ year: 2024, week: 52 });

      // 2020 has 53 weeks, last week includes 2020-12-31
      const result53 = getYearAndWeekByDate(new Date('2020-12-31'));
      expect(result53).toEqual({ year: 2020, week: 53 });
    });

    it('is consistent across all days of the same week', () => {
      // Week starting 2025-06-16 (Monday)
      const monday = getYearAndWeekByDate(new Date('2025-06-16'));
      const tuesday = getYearAndWeekByDate(new Date('2025-06-17'));
      const wednesday = getYearAndWeekByDate(new Date('2025-06-18'));
      const thursday = getYearAndWeekByDate(new Date('2025-06-19'));
      const friday = getYearAndWeekByDate(new Date('2025-06-20'));
      const saturday = getYearAndWeekByDate(new Date('2025-06-21'));
      const sunday = getYearAndWeekByDate(new Date('2025-06-22'));

      expect(monday).toEqual({ year: 2025, week: 25 });
      expect(tuesday).toEqual(monday);
      expect(wednesday).toEqual(monday);
      expect(thursday).toEqual(monday);
      expect(friday).toEqual(monday);
      expect(saturday).toEqual(monday);
      expect(sunday).toEqual(monday);
    });

    it('does not mutate the input date', () => {
      const inputDate = new Date('2025-06-16T10:30:00Z');
      const originalTime = inputDate.getTime();

      getYearAndWeekByDate(inputDate);

      expect(inputDate.getTime()).toBe(originalTime);
    });

    it('handles dates with time components correctly', () => {
      // Same day, different times should give same week
      const morning = getYearAndWeekByDate(new Date('2025-06-16T08:00:00Z'));
      const evening = getYearAndWeekByDate(new Date('2025-06-16T23:59:59Z'));

      expect(morning).toEqual(evening);
      expect(morning).toEqual({ year: 2025, week: 25 });
    });
  });
});

describe('mapRecordedVoteToDynamoItem', () => {
  it('maps RecordedVote to DynamoRecordedVote correctly', () => {
    const vote: RecordedVote = {
      yearAndWeek: { year: 2025, week: 25 },
      voterId: 'voter123',
      voteeId: 'votee456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: new Date('2025-06-16T10:30:00Z'),
    };

    const result = mapRecordedVoteToDynamoItem(vote);

    expect(result).toEqual({
      pk: 'vote2025W25',
      sk: 'uservoter123',
      voteeId: 'votee456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: '2025-06-16T10:30:00.000Z',
    });
  });

  it('handles different year and week values', () => {
    const vote: RecordedVote = {
      yearAndWeek: { year: 2024, week: 1 },
      voterId: 'user1',
      voteeId: 'user2',
      channelId: 'ch1',
      messageId: 'msg1',
      votedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const result = mapRecordedVoteToDynamoItem(vote);

    expect(result.pk).toBe('vote2024W1');
    expect(result.sk).toBe('useruser1');
  });
});

describe('mapDynamoItemsToRecordedVote', () => {
  it('maps array of DynamoRecordedVote to RecordedVote array', () => {
    const items: DynamoRecordedVote[] = [
      {
        pk: 'vote2025W25',
        sk: 'uservoter123',
        voteeId: 'votee456',
        channelId: 'channel789',
        messageId: 'msg101',
        votedAt: '2025-06-16T10:30:00.000Z',
      },
      {
        pk: 'vote2025W26',
        sk: 'uservoter999',
        voteeId: 'votee888',
        channelId: 'channel777',
        messageId: 'msg202',
        votedAt: '2025-06-23T15:45:00.000Z',
      },
    ];

    const result = mapDynamoItemsToRecordedVote(items);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      yearAndWeek: { year: 2025, week: 25 },
      voterId: 'voter123',
      voteeId: 'votee456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: new Date('2025-06-16T10:30:00.000Z'),
    });
    expect(result[1]).toEqual({
      yearAndWeek: { year: 2025, week: 26 },
      voterId: 'voter999',
      voteeId: 'votee888',
      channelId: 'channel777',
      messageId: 'msg202',
      votedAt: new Date('2025-06-23T15:45:00.000Z'),
    });
  });

  it('handles empty array', () => {
    const result = mapDynamoItemsToRecordedVote([]);
    expect(result).toEqual([]);
  });
});

describe('round-trip conversion', () => {
  it('converts RecordedVote to Dynamo and back without data loss', () => {
    const originalVote: RecordedVote = {
      yearAndWeek: { year: 2025, week: 25 },
      voterId: 'voter123',
      voteeId: 'votee456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: new Date('2025-06-16T10:30:00.000Z'),
    };

    const dynamoItem = mapRecordedVoteToDynamoItem(originalVote);
    const [convertedVote] = mapDynamoItemsToRecordedVote([dynamoItem]);

    expect(convertedVote).toEqual(originalVote);
  });
});

describe('toRecordedVotePk', () => {
  it('generates correct partition key format', () => {
    expect(toRecordedVotePk({ year: 2025, week: 1 })).toBe('vote2025W1');
    expect(toRecordedVotePk({ year: 2025, week: 25 })).toBe('vote2025W25');
    expect(toRecordedVotePk({ year: 2024, week: 53 })).toBe('vote2024W53');
  });
});

describe('toRecordedVoteSk', () => {
  it('generates correct sort key format', () => {
    expect(toRecordedVoteSk('user123')).toBe('useruser123');
    expect(toRecordedVoteSk('12345')).toBe('user12345');
  });
});
