import { db } from '../clients/db';
import { leaderboardTableName } from './constants';

export async function hasUserVotedByWeek(
  userId: string,
  yearAndWeek: string,
): Promise<boolean> {
  const result = await db.get({
    TableName: leaderboardTableName,
    Key: {
      pk: `vote${yearAndWeek}`,
      sk: `user${userId}`,
    },
  });

  return result.Item !== undefined;
}
