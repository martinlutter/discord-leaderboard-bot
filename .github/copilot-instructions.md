# Copilot Instructions for Discord Leaderboard Bot

## Project Overview

- This is a Discord bot for managing a leaderboard, focused on voting and monthly resets.
- The bot does **not** use a persistent websocket; it only interacts via Discord's interactions endpoint.
- Main workflow: `src/index.ts` validates requests and defers the response, then `src/execute.ts` processes commands.

## Architecture & Data Flow

- **Commands** are defined in `src/commands/` (e.g., `vote.ts`, `showLeaderboard.ts`).
- **Database logic** is in `src/db/` (e.g., `getLeaderboard.ts`, `storeVote.ts`).
- **Discord API interactions** are handled in `src/clients/discordApi.ts`.
- **Leaderboard embed construction** is in `src/process/buildLeaderboardEmbed.ts`.
- **Utility functions** are in `src/util/`.
- **Monthly reset logic** is in `src/closeMonth.ts`.

## Developer Workflows

- **Install dependencies:** `npm install`
- **Deploy Discord commands:** `npm run deploy:commands` (see `scripts/deployCommands.ts`)
- **Deploy to AWS:** `npm run deploy` (requires AWS profile `discord-leaderboard-bot`)
- **Bootstrap AWS (first time):** `npx cdk bootstrap ...`
- **Environment variables:** Copy `.env.dist` to `.env` and fill in required secrets.

## Project-Specific Patterns

- All Discord interactions are processed via deferred responses for scalability.
- Command handlers receive the original interaction object for context.
- Database operations are modularized in `src/db/` and use clear function boundaries.
- Leaderboard and voting logic is separated for maintainability.
- No persistent state in memory; all state is stored in the database.

## Integration Points

- **Discord:** Uses Discord's interactions endpoint only (no websocket).
- **AWS:** Deployment and hosting via AWS CDK; see `cdk.json` and deployment scripts.
- **Environment:** Requires `.env` for secrets and configuration.

## Examples

- To add a new command: create a file in `src/commands/`, export a handler, and update `execute.ts` to route the command.
- To change leaderboard logic: update relevant files in `src/db/` and `src/process/`.

## References

- See `README.md` for setup and deployment details.
- Key files: `src/index.ts`, `src/execute.ts`, `src/commands/`, `src/db/`, `scripts/deployCommands.ts`

---

**Feedback:** If any section is unclear or missing, please specify which workflows, patterns, or integration points need more detail.
