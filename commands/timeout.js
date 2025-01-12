const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // Max 28 days
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const target = interaction.options.getMember('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            await target.timeout(duration * 60 * 1000, reason);
            await interaction.reply({
                content: `Successfully timed out ${target.user.tag} for ${duration} minutes.\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to timeout the member. Check my permissions and role hierarchy.',
                ephemeral: true
            });
        }
    },
}; 