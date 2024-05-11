import { API } from '@discordjs/core/http-only'
import { REST } from '@discordjs/rest'
import { type Context } from 'aws-lambda'
import { type APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10'
import { commands } from '.'

const discordToken = process.env.DISCORD_TOKEN!

const rest = new REST({ version: '10' }).setToken(discordToken)
const api = new API(rest)

export const handler = async (interaction: APIChatInputApplicationCommandInteraction, context: Context): Promise<void> => {
  const command = commands.find(command => command.builder.name === interaction.data.name)!

  const response = await command.execute(interaction)
  await api.interactions.followUp(interaction.application_id, interaction.token, response)
}
