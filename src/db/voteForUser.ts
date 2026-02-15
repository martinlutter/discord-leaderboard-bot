import { db } from '../clients/db';
import { leaderboardTableName } from './constants';
import {
  DynamoUserVotes,
  DynamoUserVotesKeys,
  calculateMonthEndTTL,
  getCurrentVotingPeriod,
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
  const currentPeriod = getCurrentVotingPeriod();

  // First, try to get the existing item to check its voting period
  const existingItem = await db.get({
    TableName: leaderboardTableName,
    Key: {
      [DynamoUserVotesKeys.pk]: toUserVotesPk(),
      [DynamoUserVotesKeys.sk]: toUserVotesSk(votee.id),
    },
  });

  const existing = existingItem.Item as DynamoUserVotes | undefined;
  const isNewPeriod = !existing || existing.votingPeriod !== currentPeriod;

  // If it's a new voting period, reset count to 1. Otherwise, increment.
  const result = await db.update({
    TableName: leaderboardTableName,
    Key: {
      [DynamoUserVotesKeys.pk]: toUserVotesPk(),
      [DynamoUserVotesKeys.sk]: toUserVotesSk(votee.id),
    },
    UpdateExpression: isNewPeriod
      ? 'SET #count = :newCount, #name = :name, #ttl = :ttl, #period = :period'
      : 'ADD #count :inc SET #name = :name, #ttl = :ttl, #period = :period',
    ExpressionAttributeNames: {
      '#count': DynamoUserVotesKeys.count,
      '#name': DynamoUserVotesKeys.name,
      '#ttl': DynamoUserVotesKeys.ttl,
      '#period': DynamoUserVotesKeys.votingPeriod,
    },
    ExpressionAttributeValues: isNewPeriod
      ? {
          ':newCount': 1,
          ':name': votee.username,
          ':ttl': ttl,
          ':period': currentPeriod,
        }
      : {
          ':inc': 1,
          ':name': votee.username,
          ':ttl': ttl,
          ':period': currentPeriod,
        },
    ReturnValues: 'ALL_NEW',
  });

  const updatedItem = result.Attributes! as DynamoUserVotes;

  return mapDynamoItemToUserVotes(updatedItem);
}
