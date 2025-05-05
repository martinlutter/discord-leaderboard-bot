export interface UserVotes {
  readonly userId: string;
  readonly name: string;
  readonly count: number;
}

export interface DynamoUserVotes {
  readonly pk: string; // votes
  readonly sk: string; // user{userId}
  readonly name: string;
  readonly count: number;
}

export function mapDynamoItemToUserVotes(item: DynamoUserVotes): UserVotes {
  return {
    userId: fromUserVotesPk(item),
    name: item.name,
    count: item.count,
  };
}

export function mapDynamoItemsToUserVotes(
  items: DynamoUserVotes[],
): UserVotes[] {
  return items.map(mapDynamoItemToUserVotes);
}

export function toUserVotesPk(): string {
  return 'votes';
}

export function toUserVotesSk(userId: string): string {
  return `user${userId}`;
}

function fromUserVotesPk(item: DynamoUserVotes): string {
  return item.sk.replace('user', '');
}
