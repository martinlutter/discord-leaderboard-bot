import { db } from '..'
import { leaderboardTableName } from '../commands/vote'
import { type UserVotes } from './model/userVotes'

export async function voteForUser (votee: { id: string, username: string }): Promise<UserVotes> {
  const result = await db.update({
    TableName: leaderboardTableName,
    Key: {
      pk: 'votes',
      sk: `user${votee.id}`
    },
    UpdateExpression: 'ADD #count :inc SET #name = :name',
    ExpressionAttributeNames: {
      '#count': 'count',
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':name': votee.username
    },
    ReturnValues: 'ALL_NEW'
  })

  const updatedItem = result.Attributes!

  return {
    userId: updatedItem.sk,
    name: updatedItem.name,
    count: updatedItem.count
  }
}
