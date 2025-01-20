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

console.log('Found command files:', commandFiles); // Debug log

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        console.log(`Loading command from ${file}:`, {
            hasData: 'data' in command,
            hasExecute: 'execute' in command,
            name: command.data?.name
        });
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Successfully loaded command: ${command.data.name}`);
        } else {
            console.log(`Skipping ${file} - missing required properties`);
        }
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

// Deploy commands
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const commands = [];
        for (const command of client.commands.values()) {
            commands.push(command.data.toJSON());
            console.log(`Registering command: ${command.data.name}`); // Debug log
        }

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

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
        // Set bot presence
        await client.user.setPresence({
            activities: [{
                name: 'Sugar Rush Slot',
                type: ActivityType.Playing
            }],
            status: 'online'
        });
        
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection test successful');
        
        // List all reaction roles
        const allRoles = await ReactionRole.findAll();
        console.log('Current reaction roles in database:', 
            allRoles.map(r => ({
                ...r.toJSON(),
                emojiRolePairs: r.emojiRolePairs.map(p => ({
                    emoji: p.emoji,
                    roleId: p.roleId
                }))
            }))
        );
    } catch (error) {
        console.error('Error in ready event:', error);
    }
});

// Handle commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        console.log('Ignoring non-command interaction');
        return;
    }

    console.log('Received command interaction:', {
        commandName: interaction.commandName,
        user: interaction.user.tag,
        guild: interaction.guild?.name
    });

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.log(`Command not found: ${interaction.commandName}`);
        return;
    }

    try {
        console.log(`Executing command: ${interaction.commandName}`);
        await command.execute(interaction);
        console.log(`Successfully executed command: ${interaction.commandName}`);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            });
        }
    }
});

// Remove old event handlers
client.removeAllListeners('messageDelete');
client.removeAllListeners('guildMemberUpdate');
client.removeAllListeners('userUpdate');

// Login
client.login(process.env.TOKEN); 