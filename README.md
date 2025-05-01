# Discord Leaderboard Bot

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Description

The Discord Leaderboard Bot is a bot that allows you to manage a leaderboard within your Discord server without an open websocket connection.  
Instead it only uses Discord's interactions endpoint to handle commands.

## Features

- vote for a user every week
- see the current standings
- monthly resets

## How it works

Interaction events are handled in 2 steps:

1. `index.ts` validates the request, launches `execute.ts` and responds immediately with `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`
2. `execute.ts` received the original interaction object and processes the given command

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/discord-leaderboard-bot.git
   ```

2. Install the required dependencies:

   ```bash
   npm install

   #install aws-cli
   ```

3. Set up your Discord bot:

- Create a new Discord application and bot on the [Discord Developer Portal](https://discord.com/developers/applications).
- Add the bot to your server, e.g. `https://discord.com/oauth2/authorize?client_id=<clientId>&permissions=826781289536&scope=bot+applications.commands`
- Create `.env` file from `.env.dist` and fill it out:
  ```
  DISCORD_TOKEN=your-bot-token
  APPLICATION_PUBLIC_KEY=your-public-key
  APPLICATION_CLIENT_ID=your-client-id
  GUILD_ID=your-discord-server-id
  CHANNEL_ID=channel-for-bot-messages
  ```

4. Deploy all commands to your server:

   ```bash
   npm run deploy:commands
   ```

5. Create an AWS profile in ~/.aws/credentials named `discord-leaderboard-bot`

6. Deploy the bot to AWS:

   ```bash
   #bootstrap your AWS account
   #npx cdk bootstrap ...

   npm run deploy
   ```

7. Update the interactions endpoint url in your bot's settings to point to the deployed API's url.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
