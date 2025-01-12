const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning'))
        .addNumberOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setMinValue(0)
                .setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const days = interaction.options.getNumber('days') ?? 0;

        try {
            await interaction.guild.members.ban(target, { 
                deleteMessageDays: days,
                reason: reason 
            });
            
            await interaction.client.logger.logModAction(interaction, 'Member Banned', target, reason, { deleteDays: days });
            
            await interaction.reply({
                content: `Successfully banned ${target.tag}\nReason: ${reason}\nMessage history deleted: ${days} days`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to ban the member. Check my permissions and role hierarchy.',
                ephemeral: true
            });
        }
    },
}; 