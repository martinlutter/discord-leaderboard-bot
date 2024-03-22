import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { config } from 'dotenv'
import { voteCommand } from '../src/commands/vote'

config()

const clientId = process.env.APPLICATION_CLIENT_ID!
const token = process.env.DISCORD_TOKEN!
const guildId = process.env.GUILD_ID!

export const commands = [
  voteCommand
]

const rest = new REST({ version: '10' }).setToken(token)

void (async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands.map(command => command.builder.toJSON()) }
    )

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
})()
