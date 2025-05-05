import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  mapRecordedVoteToDynamoItem,
  type RecordedVote,
} from './model/recordedVote';

export async function saveVote(vote: RecordedVote): Promise<void> {
  await db.put({
    TableName: leaderboardTableName,
    Item: mapRecordedVoteToDynamoItem(vote),
  });
}
