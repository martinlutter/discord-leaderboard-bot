import { EmbedBuilder } from "@discordjs/builders";
import { type APIEmbedField } from "discord-api-types/v10";
import { getLeaderboard } from "../db/getLeaderboard";
import { type Leaderboard } from "../db/model/leaderboard";

export async function buildLeaderboard(): Promise<EmbedBuilder> {
  const leaderboardData = await getLeaderboard();
  if (leaderboardData.users.length === 0) {
    return new EmbedBuilder()
      .setTitle("Leaderboard")
      .setDescription("No votes this month, fuck you all");
  }

  return new EmbedBuilder()
    .setTitle("Leaderboard")
    .setFields(transformLeaderboardIntoEmbedFields(leaderboardData));
}

function transformLeaderboardIntoEmbedFields(
  leaderboard: Leaderboard
): APIEmbedField[] {
  return leaderboard.users
    .map((user) => {
      return {
        name: user.name,
        value: String(user.count),
      };
    })
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 24);
}
