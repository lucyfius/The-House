const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('./config/database');
const Logger = require('./utils/logger');
const ReactionRole = require('./models/ReactionRole');

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

// Load commands
client.commands = new Collection();
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

// Deploy commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const clientId = process.env.CLIENT_ID;

initDatabase();

client.logger = new Logger(client);

client.once('ready', async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        // Set presence with full details
        client.user.setPresence({
            activities: [{
                name: 'Sugar Rush',
                type: ActivityType.Playing,
                state: 'Slot Machine',
                assets: {
                    large_image: 'sugarrush',
                    large_text: 'Sugar Rush Slot'
                }
            }],
            status: 'online'
        });

        // Log any presence update errors
        client.on('presenceUpdate', (oldPresence, newPresence) => {
            console.log('Presence Update:', {
                old: oldPresence?.activities,
                new: newPresence?.activities
            });
        });

        console.log('Successfully reloaded application (/) commands.');
        console.log(`Logged in as ${client.user.tag}!`);
    } catch (error) {
        console.error('Error setting presence:', error);
        console.error(error.stack);
    }
});

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error executing this command!', 
            ephemeral: true 
        });
    }
});

client.on('messageDelete', async message => {
    // await client.logger.logMessageDelete(message);
    console.log('Message deleted:', message.id);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // await client.logger.logMemberUpdate(oldMember, newMember);
    console.log('Member updated:', newMember.id);
});

client.on('userUpdate', async (oldUser, newUser) => {
    // await client.logger.logUserUpdate(oldUser, newUser);
    console.log('User updated:', newUser.id);
});

client.login(process.env.TOKEN); 