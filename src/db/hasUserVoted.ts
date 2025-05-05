import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
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
      pk: toRecordedVotePk(yearAndWeek),
      sk: toRecordedVoteSk(userId),
    },
  });

  return result.Item !== undefined;
}
