import { UserVotes } from './userVotes';

export interface Leaderboard {
  readonly users: Array<UserVotes>;
}
