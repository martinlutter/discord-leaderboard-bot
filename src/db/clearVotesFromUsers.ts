import { db } from '../clients/db'
import { leaderboardTableName } from './constants'

export async function clearVotesFromUsers (): Promise<void> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'votes'
    }
  });

  const items = (result.Items ?? []) as { sk: string }[];
  await Promise.all(
    items.map(async item => await db.delete({
      TableName: leaderboardTableName,
      Key: {
        pk: 'votes',
        sk: item.sk
      }
    }))
  )
}
