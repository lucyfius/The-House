# The House Bot

A Discord moderation bot designed exclusively for The House server, featuring comprehensive administrative tools and PostgreSQL integration.

## Features

### Moderation Commands
- `/ban` - Ban members with customizable message deletion duration
- `/unban` - Unban users by ID
- `/kick` - Remove members from the server
- `/timeout` - Temporarily restrict member access (1 minute to 28 days)
- `/warn` - Issue and track member warnings
- `/role` - Manage member roles (add/remove)
- `/lockdown` - Toggle channel access restrictions
- `/clear` - Bulk delete messages (1-100)

### Permission System
- Administrator permission check
- Moderator role validation
- Hierarchical role checking

### Database Integration
- PostgreSQL database through Railway
- Persistent warning system
- Secure SSL connection

## Technical Details

### Dependencies
- discord.js v14.17.3
- @discordjs/rest v2.4.2
- PostgreSQL (via Sequelize)
- dotenv for environment management

### Environment Variables
- TOKEN=your_discord_bot_token
- DATABASE_URL=your_postgresql_url


## Deployment

This bot is deployed using Railway, which provides both hosting and PostgreSQL database services.


