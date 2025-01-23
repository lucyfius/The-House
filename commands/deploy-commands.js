const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

// Force clear all commands first
(async () => {
    try {
        console.log('Started clearing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log('Successfully cleared application commands.');
    } catch (error) {
        console.error('Error clearing commands:', error);
    }
})(); 