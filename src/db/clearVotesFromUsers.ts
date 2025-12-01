import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  toUserVotesPk,
} from './model/userVotes';

export async function clearVotesFromUsers(): Promise<void> {
  const result = await db.query({
    TableName: leaderboardTableName,
    KeyConditionExpression: `${DynamoUserVotesKeys.pk} = :pk`,
    ExpressionAttributeValues: {
      ':pk': toUserVotesPk(),
    },
  });

  const items = (result.Items ?? []) as DynamoUserVotes[];
  await Promise.all(
    items.map(
      async (item) =>
        await db.delete({
          TableName: leaderboardTableName,
          Key: {
            [DynamoUserVotesKeys.pk]: toUserVotesPk(),
            [DynamoUserVotesKeys.sk]: item.sk,
          },
        }),
    ),
  );
}
