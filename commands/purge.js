const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge messages from the channel (no limit)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to purge')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount');
        const channel = interaction.channel;
        let deletedTotal = 0;

        try {
            await interaction.deferReply({ ephemeral: true });

            // Delete messages in batches of 100
            while (deletedTotal < amount) {
                const toDelete = Math.min(100, amount - deletedTotal);
                const messages = await channel.messages.fetch({ limit: toDelete });
                await channel.bulkDelete(messages, true);
                deletedTotal += messages.size;

                // If less messages were fetched than requested, we've hit the end
                if (messages.size < toDelete) break;
            }

            await interaction.client.logger.logModAction(
                interaction,
                'Channel Purged',
                { 
                    id: channel.id, 
                    tag: `#${channel.name}` 
                },
                `${interaction.user.tag} purged ${deletedTotal} messages in #${channel.name}`,
                { 
                    channelId: channel.id,
                    messageCount: deletedTotal
                }
            );

            await interaction.editReply({
                content: `Successfully purged ${deletedTotal} messages.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Purge error:', error);
            await interaction.editReply({
                content: 'Failed to purge messages. Messages older than 14 days cannot be bulk deleted.',
                ephemeral: true
            });
        }
    },
}; 