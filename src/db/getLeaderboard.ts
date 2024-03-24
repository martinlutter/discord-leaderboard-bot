import { db } from '..'
import { leaderboardTableName } from '../commands/vote'
import { type Leaderboard } from './model/leaderboard'

export async function getLeaderboard (): Promise<Leaderboard> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'votes'
    }
  })

  return {
    users: result.Items!.map(item => ({
      name: item.name,
      count: item.count
    }))
  }
}
