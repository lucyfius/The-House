const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin, canModerate } = require('../utils/permissions');
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
                .setName('remove')
                .setDescription('Remove a specific warning from a member')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The member to remove warning from')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('warning_id')
                        .setDescription('The ID of the warning to remove')
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
        const targetMember = await interaction.guild.members.fetch(target.id);
        const moderator = interaction.member;

        // Check if moderator can moderate target
        if (!canModerate(moderator, targetMember)) {
            return interaction.reply({
                content: 'You cannot warn a member with equal or higher permissions than you.',
                ephemeral: true
            });
        }

        switch (subcommand) {
            case 'add': {
                const reason = interaction.options.getString('reason');
                await Warning.create({
                    guildId: interaction.guild.id,
                    userId: target.id,
                    moderatorId: interaction.user.id,
                    reason
                });

                const warningCount = await Warning.count({
                    where: { guildId: interaction.guild.id, userId: target.id }
                });

                // Create warning DM embed
                const warningEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Warning Received')
                    .setColor('#FF4444')
                    .setDescription(`You have received a warning in ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Total Warnings', value: `${warningCount}` }
                    )
                    .setTimestamp();

                try {
                    await target.send({ embeds: [warningEmbed] });
                } catch (error) {
                    console.error('Failed to DM user:', error);
                }

                await interaction.client.logger.logModAction(interaction, 'Member Warned', target, reason, { warningCount });

                // Auto-kick on 3 warnings
                if (warningCount >= 3) {
                    const kickMember = await interaction.guild.members.fetch(target.id);
                    if (kickMember) {
                        try {
                            const kickReason = `Automatic kick: Reached ${warningCount} warnings`;
                            await kickMember.kick(kickReason);
                            
                            // DM user about kick
                            const kickEmbed = new EmbedBuilder()
                                .setTitle('🚫 Auto-Kick Notice')
                                .setColor('#FF0000')
                                .setDescription(`You have been automatically kicked from ${interaction.guild.name}`)
                                .addFields(
                                    { name: 'Reason', value: kickReason },
                                    { name: 'Warning Count', value: `${warningCount}` }
                                )
                                .setTimestamp();

                            try {
                                await target.send({ embeds: [kickEmbed] });
                            } catch (error) {
                                console.error('Failed to DM user about kick:', error);
                            }

                            await interaction.client.logger.logModAction(interaction, 'Member Auto-Kicked', target, kickReason);

                            await interaction.reply({
                                content: `Warning added for ${target.tag}\nReason: ${reason}\nTotal warnings: ${warningCount}\nUser has been automatically kicked for reaching 3 warnings.`,
                                ephemeral: true
                            });
                            return;
                        } catch (error) {
                            console.error('Failed to auto-kick member:', error);
                            await interaction.reply({
                                content: `Warning added for ${target.tag}\nReason: ${reason}\nTotal warnings: ${warningCount}\nFailed to auto-kick member. Please check bot permissions.`,
                                ephemeral: true
                            });
                            return;
                        }
                    }
                }

                await interaction.reply({
                    content: `Warning added for ${target.tag}\nReason: ${reason}\nTotal warnings: ${warningCount}`,
                    ephemeral: true
                });
                break;
            }
            case 'remove': {
                const warningId = interaction.options.getInteger('warning_id');
                
                const warning = await Warning.findOne({
                    where: {
                        id: warningId,
                        guildId: interaction.guild.id,
                        userId: target.id
                    }
                });

                if (!warning) {
                    return interaction.reply({
                        content: 'Warning not found.',
                        ephemeral: true
                    });
                }

                await warning.destroy();

                const remainingWarnings = await Warning.count({
                    where: {
                        guildId: interaction.guild.id,
                        userId: target.id
                    }
                });

                await interaction.reply({
                    content: `Removed warning #${warningId} from ${target.tag}. They now have ${remainingWarnings} warning(s).`,
                    ephemeral: true
                });
                break;
            }
            case 'list': {
                try {
                    const warnings = await Warning.findAll({
                        where: {
                            guildId: interaction.guild.id,
                            userId: target.id
                        },
                        order: [['createdAt', 'DESC']]
                    });

                    if (warnings.length === 0) {
                        return interaction.reply({
                            content: `${target.tag} has no warnings.`,
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Warnings for ${target.tag}`)
                        .setColor('#FF4444')
                        .setDescription(warnings.map(warning => {
                            const timestamp = Math.floor(warning.createdAt.getTime() / 1000);
                            return `**Warning ID: \`#${warning.id}\`**\n` +
                                   `📅 <t:${timestamp}:R>\n` +
                                   `👮 Moderator: <@${warning.moderatorId}>\n` +
                                   `📝 Reason: ${warning.reason}\n` +
                                   `─────────────────`;
                        }).join('\n'))
                        .setFooter({ text: `Total Warnings: ${warnings.length}` })
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error listing warnings:', error);
                    await interaction.reply({
                        content: 'Failed to retrieve warnings.',
                        ephemeral: true
                    });
                }
                break;
            }
            case 'clear': {
                await Warning.destroy({
                    where: { guildId: interaction.guild.id, userId: target.id }
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