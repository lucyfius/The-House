const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearreactionroles')
        .setDescription('Clear all reaction role configurations')
        .addBooleanOption(option => 
            option.setName('confirm')
                .setDescription('Confirm that you want to permanently delete all reaction roles')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        console.log('Executing clearreactionroles command');
        
        if (!isAdmin(interaction.member)) {
            console.log('User lacks admin permissions');
            await interaction.reply({
                content: 'You need Administrator permissions to use this command.',
                ephemeral: true
            });
            return;
        }

        const confirmed = interaction.options.getBoolean('confirm');
        if (!confirmed) {
            await interaction.reply({
                content: '⚠️ This action will permanently delete all reaction role configurations. Use `/clearreactionroles confirm:true` to proceed.',
                ephemeral: true
            });
            return;
        }

        try {
            console.log('Attempting to clear reaction roles');
            const count = await ReactionRole.destroy({
                where: {
                    guildId: interaction.guild.id
                }
            });

            console.log(`Cleared ${count} reaction roles`);
            await interaction.reply({
                content: `⚠️ Successfully cleared ${count} reaction role configuration(s). These cannot be recovered.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error clearing reaction roles:', error);
            await interaction.reply({
                content: '❌ Error clearing reaction roles.',
                ephemeral: true
            });
        }
    }
}; 