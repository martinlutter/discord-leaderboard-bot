import { db } from '../clients/db'
import { leaderboardTableName } from './constants'
import { type Leaderboard } from './model/leaderboard'

export async function getLeaderboard (): Promise<Leaderboard> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'votes'
    }
  })

  const items = (result.Items ?? []) as { name: string, count: number }[]

  return {
    users: items.map(item => ({
      name: item.name,
      count: item.count
    }))
  }
}
