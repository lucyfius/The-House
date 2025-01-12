const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const ServerLog = require('../models/ServerLog');
const { Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Search and review server logs')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search logs by criteria')
                .addStringOption(option =>
                    option.setName('category')
                    .setDescription('Log category to search')
                    .addChoices(
                        { name: 'Moderation', value: 'MOD_ACTIONS' },
                        { name: 'User Updates', value: 'USER_UPDATES' },
                        { name: 'Messages', value: 'MESSAGE_LOGS' },
                        { name: 'Join/Leave', value: 'JOIN_LEAVE' },
                        { name: 'Voice', value: 'VOICE_LOGS' },
                        { name: 'Roles', value: 'ROLE_LOGS' }
                    ))
                .addUserOption(option =>
                    option.setName('user')
                    .setDescription('Search logs involving this user'))
                .addStringOption(option =>
                    option.setName('timeframe')
                    .setDescription('Time period to search')
                    .addChoices(
                        { name: 'Last 24 hours', value: '24h' },
                        { name: 'Last 7 days', value: '7d' },
                        { name: 'Last 30 days', value: '30d' }
                    )))
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const category = interaction.options.getString('category');
        const user = interaction.options.getUser('user');
        const timeframe = interaction.options.getString('timeframe') || '24h';

        const timeframes = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const whereClause = {
            guildId: interaction.guild.id,
            timestamp: {
                [Op.gte]: new Date(Date.now() - timeframes[timeframe])
            }
        };

        if (category) whereClause.category = category;
        if (user) {
            whereClause[Op.or] = [
                { executorId: user.id },
                { targetId: user.id }
            ];
        }

        const logs = await ServerLog.findAll({
            where: whereClause,
            order: [['timestamp', 'DESC']],
            limit: 25
        });

        const embed = new EmbedBuilder()
            .setTitle('Server Logs')
            .setColor('#0099FF')
            .setDescription(logs.length === 0 ? 'No logs found.' : 
                logs.map(log => {
                    const timestamp = Math.floor(log.timestamp.getTime() / 1000);
                    return `**[<t:${timestamp}:R>] ${log.actionType}**\n` +
                           `• Executor: ${log.executorId ? `<@${log.executorId}>` : 'System'}\n` +
                           `• Target: ${log.targetId ? `<@${log.targetId}>` : 'N/A'}\n` +
                           `• Details: ${JSON.stringify(log.details, null, 2)}\n`;
                }).join('\n')
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}; 