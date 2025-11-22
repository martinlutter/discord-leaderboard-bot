import { saveVote } from '../../src/db/storeVote';
import { db } from '../../src/clients/db';
import * as recordedVoteModule from '../../src/db/model/recordedVote';
import { leaderboardTableName } from '../../src/db/constants';

jest.mock('../../src/clients/db', () => ({
  db: {
    put: jest.fn(),
  },
}));

jest.spyOn(recordedVoteModule, 'mapRecordedVoteToDynamoItem');

describe('saveVote', () => {
  it('calls db.put with correct parameters', async () => {
    const vote = {
      yearAndWeek: { year: 2025, week: 47 },
      voterId: 'user123',
      voteeId: 'user456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: new Date('2025-11-22T10:00:00Z'),
    };
    const dynamoItem = {
      pk: 'vote2025W47',
      sk: 'user123',
      voteeId: 'user456',
      channelId: 'channel789',
      messageId: 'msg101',
      votedAt: vote.votedAt.toISOString(),
    };
    (
      recordedVoteModule.mapRecordedVoteToDynamoItem as jest.Mock
    ).mockReturnValue(dynamoItem);

    await saveVote(vote);
    expect(recordedVoteModule.mapRecordedVoteToDynamoItem).toHaveBeenCalledWith(
      vote,
    );
    expect(db.put).toHaveBeenCalledWith({
      TableName: leaderboardTableName,
      Item: dynamoItem,
    });
  });
});
