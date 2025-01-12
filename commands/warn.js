const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const Warning = require('../models/Warning');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Manage warnings for a member')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a warning to a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List warnings for a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear warnings for a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to clear warnings for')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');
        const guildId = interaction.guild.id;
        const userId = target.id;

        switch (subcommand) {
            case 'add': {
                const reason = interaction.options.getString('reason');
                await Warning.create({
                    guildId,
                    userId,
                    moderatorId: interaction.user.id,
                    reason
                });

                const warningCount = await Warning.count({
                    where: { guildId, userId }
                });

                await interaction.reply({
                    content: `Warning added for ${target.tag}\nReason: ${reason}\nTotal warnings: ${warningCount}`,
                    ephemeral: true
                });
                break;
            }
            case 'list': {
                const warnings = await Warning.findAll({
                    where: { guildId, userId }
                });

                const embed = new EmbedBuilder()
                    .setTitle(`Warnings for ${target.tag}`)
                    .setColor('#FF4444')
                    .setDescription(
                        warnings.length > 0
                            ? warnings.map((w, i) => 
                                `${i + 1}. ${w.reason} (<t:${Math.floor(w.createdAt.getTime() / 1000)}:R>)`
                            ).join('\n')
                            : 'No warnings'
                    );

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                break;
            }
            case 'clear': {
                await Warning.destroy({
                    where: { guildId, userId }
                });

                await interaction.reply({
                    content: `Cleared all warnings for ${target.tag}`,
                    ephemeral: true
                });
                break;
            }
        }
    },
}; 