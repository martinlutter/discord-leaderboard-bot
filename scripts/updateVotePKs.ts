import { config } from "dotenv";
config();
import { db } from "../src/clients/db";
import { leaderboardTableName } from "../src/db/constants";
import { getYearAndWeekString, getYearAndWeek } from "../src/commands/vote";

async function updateVotePKs(): Promise<void> {
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  do {
    const result: any = await db.scan({
      TableName: leaderboardTableName,
      FilterExpression: "begins_with(pk, :pkPrefix) AND pk <> :excludedPk",
      ExpressionAttributeValues: {
        ":pkPrefix": "vote",
        ":excludedPk": "votes",
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const items = result.Items ?? [];

    for (const item of items) {
      const votedAt = new Date(item.votedAt);
      const yearAndWeek = getYearAndWeekString(getYearAndWeek(votedAt));
      const newPK = `vote${yearAndWeek}`;
      if (item.pk === newPK) {
        console.log(`PK already updated for item: ${JSON.stringify(item)}`);
        continue;
      }

      await db.transactWrite({
        TransactItems: [
          {
            Delete: {
              TableName: leaderboardTableName,
              Key: {
                pk: item.pk,
                sk: item.sk,
              },
            },
          },
          {
            Put: {
              TableName: leaderboardTableName,
              Item: {
                ...item,
                pk: newPK,
              },
            },
          },
        ],
      });
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log("PK update completed.");
}

void updateVotePKs().catch((error) => {
  console.error("Error updating PKs:", error);
});
