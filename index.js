const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('./config/database');
const Logger = require('./utils/logger');
const ReactionRole = require('./models/ReactionRole');
const { sequelize } = require('./config/database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// Initialize collections
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Ready event handler
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection test successful');
        
        // List all reaction roles
        const allRoles = await ReactionRole.findAll();
        console.log('Current reaction roles in database:', 
            allRoles.map(r => r.toJSON())
        );

        // Set bot presence
        await client.user.setPresence({
            activities: [{
                name: `${client.commands.size} commands`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
        
    } catch (error) {
        console.error('Error in ready event:', error);
    }
});

// Remove old event handlers
client.removeAllListeners('messageDelete');
client.removeAllListeners('guildMemberUpdate');
client.removeAllListeners('userUpdate');

// Login
client.login(process.env.TOKEN); 