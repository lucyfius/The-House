const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({
                content: `Successfully deleted ${messages.size} messages.`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.',
                ephemeral: true
            });
        }
    },
}; 