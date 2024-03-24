import { db } from './client'
import { leaderboardTableName } from './constants'
import { type RecordedVote } from './model/recordedVote'

export async function saveVote (vote: RecordedVote): Promise<void> {
  await db.put({
    TableName: leaderboardTableName,
    Item: {
      pk: `vote${vote.weekNumber}`,
      sk: `user${vote.voterId}`,
      votedAt: vote.votedAt,
      channelId: vote.channelId,
      messageId: vote.messageId,
      voteeId: vote.voteeId
    }
  })
}
