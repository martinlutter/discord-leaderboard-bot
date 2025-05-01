import { type APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { commands } from '.';
import { discordApi } from './clients/discordApi';

export const handler = async (
  interaction: APIChatInputApplicationCommandInteraction,
): Promise<void> => {
  const command = commands.find(
    (command) => command.builder.name === interaction.data.name,
  )!;

  const response = await command.execute(interaction);
  await discordApi.interactions.followUp(
    interaction.application_id,
    interaction.token,
    response,
  );
};
