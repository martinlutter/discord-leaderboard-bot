import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  calculateMonthEndTTL,
  mapDynamoItemToUserVotes,
  toUserVotesPk,
  toUserVotesSk,
  type UserVotes,
} from './model/userVotes';

export async function voteForUser(votee: {
  id: string;
  username: string;
}): Promise<UserVotes> {
  const ttl = calculateMonthEndTTL();

  const result = await db.update({
    TableName: leaderboardTableName,
    Key: {
      [DynamoUserVotesKeys.pk]: toUserVotesPk(),
      [DynamoUserVotesKeys.sk]: toUserVotesSk(votee.id),
    },
    UpdateExpression: 'ADD #count :inc SET #name = :name, #ttl = :ttl',
    ExpressionAttributeNames: {
      '#count': DynamoUserVotesKeys.count,
      '#name': DynamoUserVotesKeys.name,
      '#ttl': DynamoUserVotesKeys.ttl,
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':name': votee.username,
      ':ttl': ttl,
    },
    ReturnValues: 'ALL_NEW',
  });

  const updatedItem = result.Attributes! as DynamoUserVotes;

  return mapDynamoItemToUserVotes(updatedItem);
}
