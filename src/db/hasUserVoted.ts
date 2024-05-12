import { db } from '../clients/db'
import { leaderboardTableName } from './constants'

export async function hasUserVotedByWeek (userId: string, weekNumber: number): Promise<boolean> {
  const result = await db.get({
    TableName: leaderboardTableName,
    Key: {
      pk: `vote${weekNumber}`,
      sk: `user${userId}`
    }
  })

  return result.Item !== undefined
}
