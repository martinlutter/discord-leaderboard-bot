import { SlashCommandBuilder } from "@discordjs/builders";
import { type APIMessage } from "@discordjs/core/http-only";
import { isChatInputApplicationCommandInteraction } from "discord-api-types/utils";
import {
  APIEmbedField,
  type APIApplicationCommandInteractionDataUserOption,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponseCallbackData,
  type APIMessageApplicationCommandInteraction,
} from "discord-api-types/v10";
import { type Command } from "..";
import { discordApi } from "../clients/discordApi";
import { getVotesByWeekForUser } from "../db/getVotes";
import { type RecordedVote } from "../db/model/recordedVote";
import { getYearAndWeek, getYearAndWeekString, YearAndWeek } from "./vote";

type VoteMessage = {
  vote: RecordedVote;
  message: APIMessage;
};

type GroupedVoteMessage = {
  voteMessage: VoteMessage;
  count: number;
};

const builder = new SlashCommandBuilder()
  .setName("showvotemessages")
  .setDescription("Show all messages a person was voted for")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to show votes for")
      .setRequired(true)
  );

const execute = async (
  interaction:
    | APIChatInputApplicationCommandInteraction
    | APIMessageApplicationCommandInteraction
): Promise<APIInteractionResponseCallbackData> => {
  if (!isChatInputApplicationCommandInteraction(interaction)) {
    throw new Error("Expected a chat input interaction");
  }

  const userOptionValue = (
    interaction.data.options?.find(
      (option) => option.name === "user"
    ) as APIApplicationCommandInteractionDataUserOption
  ).value;
  const user = interaction.data.resolved?.users?.[userOptionValue];
  if (!user) {
    return { content: "User not found" };
  }

  const weeksInMonth = getWeeksInCurrentMonth();
  const votes: RecordedVote[] = [];
  for (const weekNumber of weeksInMonth) {
    votes.push(
      ...filterVotesToCurrentMonth(
        await getVotesByWeekForUser(getYearAndWeekString(weekNumber), user.id)
      )
    );
  }

  if (votes.length === 0) {
    return { content: `No votes for ${user.username}` };
  }

  const voteMessages = await Promise.all(
    votes.map(async (vote): Promise<VoteMessage> => {
      const message = await discordApi.channels.getMessage(
        vote.channelId,
        vote.messageId
      );
      return { vote, message };
    })
  );

  return {
    content: `Votes for ${user.username}:`,
    embeds: [
      {
        fields: buildVoteEmbeds(
          groupVoteMessages(voteMessages),
          interaction.guild_id!
        ),
      },
    ],
  };
};

export const showVoteMessagesCommand: Command = {
  builder,
  execute,
};

function getWeeksInCurrentMonth(): YearAndWeek[] {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const weeksInMonth: YearAndWeek[] = [];

  const currentDay = firstDayOfMonth;
  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentDay <= lastDayOfMonth) {
    const yearAndWeek = getYearAndWeek(currentDay);
    if (!weeksInMonth.includes(yearAndWeek)) {
      weeksInMonth.push(yearAndWeek);
    }
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return weeksInMonth;
}

function filterVotesToCurrentMonth(votes: RecordedVote[]): RecordedVote[] {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
    0,
    0,
    0
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return votes.filter(
    (vote) => vote.votedAt > startOfMonth && vote.votedAt < endOfMonth
  );
}

function groupVoteMessages(voteMessages: VoteMessage[]): GroupedVoteMessage[] {
  const groupedVotes = voteMessages.reduce((acc, voteMessage) => {
    const messageId = voteMessage.message.id;
    if (acc.has(messageId)) {
      acc.get(messageId)!.count++;
    } else {
      acc.set(messageId, { voteMessage, count: 1 });
    }

    return acc;
  }, new Map<string, GroupedVoteMessage>());

  return Array.from(groupedVotes.values()).sort((a, b) => b.count - a.count);
}

function buildVoteEmbeds(
  groupedVoteMessages: GroupedVoteMessage[],
  guildId: string
): APIEmbedField[] {
  return groupedVoteMessages
    .map((grouped) => ({
      name: `${grouped.count} vote` + (grouped.count > 1 ? "s" : ""),
      value: `${grouped.voteMessage.message.content.substring(
        0,
        100
      )}...[Jump to full message](https://discord.com/channels/${guildId}/${
        grouped.voteMessage.vote.channelId
      }/${grouped.voteMessage.vote.messageId})`,
    }))
    .slice(0, 24);
}
