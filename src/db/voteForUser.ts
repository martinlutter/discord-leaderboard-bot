import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  mapDynamoItemToUserVotes,
  toUserVotesPk,
  toUserVotesSk,
  type UserVotes,
} from './model/userVotes';

export async function voteForUser(votee: {
  id: string;
  username: string;
}): Promise<UserVotes> {
  const result = await db.update({
    TableName: leaderboardTableName,
    Key: {
      [DynamoUserVotesKeys.pk]: toUserVotesPk(),
      [DynamoUserVotesKeys.sk]: toUserVotesSk(votee.id),
    },
    UpdateExpression: 'ADD #count :inc SET #name = :name',
    ExpressionAttributeNames: {
      '#count': DynamoUserVotesKeys.count,
      '#name': DynamoUserVotesKeys.name,
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':name': votee.username,
    },
    ReturnValues: 'ALL_NEW',
  });

  const updatedItem = result.Attributes! as DynamoUserVotes;

  return mapDynamoItemToUserVotes(updatedItem);
}
