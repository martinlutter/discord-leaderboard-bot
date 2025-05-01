export interface RecordedVote {
  readonly yearAndWeek: string;
  readonly voterId: string;
  readonly voteeId: string;
  readonly channelId: string;
  readonly messageId: string;
  readonly votedAt: Date;
}
