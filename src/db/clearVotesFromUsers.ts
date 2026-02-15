import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  toUserVotesPk,
} from './model/userVotes';

/**
 * @deprecated This function is no longer needed. Vote cleanup is now handled
 * automatically via DynamoDB TTL. Items expire 1 day after month end.
 *
 * This function remains for backwards compatibility or manual cleanup if needed,
 * but should not be called in normal operation.
 */
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
