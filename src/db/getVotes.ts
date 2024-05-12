import { db } from "../clients/db"
import { leaderboardTableName } from "./constants"
import { RecordedVote } from "./model/recordedVote"

export async function getVotesByWeekForUser (weekNumber: number, userId: string): Promise<RecordedVote[]> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: 'pk = :pk',
    FilterExpression: 'voteeId = :voteeId',
    ExpressionAttributeValues: {
      ':pk': `vote${weekNumber}`,
      ':voteeId': userId
    }
  })

  return result.Items?.map(item => ({
    weekNumber,
    voterId: item.sk.replace('user', ''),
    voteeId: item.voteeId,
    channelId: item.channelId,
    messageId: item.messageId,
    votedAt: new Date(item.votedAt)
  })) ?? []
}