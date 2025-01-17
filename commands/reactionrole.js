const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Create a reaction role message')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to react with')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to display')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');
        const messageText = interaction.options.getString('message');

        try {
            const message = await interaction.channel.send(messageText);
            await message.react(emoji);

            await ReactionRole.create({
                guildId: interaction.guild.id,
                messageId: message.id,
                channelId: interaction.channel.id,
                emoji: emoji,
                roleId: role.id
            });

            await interaction.reply({
                content: 'Reaction role created successfully!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error creating reaction role:', error);
            await interaction.reply({
                content: 'Failed to create reaction role. Make sure the emoji is valid.',
                ephemeral: true
            });
        }
    }
}; 