import createAttributeNames from '../../util/createAttributeNames';

export interface YearAndWeek {
  readonly year: number;
  readonly week: number;
}

export interface RecordedVote {
  readonly yearAndWeek: YearAndWeek;
  readonly voterId: string;
  readonly voteeId: string;
  readonly channelId: string;
  readonly messageId: string;
  readonly votedAt: Date;
}

export interface DynamoRecordedVote {
  readonly pk: string; // vote{yearAndWeek}
  readonly sk: string; // user{userId}
  readonly voteeId: string;
  readonly channelId: string;
  readonly messageId: string;
  readonly votedAt: string; // ISO date string
}

export const DynamoRecordedVoteKeys =
  createAttributeNames<DynamoRecordedVote>();

export function mapRecordedVoteToDynamoItem(
  vote: RecordedVote,
): DynamoRecordedVote {
  return {
    [DynamoRecordedVoteKeys.pk]: toRecordedVotePk(vote.yearAndWeek),
    [DynamoRecordedVoteKeys.sk]: toRecordedVoteSk(vote.voterId),
    [DynamoRecordedVoteKeys.voteeId]: vote.voteeId,
    [DynamoRecordedVoteKeys.channelId]: vote.channelId,
    [DynamoRecordedVoteKeys.messageId]: vote.messageId,
    [DynamoRecordedVoteKeys.votedAt]: vote.votedAt.toISOString(),
  };
}

export function mapDynamoItemsToRecordedVote(
  items: DynamoRecordedVote[],
): RecordedVote[] {
  return items.map(
    (item): RecordedVote => ({
      yearAndWeek: fromRecordedVotePk(item.pk),
      voterId: fromRecordedVoteSk(item.sk),
      voteeId: item.voteeId,
      channelId: item.channelId,
      messageId: item.messageId,
      votedAt: new Date(item.votedAt),
    }),
  );
}

function mapYearAndWeekToString(yearAndWeek: YearAndWeek): string {
  return `${yearAndWeek.year}W${yearAndWeek.week}`;
}

function mapStringToYearAndWeek(yearAndWeekString: string): YearAndWeek {
  const [year, week] = yearAndWeekString.split('W').map(Number);
  return { year, week };
}

/**
 * Get ISO 8601 week number and year for a given date.
 * ISO 8601 weeks start on Monday and week 1 is the week containing the first Thursday.
 * This means dates in early January might belong to the previous year's last week,
 * and dates in late December might belong to the next year's week 1.
 */
export function getYearAndWeekByDate(date: Date): YearAndWeek {
  // Create a copy to avoid mutating the input
  const target = new Date(date.valueOf());

  // ISO week date weeks start on Monday (1) and end on Sunday (7)
  const dayNum = (target.getDay() + 6) % 7; // Make Monday = 0, Sunday = 6

  // Set to nearest Thursday (current date + 4 - current day number)
  target.setDate(target.getDate() - dayNum + 3);

  // Get first day of year
  const firstThursday = new Date(target.getFullYear(), 0, 4);

  // Set to nearest Thursday of first week
  const firstThursdayDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNum + 3);

  // Calculate week number
  const weekNumber = Math.round(
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ) + 1;

  return {
    year: target.getFullYear(),
    week: weekNumber,
  };
}

export function toRecordedVotePk(yearAndWeek: YearAndWeek): string {
  return `vote${mapYearAndWeekToString(yearAndWeek)}`;
}

export function toRecordedVoteSk(userId: string): string {
  return `user${userId}`;
}

function fromRecordedVotePk(pk: string): YearAndWeek {
  return mapStringToYearAndWeek(pk.replace('vote', ''));
}

function fromRecordedVoteSk(sk: string): string {
  return sk.replace('user', '');
}
