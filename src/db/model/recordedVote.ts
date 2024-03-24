export interface RecordedVote {
  readonly weekNumber: number
  readonly voterId: string
  readonly voteeId: string
  readonly channelId: string
  readonly messageId: string
  readonly votedAt: string
}
