const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('./config/database');
const Logger = require('./utils/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();

// Command Handler
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
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

        client.user.setActivity({
            name: 'Sugar Rush',
            type: ActivityType.Playing,
            state: 'Slot Machine',
            assets: {
                largeImage: 'sugarrush',
                largeText: 'Sugar Rush Slot'
            }
        });

        console.log('Successfully reloaded application (/) commands.');
        console.log(`Logged in as ${client.user.tag}!`);
    } catch (error) {
        console.error('Error setting presence:', error);
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
    await client.logger.logMessageDelete(message);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    await client.logger.logMemberUpdate(oldMember, newMember);
});

client.on('userUpdate', async (oldUser, newUser) => {
    await client.logger.logUserUpdate(oldUser, newUser);
});

client.login(process.env.TOKEN); 