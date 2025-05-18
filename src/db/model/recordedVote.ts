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

export function getYearAndWeekByDate(date: Date): YearAndWeek {
  return {
    year: date.getFullYear(),
    week: Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    ),
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
