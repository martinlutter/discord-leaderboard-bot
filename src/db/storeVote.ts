import { db } from '..'
import { leaderboardTableName } from '../commands/vote'
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
