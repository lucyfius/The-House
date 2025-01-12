const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ 
                content: 'Please provide a valid member to kick.', 
                ephemeral: true 
            });
        }

        try {
            await target.kick(reason);
            await interaction.client.logger.logModAction(interaction, 'Member Kicked', target.user, reason);
            await interaction.reply({
                content: `Successfully kicked ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to kick the member. Check my permissions and role hierarchy.', 
                ephemeral: true 
            });
        }
    },
}; 