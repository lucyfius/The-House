const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearreactionroles')
        .setDescription('Clear all reaction role configurations')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        console.log('Executing clearreactionroles command'); // Debug log
        
        if (!isAdmin(interaction.member)) {
            console.log('User lacks admin permissions'); // Debug log
            await interaction.reply({
                content: 'You need Administrator permissions to use this command.',
                ephemeral: true
            });
            return;
        }

        try {
            console.log('Attempting to clear reaction roles'); // Debug log
            const count = await ReactionRole.destroy({
                where: {
                    guildId: interaction.guild.id
                }
            });

            console.log(`Cleared ${count} reaction roles`); // Debug log
            await interaction.reply({
                content: `Successfully cleared ${count} reaction role configuration(s).`,
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