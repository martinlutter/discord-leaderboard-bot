import { SlashCommandBuilder } from '@discordjs/builders'
import { InteractionResponseType, type APIApplicationCommandInteractionDataStringOption, type APIChatInputApplicationCommandInteraction, type APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10'
import { type Command } from '..'

export const userCommand: Command = {
  builder: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Replies with user info!')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user to show info for')
    ),

  execute: async (interaction: APIChatInputApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
    const target = (interaction.data.options?.find(option => option.name === 'target') as APIApplicationCommandInteractionDataStringOption | null)?.value
    const user = interaction.data.resolved?.users?.[target!]

    if (!user) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'User not found'
        }
      }
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `User: ${user.username} - ${user.email}`
      }
    }
  }
}
