const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const userId = interaction.options.getString('userid');

        try {
            await interaction.guild.members.unban(userId);
            await interaction.reply({
                content: `Successfully unbanned user with ID: ${userId}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to unban the user. Please check if the ID is valid.',
                ephemeral: true
            });
        }
    },
}; 