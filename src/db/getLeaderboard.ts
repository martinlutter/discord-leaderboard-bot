import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import { type Leaderboard } from './model/leaderboard';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  mapDynamoItemsToUserVotes,
  toUserVotesPk,
} from './model/userVotes';

export async function getLeaderboard(): Promise<Leaderboard> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: `${DynamoUserVotesKeys.pk} = :pk`,
    ExpressionAttributeValues: {
      ':pk': toUserVotesPk(),
    },
  });

  const items = (result.Items ?? []) as DynamoUserVotes[];

  return {
    users: mapDynamoItemsToUserVotes(items),
  };
}
