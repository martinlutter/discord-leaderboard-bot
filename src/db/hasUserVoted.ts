import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoRecordedVoteKeys,
  toRecordedVotePk,
  toRecordedVoteSk,
  YearAndWeek,
} from './model/recordedVote';

export async function hasUserVotedByWeek(
  userId: string,
  yearAndWeek: YearAndWeek,
): Promise<boolean> {
  const result = await db.get({
    TableName: leaderboardTableName,
    Key: {
      [DynamoRecordedVoteKeys.pk]: toRecordedVotePk(yearAndWeek),
      [DynamoRecordedVoteKeys.sk]: toRecordedVoteSk(userId),
    },
  });

  return result.Item !== undefined;
}
