const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Add reaction roles to a message')
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('The ID of the message to add reaction roles to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pairs')
                .setDescription('Emoji-role pairs (format: emoji1=@role1,emoji2=@role2)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('messageid');
        const pairsString = interaction.options.getString('pairs');

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            if (!message) {
                return interaction.reply({
                    content: 'Message not found in this channel.',
                    ephemeral: true
                });
            }

            // Parse emoji-role pairs
            const pairs = pairsString.split(',').map(pair => {
                const [emoji, roleId] = pair.trim().split('=');
                return {
                    emoji: emoji.trim(),
                    roleId: roleId.trim().replace(/[<@&>]/g, '') // Clean up role mention
                };
            });

            // Validate roles
            for (const pair of pairs) {
                const role = await interaction.guild.roles.fetch(pair.roleId);
                if (!role) {
                    return interaction.reply({
                        content: `Role not found for emoji ${pair.emoji}`,
                        ephemeral: true
                    });
                }
                // Add reaction to message
                await message.react(pair.emoji);
            }

            await ReactionRole.create({
                guildId: interaction.guild.id,
                messageId: messageId,
                channelId: interaction.channel.id,
                emojiRolePairs: pairs
            });

            await interaction.reply({
                content: `Successfully added ${pairs.length} reaction roles to the message.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error creating reaction roles:', error);
            await interaction.reply({
                content: 'Failed to create reaction roles. Make sure the emojis and roles are valid.',
                ephemeral: true
            });
        }
    }
}; 