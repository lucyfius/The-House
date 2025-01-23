const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('🧹 Purge messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: '❌ You need administrator permissions to use this command.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            // Fetch messages before deleting
            const messages = await interaction.channel.messages.fetch({ 
                limit: amount,
                before: interaction.id // Get messages before the command message
            });

            // Delete messages
            await interaction.channel.bulkDelete(messages, true)
                .then(deleted => {
                    interaction.reply({
                        content: `✅ Successfully deleted ${deleted.size} messages.`,
                        ephemeral: true
                    });
                })
                .catch(error => {
                    if (error.code === 50034) { // Message older than 14 days
                        interaction.reply({
                            content: '❌ Some messages are too old to be bulk deleted. Try deleting fewer messages or use individual deletion.',
                            ephemeral: true
                        });
                    } else {
                        throw error;
                    }
                });

        } catch (error) {
            console.error('Error purging messages:', error);
            await interaction.reply({
                content: `❌ Failed to purge messages: ${error.message}`,
                ephemeral: true
            });
        }
    },
}; 