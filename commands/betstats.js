const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { generateWinRateChart, generateProfitChart } = require('../utils/chartGenerator');
const BetStats = require('../models/BetStats');
const { Op } = require('sequelize');
const { isAdmin } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('betstats')
        .setDescription('Manage and view betting statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new bet result')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of bet')
                        .setRequired(true)
                        .addChoices(
                            { name: 'First to 5', value: 'FIRST_TO_5' },
                            { name: 'Game Win', value: 'GAME_WIN' },
                            { name: 'Kill Under', value: 'KILL_UNDER' },
                            { name: 'Time Over', value: 'TIME_OVER' },
                            { name: 'Round Winner', value: 'ROUND_WINNER' },
                            { name: 'Player Performance', value: 'PLAYER_PERFORMANCE' },
                            { name: 'Map Winner', value: 'MAP_WINNER' },
                            { name: 'Other', value: 'OTHER' }
                        ))
                .addStringOption(option =>
                    option.setName('result')
                        .setDescription('Win or Loss')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Win', value: 'win' },
                            { name: 'Loss', value: 'loss' }
                        ))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount won/lost')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('odds')
                        .setDescription('Betting odds (optional)'))
                .addStringOption(option =>
                    option.setName('details')
                        .setDescription('Additional details')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View betting statistics')
                .addStringOption(option =>
                    option.setName('timeframe')
                        .setDescription('Time period to view')
                        .addChoices(
                            { name: 'All Time', value: 'all' },
                            { name: 'This Year', value: 'year' },
                            { name: 'This Month', value: 'month' },
                            { name: 'This Week', value: 'week' }
                        ))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Filter by bet type')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a recent bet entry')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Bet ID to edit')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('result')
                        .setDescription('New result'))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('New amount')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a bet entry')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Bet ID to delete')
                        .setRequired(true))),

    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add': {
                const betType = interaction.options.getString('type');
                const result = interaction.options.getString('result') === 'win';
                const amount = interaction.options.getNumber('amount');
                const odds = interaction.options.getNumber('odds');
                const details = interaction.options.getString('details');

                try {
                    const bet = await BetStats.create({
                        guildId: interaction.guild.id,
                        userId: interaction.user.id,
                        betType,
                        result,
                        amount,
                        odds,
                        details
                    });

                    // Create embed for the bet
                    const embed = new EmbedBuilder()
                        .setTitle('🎲 New Bet Recorded')
                        .setColor(result ? '#00FF00' : '#FF0000')
                        .addFields(
                            { name: 'Type', value: betType.replace(/_/g, ' '), inline: true },
                            { name: 'Result', value: result ? '✅ Win' : '❌ Loss', inline: true },
                            { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
                            { name: 'Odds', value: odds ? `${odds}` : 'Not specified', inline: true },
                            { name: 'Details', value: details || 'No details provided' }
                        )
                        .setFooter({ text: `Bet ID: ${bet.id}` })
                        .setTimestamp();

                    // Get user's current stats
                    const userStats = await BetStats.findAll({
                        where: {
                            userId: interaction.user.id,
                            guildId: interaction.guild.id
                        }
                    });

                    const totalBets = userStats.length;
                    const wins = userStats.filter(b => b.result).length;
                    const winRate = ((wins / totalBets) * 100).toFixed(2);
                    const totalProfit = userStats.reduce((sum, b) => 
                        sum + (b.result ? b.amount : -b.amount), 0);

                    embed.addFields(
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Total Bets', value: totalBets.toString(), inline: true },
                        { name: 'Win Rate', value: `${winRate}%`, inline: true },
                        { name: 'Total Profit/Loss', value: `$${totalProfit.toFixed(2)}`, inline: true }
                    );

                    await interaction.reply({
                        embeds: [embed]
                    });
                } catch (error) {
                    console.error('Error adding bet:', error);
                    await interaction.reply({
                        content: 'Failed to record bet.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'view': {
                const timeframe = interaction.options.getString('timeframe') || 'all';
                const betType = interaction.options.getString('type');
                const whereClause = { 
                    guildId: interaction.guild.id,
                    userId: interaction.user.id
                };

                if (timeframe !== 'all') {
                    const now = new Date();
                    const startDate = new Date();
                    
                    switch (timeframe) {
                        case 'year':
                            startDate.setMonth(0, 1);
                            break;
                        case 'month':
                            startDate.setDate(1);
                            break;
                        case 'week':
                            startDate.setDate(now.getDate() - now.getDay());
                            break;
                    }

                    whereClause.date = {
                        [Op.gte]: startDate
                    };
                }

                if (betType) whereClause.betType = betType;

                try {
                    const bets = await BetStats.findAll({
                        where: whereClause,
                        order: [['date', 'DESC']]
                    });

                    // Calculate statistics
                    const totalBets = bets.length;
                    const wins = bets.filter(bet => bet.result).length;
                    const winRate = totalBets ? (wins / totalBets * 100).toFixed(2) : 0;
                    const totalProfit = bets.reduce((sum, bet) => 
                        sum + (bet.result ? bet.amount : -bet.amount), 0);

                    // Prepare data for charts
                    const chartData = {
                        labels: bets.map(bet => new Date(bet.date).toLocaleDateString()),
                        winRates: [],
                        profits: []
                    };

                    let runningWins = 0;
                    let runningTotal = 0;
                    let runningProfit = 0;

                    bets.forEach((bet, index) => {
                        if (bet.result) runningWins++;
                        runningTotal++;
                        runningProfit += bet.result ? bet.amount : -bet.amount;
                        
                        chartData.winRates.push((runningWins / runningTotal) * 100);
                        chartData.profits.push(runningProfit);
                    });

                    // Generate charts
                    const winRateChart = await generateWinRateChart(chartData);
                    const profitChart = await generateProfitChart(chartData);

                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('🎲 Betting Statistics')
                        .setColor(totalProfit >= 0 ? '#00FF00' : '#FF0000')
                        .addFields(
                            { name: 'Total Bets', value: totalBets.toString(), inline: true },
                            { name: 'Wins', value: wins.toString(), inline: true },
                            { name: 'Win Rate', value: `${winRate}%`, inline: true },
                            { name: 'Total Profit/Loss', value: `$${totalProfit.toFixed(2)}`, inline: true }
                        )
                        .setTimestamp();

                    // Send response with charts
                    const winRateAttachment = new AttachmentBuilder(winRateChart, { name: 'winrate.png' });
                    const profitAttachment = new AttachmentBuilder(profitChart, { name: 'profit.png' });

                    await interaction.reply({
                        embeds: [embed],
                        files: [winRateAttachment, profitAttachment]
                    });
                } catch (error) {
                    console.error('Error viewing stats:', error);
                    await interaction.reply({
                        content: 'Failed to retrieve betting statistics.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'edit': {
                const betId = interaction.options.getInteger('id');
                const newResult = interaction.options.getBoolean('result');
                const newAmount = interaction.options.getNumber('amount');

                try {
                    const bet = await BetStats.findOne({
                        where: {
                            id: betId,
                            userId: interaction.user.id,
                            guildId: interaction.guild.id
                        }
                    });

                    if (!bet) {
                        return interaction.reply({
                            content: 'Bet not found or you do not have permission to edit it.',
                            ephemeral: true
                        });
                    }

                    if (newResult !== null) bet.result = newResult;
                    if (newAmount !== null) bet.amount = newAmount;
                    await bet.save();

                    await interaction.reply({
                        content: `Bet #${betId} updated successfully.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error editing bet:', error);
                    await interaction.reply({
                        content: 'Failed to edit bet.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'delete': {
                const betId = interaction.options.getInteger('id');

                try {
                    const deleted = await BetStats.destroy({
                        where: {
                            id: betId,
                            userId: interaction.user.id,
                            guildId: interaction.guild.id
                        }
                    });

                    if (!deleted) {
                        return interaction.reply({
                            content: 'Bet not found or you do not have permission to delete it.',
                            ephemeral: true
                        });
                    }

                    await interaction.reply({
                        content: `Bet #${betId} deleted successfully.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error deleting bet:', error);
                    await interaction.reply({
                        content: 'Failed to delete bet.',
                        ephemeral: true
                    });
                }
                break;
            }
        }
    }
}; 