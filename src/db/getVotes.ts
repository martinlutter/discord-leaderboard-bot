import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoRecordedVote,
  DynamoRecordedVoteKeys,
  mapDynamoItemsToRecordedVote,
  RecordedVote,
  toRecordedVotePk,
  YearAndWeek,
} from './model/recordedVote';

export async function getVotesByWeekForUser(
  yearAndWeek: YearAndWeek,
  userId: string,
): Promise<RecordedVote[]> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: `${DynamoRecordedVoteKeys.pk} = :pk`,
    FilterExpression: 'voteeId = :voteeId',
    ExpressionAttributeValues: {
      ':pk': toRecordedVotePk(yearAndWeek),
      ':voteeId': userId,
    },
  });

  const items = (result.Items ?? []) as DynamoRecordedVote[];

  return mapDynamoItemsToRecordedVote(items);
}
