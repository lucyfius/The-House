const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BetStats, BetStatsView } = require('../models/BetStats');
const { generateStatsEmbed } = require('../utils/statsGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('betstats')
        .setDescription('📊 Track your betting history')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Add a new bet')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('🎮 What type of bet?')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎯 First to 5', value: 'FIRST_TO_5' },
                            { name: '🏆 Game Win', value: 'GAME_WIN' },
                            { name: '💀 Kill Under', value: 'KILL_UNDER' },
                            { name: '⏰ Time Over', value: 'TIME_OVER' },
                            { name: '🎲 Round Winner', value: 'ROUND_WINNER' },
                            { name: '👤 Player Performance', value: 'PLAYER_PERFORMANCE' },
                            { name: '🗺️ Map Winner', value: 'MAP_WINNER' },
                            { name: '📝 Other', value: 'OTHER' }
                        ))
                .addStringOption(option =>
                    option.setName('result')
                        .setDescription('✨ Did you win or lose?')
                        .setRequired(true)
                        .addChoices(
                            { name: '✅ Won', value: 'win' },
                            { name: '❌ Lost', value: 'loss' }
                        ))
                .addNumberOption(option =>
                    option.setName('units')
                        .setDescription('💰 How many units? (positive number)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('notes')
                        .setDescription('📝 Any notes to remember this bet?')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('📈 See your betting history')
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('⏰ Which time period?')
                        .addChoices(
                            { name: '📊 All Time', value: 'all' },
                            { name: '📅 This Year', value: 'year' },
                            { name: '📅 This Month', value: 'month' },
                            { name: '📅 This Week', value: 'week' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fix')
                .setDescription('✏️ Fix a mistake in your last few bets')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('🔢 Which bet? (ID number)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('result')
                        .setDescription('✨ Update the result?')
                        .addChoices(
                            { name: '✅ Won', value: 'win' },
                            { name: '❌ Lost', value: 'loss' }
                        ))
                .addNumberOption(option =>
                    option.setName('units')
                        .setDescription('💰 New units amount')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('🗑️ Remove a bet from your history')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('🔢 Which bet to remove? (ID number)')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'show': {
                const timeframe = interaction.options.getString('time') || 'all';
                
                try {
                    const embed = await generateStatsEmbed(interaction.user.id, interaction.guild.id, timeframe);
                    const message = await interaction.channel.send({ embeds: [embed] });
                    
                    // Save or update view
                    await BetStatsView.upsert({
                        guildId: interaction.guild.id,
                        channelId: interaction.channel.id,
                        messageId: message.id,
                        userId: interaction.user.id,
                        timeframe: timeframe
                    });

                    await interaction.reply({
                        content: '📊 Your stats view has been created! It will automatically update when you add new bets.',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error creating stats view:', error);
                    await interaction.reply({
                        content: '❌ Failed to create stats view.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'add': {
                // Get bet details from interaction
                const type = interaction.options.getString('type');
                const result = interaction.options.getString('result') === 'win';
                const units = interaction.options.getNumber('units');
                const notes = interaction.options.getString('notes');

                try {
                    // Add the bet
                    await BetStats.create({
                        guildId: interaction.guild.id,
                        userId: interaction.user.id,
                        betType: type,
                        result: result,
                        amount: units,
                        details: notes,
                        date: new Date()
                    });

                    // Update existing view if it exists
                    const view = await BetStatsView.findOne({
                        where: {
                            guildId: interaction.guild.id,
                            userId: interaction.user.id
                        }
                    });

                    if (view) {
                        try {
                            const channel = await interaction.client.channels.fetch(view.channelId);
                            const message = await channel.messages.fetch(view.messageId);
                            const newEmbed = await generateStatsEmbed(interaction.user.id, interaction.guild.id, view.timeframe);
                            await message.edit({ embeds: [newEmbed] });
                        } catch (error) {
                            console.error('Error updating stats view:', error);
                            // If message was deleted, remove the view
                            await view.destroy();
                        }
                    }

                    await interaction.reply({
                        content: `✅ Bet added: ${result ? 'Won' : 'Lost'} ${units} units on ${type.replace(/_/g, ' ').toLowerCase()}`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error adding bet:', error);
                    await interaction.reply({
                        content: '❌ Failed to add bet.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'fix': {
                const betId = interaction.options.getInteger('id');
                const newResult = interaction.options.getString('result');
                const newUnits = interaction.options.getNumber('units');

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
                            content: '❌ Bet not found or you don\'t have permission to edit it.',
                            ephemeral: true
                        });
                    }

                    if (newResult) bet.result = newResult === 'win';
                    if (newUnits !== null) bet.amount = newUnits;
                    await bet.save();

                    // Update stats view if exists
                    const view = await BetStatsView.findOne({
                        where: {
                            guildId: interaction.guild.id,
                            userId: interaction.user.id
                        }
                    });

                    if (view) {
                        try {
                            const channel = await interaction.client.channels.fetch(view.channelId);
                            const message = await channel.messages.fetch(view.messageId);
                            const newEmbed = await generateStatsEmbed(interaction.user.id, interaction.guild.id, view.timeframe);
                            await message.edit({ embeds: [newEmbed] });
                        } catch (error) {
                            console.error('Error updating stats view:', error);
                            await view.destroy();
                        }
                    }

                    await interaction.reply({
                        content: `✅ Bet #${betId} has been updated!`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error fixing bet:', error);
                    await interaction.reply({
                        content: '❌ Failed to update bet.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'remove': {
                const betId = interaction.options.getInteger('id');

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
                            content: '❌ Bet not found or you don\'t have permission to remove it.',
                            ephemeral: true
                        });
                    }

                    await bet.destroy();

                    // Update stats view if exists
                    const view = await BetStatsView.findOne({
                        where: {
                            guildId: interaction.guild.id,
                            userId: interaction.user.id
                        }
                    });

                    if (view) {
                        try {
                            const channel = await interaction.client.channels.fetch(view.channelId);
                            const message = await channel.messages.fetch(view.messageId);
                            const newEmbed = await generateStatsEmbed(interaction.user.id, interaction.guild.id, view.timeframe);
                            await message.edit({ embeds: [newEmbed] });
                        } catch (error) {
                            console.error('Error updating stats view:', error);
                            await view.destroy();
                        }
                    }

                    await interaction.reply({
                        content: `✅ Bet #${betId} has been removed!`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error removing bet:', error);
                    await interaction.reply({
                        content: '❌ Failed to remove bet.',
                        ephemeral: true
                    });
                }
                break;
            }
        }
    }
}; 