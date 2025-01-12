const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        const channel = interaction.channel;
        const everyoneRole = interaction.guild.roles.everyone;
        const moderatorRole = interaction.guild.roles.cache.find(role => 
            role.name.toLowerCase() === 'moderator'
        );

        try {
            const isLocked = !channel.permissionsFor(everyoneRole).has(PermissionFlagsBits.SendMessages);

            if (!isLocked) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false
                });

                if (moderatorRole) {
                    await channel.permissionOverwrites.edit(moderatorRole, {
                        SendMessages: true,
                        AddReactions: true
                    });
                }

                await interaction.reply({
                    content: '🔒 Channel has been locked. Only administrators and moderators can send messages.',
                    ephemeral: false
                });

                await interaction.client.logger.logModAction(interaction, 'Channel Locked', { id: channel.id, tag: channel.name }, 'Channel lockdown enabled');
            } else {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null,
                    AddReactions: null
                });

                await interaction.reply({
                    content: '🔓 Channel has been unlocked. Everyone can now send messages.',
                    ephemeral: false
                });

                await interaction.client.logger.logModAction(interaction, 'Channel Unlocked', { id: channel.id, tag: channel.name }, 'Channel lockdown disabled');
            }
        } catch (error) {
            console.error('Lockdown error:', error);
            await interaction.reply({ 
                content: 'Failed to modify channel permissions. Please check my role hierarchy and permissions.', 
                ephemeral: true 
            });
        }
    },
}; 