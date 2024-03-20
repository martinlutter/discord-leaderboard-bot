import { SlashCommandBuilder } from '@discordjs/builders'
import { type APIInteractionResponseChannelMessageWithSource } from '@discordjs/core'
import { type APIChatInputApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10'
import { type Command } from '..'

export const pingCommand: Command = {
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  execute: async (interaction: APIChatInputApplicationCommandInteraction): Promise<APIInteractionResponseChannelMessageWithSource> => {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'Pong!'
      }
    }
  }
}
