import { db } from './client'
import { leaderboardTableName } from './constants'

export async function clearVotesFromUsers (): Promise<void> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'votes'
    }
  })

  await Promise.all(
    result.Items!.map(async item => await db.delete({
      TableName: leaderboardTableName,
      Key: {
        pk: 'votes',
        sk: item.sk
      }
    }))
  )
}
