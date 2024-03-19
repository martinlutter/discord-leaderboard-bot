import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { SlashCommandBuilder } from '@discordjs/builders'
import { config } from 'dotenv'

config()

const clientId = process.env.APPLICATION_CLIENT_ID!
const token = process.env.DISCORD_TOKEN!
const guildId = process.env.GUILD_ID!

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  new SlashCommandBuilder()
    .setName('user')
    .setDescription('Replies with user info!')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user to show info for')
    )
].map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(token)

void (async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
})()
