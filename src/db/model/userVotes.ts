import createAttributeNames from '../../util/createAttributeNames';

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
  readonly ttl: number; // Unix timestamp (seconds) when this item expires
  readonly votingPeriod: string; // Format: "YYYY-MM" (e.g., "2025-07")
}

export const DynamoUserVotesKeys = createAttributeNames<DynamoUserVotes>();

/**
 * Calculate TTL timestamp for end of current month + 1 day buffer.
 * The buffer ensures the final leaderboard is posted before items expire.
 * Returns Unix timestamp in seconds (required by DynamoDB TTL).
 */
export function calculateMonthEndTTL(now: Date = new Date()): number {
  // Use UTC to ensure consistent behavior across timezones
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // Create date for 2nd day of next month at midnight UTC (end of month + 1 day buffer)
  const ttlTimestamp = Date.UTC(year, month + 1, 2, 0, 0, 0, 0);

  // DynamoDB TTL expects Unix timestamp in seconds
  return Math.floor(ttlTimestamp / 1000);
}

/**
 * Get the current voting period identifier (YYYY-MM format).
 * This is used to detect when votes carry over from a previous month.
 */
export function getCurrentVotingPeriod(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Add 1 because getUTCMonth() is 0-indexed
  return `${year}-${month}`;
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
