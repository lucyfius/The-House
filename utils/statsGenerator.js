const { EmbedBuilder } = require('discord.js');
const { BetStats } = require('../models/BetStats');
const { Op } = require('sequelize');

async function generateStatsEmbed(userId, guildId, timeframe = 'all') {
    const whereClause = {
        userId,
        guildId
    };

    // Add time filter
    if (timeframe !== 'all') {
        const timeframes = {
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000,
            'year': 365 * 24 * 60 * 60 * 1000
        };
        
        whereClause.date = {
            [Op.gte]: new Date(Date.now() - timeframes[timeframe])
        };
    }

    const bets = await BetStats.findAll({
        where: whereClause,
        order: [['date', 'DESC']]
    });

    // Calculate statistics
    const totalBets = bets.length;
    const wins = bets.filter(bet => bet.result).length;
    const totalUnits = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const profitUnits = bets.reduce((sum, bet) => sum + (bet.result ? bet.amount : -bet.amount), 0);
    const winRate = totalBets > 0 ? (wins / totalBets * 100).toFixed(1) : 0;

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('📊 Betting Statistics')
        .setColor(profitUnits >= 0 ? '#00FF00' : '#FF0000')
        .addFields(
            { name: '📈 Overview', value: 
                `Total Bets: ${totalBets}\n` +
                `Win Rate: ${winRate}%\n` +
                `Units Wagered: ${totalUnits}\n` +
                `Profit/Loss: ${profitUnits > 0 ? '+' : ''}${profitUnits}u`
            },
            { name: '🎯 Recent Bets', value: 
                bets.slice(0, 5).map(bet => 
                    `${bet.result ? '✅' : '❌'} ${bet.betType.replace(/_/g, ' ')}: ` +
                    `${bet.result ? '+' : '-'}${bet.amount}u ` +
                    `(ID: ${bet.id})`
                ).join('\n') || 'No bets yet'
            }
        )
        .setFooter({ text: `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Stats • Auto-updates with new bets` })
        .setTimestamp();

    return embed;
}

module.exports = { generateStatsEmbed }; 