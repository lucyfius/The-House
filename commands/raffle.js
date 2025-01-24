const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { checkRateLimit, checkRaidPrevention } = require('../utils/rateLimiter');
const Raffle = require('../models/Raffle');
const { client } = require('../index.js');
const { endRaffle } = require('../utils/raffleUtils');
const ms = require('ms');

// Helper function to convert duration to milliseconds
function parseDuration(duration) {
    try {
        const milliseconds = ms(duration);
        if (!milliseconds) throw new Error('Invalid duration');
        if (milliseconds < 5000) throw new Error('Duration too short'); // Minimum 5 seconds
        if (milliseconds > ms('7d')) throw new Error('Duration too long'); // Maximum 7 days
        return milliseconds;
    } catch (error) {
        throw new Error('Invalid duration format. Examples: 30s, 5m, 2h, 1d');
    }
}

// Helper function to format milliseconds to human readable
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
}

// Helper function to update raffle message
async function updateRaffleMessage(raffle, channel) {
    try {
        const message = await channel.messages.fetch(raffle.messageId);
        if (!message) return;

        const endTime = new Date(raffle.endTime);
        const embed = new EmbedBuilder()
            .setTitle('🎰 New Raffle Started!')
            .setColor('#FFD700')
            .setDescription(`
**Prize:** ${raffle.prize}

**How to Enter:**
• Use \`/raffle join\` with your lucky number (1-100)
• A random winning number will be drawn
• The closest number(s) win!
• Winners can challenge each other using \`/raffle gamble\`

**Details:**
🏆 Winners: ${raffle.winnerCount}
⏰ Ends: <t:${Math.floor(endTime.getTime() / 1000)}:R>
👥 Current Entries: ${raffle.entries.length}
            `)
            .setFooter({ text: 'May the odds be ever in your favor!' })
            .setTimestamp();

        await message.edit({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating raffle message:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raffle')
        .setDescription('🎉 Start fun raffles with betting')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('🎲 Start a new raffle')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('💝 What will the winner get?')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('👥 How many winners?')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('⏰ How long? (e.g., 30s, 5m, 2h, 1d)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('🎫 Join the active raffle')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('🎯 Pick your lucky number (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('🚪 Leave the active raffle'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('🏁 End the current raffle (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('❌ Cancel the current raffle (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('gamble')
                .setDescription('🎲 Challenge another winner - Winner takes all prizes, loser gets nothing!')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('🤝 Which winner do you want to challenge?')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('side')
                        .setDescription('🪙 Choose your side of the coin')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Heads', value: 'heads' },
                            { name: 'Tails', value: 'tails' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('✅ Accept a betting challenge'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('decline')
                .setDescription('❌ Decline a betting challenge')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'leave': {
                // Rate limit for leave command
                const leaveRateLimit = checkRateLimit(interaction.user.id, 'raffle-leave', 5);
                if (leaveRateLimit.limited) {
                    return interaction.reply({
                        content: `⏰ Please wait ${leaveRateLimit.timeLeft} seconds before trying to leave again.`,
                        ephemeral: true
                    });
                }

                // Check for active raffle
                const activeRaffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: 'ACTIVE'
                    }
                });

                if (!activeRaffle) {
                    return interaction.reply({
                        content: '❌ There is no active raffle to leave!',
                        ephemeral: true
                    });
                }

                const entries = activeRaffle.entries || [];
                const numbers = activeRaffle.numbers || [];

                // Check if user is in the raffle
                const userIndex = entries.indexOf(interaction.user.id);
                if (userIndex === -1) {
                    return interaction.reply({
                        content: '❌ You are not in this raffle!',
                        ephemeral: true
                    });
                }

                try {
                    // Remove user from entries and their number from numbers array
                    activeRaffle.entries = entries.filter((_, index) => index !== userIndex);
                    activeRaffle.numbers = numbers.filter((_, index) => index !== userIndex);
                    await activeRaffle.save();

                    // Update the raffle message
                    await updateRaffleMessage(activeRaffle, interaction.channel);

                    const embed = new EmbedBuilder()
                        .setTitle('👋 Raffle Leave')
                        .setColor('#FF0000')
                        .setDescription(`${interaction.user} has left the raffle.`)
                        .setFooter({ text: `Total Entries: ${activeRaffle.entries.length}` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error leaving raffle:', error);
                    await interaction.reply({
                        content: '❌ Failed to leave the raffle. Please try again.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'join': {
                // Rate limit for join command
                const joinRateLimit = checkRateLimit(interaction.user.id, 'raffle-join', 5);
                if (joinRateLimit.limited) {
                    return interaction.reply({
                        content: `⏰ Please wait ${joinRateLimit.timeLeft} seconds before joining again.`,
                        ephemeral: true
                    });
                }

                // Check for active raffle
                const activeRaffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: 'ACTIVE'
                    }
                });

                if (!activeRaffle) {
                    return interaction.reply({
                        content: '❌ There is no active raffle to join!',
                        ephemeral: true
                    });
                }

                const number = interaction.options.getInteger('number');

                // Check if the number is already taken
                const entries = activeRaffle.entries || [];
                const numbers = activeRaffle.numbers || [];

                if (numbers.includes(number)) {
                    return interaction.reply({
                        content: `❌ Number ${number} has already been chosen! Please pick a different number.`,
                        ephemeral: true
                    });
                }

                // Check if user already joined
                if (entries.includes(interaction.user.id)) {
                    return interaction.reply({
                        content: '❌ You have already joined this raffle!',
                        ephemeral: true
                    });
                }

                try {
                    // Add user to entries and their number to numbers array
                    activeRaffle.entries = [...entries, interaction.user.id];
                    activeRaffle.numbers = [...numbers, number];
                    await activeRaffle.save();

                    // Update the raffle message
                    await updateRaffleMessage(activeRaffle, interaction.channel);

                    const embed = new EmbedBuilder()
                        .setTitle('🎫 Raffle Entry')
                        .setColor('#00FF00')
                        .setDescription(`${interaction.user} joined with number ${number}!`)
                        .setFooter({ text: `Total Entries: ${activeRaffle.entries.length}` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error joining raffle:', error);
                    await interaction.reply({
                        content: '❌ Failed to join the raffle. Please try again.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'gamble': {
                const raffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: ['BETTING', 'ENDED']
                    },
                    order: [['createdAt', 'DESC']]
                });

                if (!raffle) {
                    return interaction.reply({
                        content: '❌ There is no raffle in the challenge phase!',
                        ephemeral: true
                    });
                }

                console.log('Debug - Raffle found for betting:', {
                    raffleId: raffle.id,
                    status: raffle.status,
                    winners: raffle.winners
                });

                const winners = raffle.winners;
                
                console.log('Debug - Challenge check:', {
                    userId: interaction.user.id,
                    winners,
                    isArray: Array.isArray(winners),
                    includes: winners.includes(interaction.user.id),
                    rawWinners: raffle.getDataValue('winners')
                });

                if (!Array.isArray(winners)) {
                    console.error('Winners is not an array:', winners);
                    return interaction.reply({
                        content: '❌ Error processing winners list. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                if (!winners.includes(interaction.user.id)) {
                    return interaction.reply({
                        content: '❌ Only raffle winners can initiate challenges!',
                        ephemeral: true
                    });
                }

                const opponent = interaction.options.getUser('opponent');

                // Check if opponent is a winner
                if (!winners.includes(opponent.id)) {
                    return interaction.reply({
                        content: '❌ You can only challenge other raffle winners!',
                        ephemeral: true
                    });
                }

                // Only apply rate limit if all validations pass
                const betRateLimit = checkRateLimit(interaction.user.id, 'raffle-bet', 5);
                if (betRateLimit.limited) {
                    return interaction.reply({
                        content: `⏰ Please wait ${betRateLimit.timeLeft} seconds between placing bets.`,
                        ephemeral: true
                    });
                }

                // Check if either user is already in a bet
                if (raffle.bettingRound && (
                    raffle.bettingRound.challenger === interaction.user.id ||
                    raffle.bettingRound.challenger === opponent.id ||
                    raffle.bettingRound.opponent === interaction.user.id ||
                    raffle.bettingRound.opponent === opponent.id
                )) {
                    return interaction.reply({
                        content: '❌ One of the users is already in an active challenge!',
                        ephemeral: true
                    });
                }

                const chosenSide = interaction.options.getString('side');
                raffle.bettingRound = {
                    challenger: interaction.user.id,
                    opponent: opponent.id,
                    status: 'PENDING',
                    timestamp: new Date(),
                    choice: chosenSide
                };
                await raffle.save();

                const betEmbed = new EmbedBuilder()
                    .setTitle('⚠️ High Stakes Challenge!')
                    .setColor('#FF0000')
                    .setDescription(`
${interaction.user} has challenged ${opponent} to a winner-takes-all coinflip!

⚠️ **WARNING:**
• ${interaction.user} has chosen ${chosenSide.toUpperCase()}
• ${opponent} will be ${chosenSide === 'heads' ? 'TAILS' : 'HEADS'}
• Winner will claim ALL raffle prizes
• Loser will lose their prize completely
• This action cannot be undone!

⏰ Expires: <t:${Math.floor(Date.now()/1000 + 300)}:R>

${opponent}, do you accept the challenge?
Use \`/raffle accept\` or \`/raffle decline\` to respond!`)
                    .setFooter({ text: 'Think carefully - Challenge expires in 5 minutes' })
                    .setTimestamp();

                await interaction.reply({ embeds: [betEmbed] });
                
                // Auto-expire bet after 5 minutes
                setTimeout(async () => {
                    const currentRaffle = await Raffle.findOne({
                        where: { id: raffle.id }
                    });
                    if (currentRaffle?.bettingRound?.status === 'PENDING') {
                        currentRaffle.bettingRound = null;
                        await currentRaffle.save();
                        
                        await interaction.channel.send({
                            content: `⏰ The bet between ${interaction.user} and ${opponent} has expired.`,
                            ephemeral: true
                        });
                    }
                }, 300000); // 5 minutes
                break;
            }

            case 'accept': {
                const raffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: ['BETTING', 'ENDED']
                    },
                    order: [['createdAt', 'DESC']]
                });

                if (!raffle || !raffle.bettingRound || raffle.bettingRound.status !== 'PENDING') {
                    return interaction.reply({
                        content: '❌ There is no pending bet to accept!',
                        ephemeral: true
                    });
                }

                if (raffle.bettingRound.opponent !== interaction.user.id) {
                    return interaction.reply({
                        content: '❌ This bet challenge was not sent to you!',
                        ephemeral: true
                    });
                }

                // Generate random number for each player
                const coinflip = Math.random() < 0.5 ? 'heads' : 'tails';
                const winner = coinflip === raffle.bettingRound.choice ? 
                    raffle.bettingRound.challenger : 
                    raffle.bettingRound.opponent;

                const resultEmbed = new EmbedBuilder()
                    .setTitle('🎲 Challenge Results')
                    .setColor('#FFD700')
                    .setDescription(`
🪙 The coin landed on: ${coinflip.toUpperCase()}!

${coinflip === raffle.bettingRound.choice ? '👑' : '💀'} <@${raffle.bettingRound.challenger}> (${raffle.bettingRound.choice.toUpperCase()})
${coinflip !== raffle.bettingRound.choice ? '👑' : '💀'} <@${raffle.bettingRound.opponent}> (${raffle.bettingRound.choice === 'heads' ? 'TAILS' : 'HEADS'})

🏆 <@${winner}> wins and claims all raffle prizes!

Better luck next time, <@${winner === raffle.bettingRound.challenger ? 
    raffle.bettingRound.opponent : 
    raffle.bettingRound.challenger}>!`)
                    .setTimestamp();

                // Clear betting round, update status, and save
                raffle.bettingRound = null;
                raffle.winners = [winner];
                raffle.status = 'COMPLETED';
                await raffle.save();

                await interaction.reply({ embeds: [resultEmbed] });
                break;
            }

            case 'decline': {
                const raffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: 'BETTING'
                    }
                });

                if (!raffle || !raffle.bettingRound || raffle.bettingRound.status !== 'PENDING') {
                    return interaction.reply({
                        content: '❌ There is no pending bet to decline!',
                        ephemeral: true
                    });
                }

                if (raffle.bettingRound.opponent !== interaction.user.id) {
                    return interaction.reply({
                        content: '❌ This bet challenge was not sent to you!',
                        ephemeral: true
                    });
                }

                // Clear betting round
                raffle.bettingRound = null;
                await raffle.save();

                const declineEmbed = new EmbedBuilder()
                    .setTitle('🚫 Challenge Declined')
                    .setColor('#FF0000')
                    .setDescription(`<@${interaction.user.id}> has declined the challenge.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [declineEmbed] });
                break;
            }

            case 'end': {
                if (!isAdmin(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Only administrators can end raffles.',
                        ephemeral: true
                    });
                }

                try {
                    const raffle = await Raffle.findOne({
                        where: {
                            guildId: interaction.guild.id,
                            status: 'ACTIVE'
                        }
                    });

                    if (!raffle) {
                        return interaction.reply({
                            content: '❌ No active raffle found.',
                            ephemeral: true
                        });
                    }

                    // End the raffle
                    await endRaffle(raffle, interaction.guild);
                    
                    await interaction.reply({
                        content: '✅ Raffle ended successfully!',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error ending raffle:', error);
                    await interaction.reply({
                        content: `❌ Failed to end raffle: ${error.message}`,
                        ephemeral: true
                    });
                }
                break;
            }

            case 'cancel': {
                if (!isAdmin(interaction.member) && interaction.guild.ownerId !== interaction.user.id) {
                    return interaction.reply({
                        content: '❌ Only administrators and the server owner can cancel raffles.',
                        ephemeral: true
                    });
                }

                if (!activeRaffle) {
                    return interaction.reply({
                        content: '❌ There is no active raffle to cancel.',
                        ephemeral: true
                    });
                }

                activeRaffle.status = 'CANCELLED';
                await activeRaffle.save();

                const cancelEmbed = new EmbedBuilder()
                    .setTitle('❌ Raffle Cancelled')
                    .setColor('#FF0000')
                    .setDescription(`
This raffle has been cancelled by an administrator.

**Prize was:** ${activeRaffle.prize}
**Total Entries:** ${activeRaffle.entries.length}
                    `)
                    .setFooter({ text: 'Better luck next time!' })
                    .setTimestamp();

                const channel = await interaction.client.channels.fetch(activeRaffle.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(activeRaffle.messageId);
                    if (message) {
                        await message.edit({ embeds: [cancelEmbed] });
                    }
                }

                await interaction.reply({
                    content: '✅ Raffle has been cancelled successfully.',
                    ephemeral: true
                });
                break;
            }

            case 'start': {
                // Only admins and server owner can start raffles
                if (!isAdmin(interaction.member) && interaction.guild.ownerId !== interaction.user.id) {
                    return interaction.reply({
                        content: '❌ Only administrators and the server owner can start raffles.',
                        ephemeral: true
                    });
                }

                // Check for existing active raffle
                const existingRaffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: 'ACTIVE'
                    }
                });

                if (existingRaffle) {
                    return interaction.reply({
                        content: '❌ There is already an active raffle! Wait for it to end before starting a new one.',
                        ephemeral: true
                    });
                }

                const prize = interaction.options.getString('prize');
                const winnerCount = interaction.options.getInteger('winners');
                const durationStr = interaction.options.getString('duration');

                let duration;
                try {
                    duration = parseDuration(durationStr);
                } catch (error) {
                    return interaction.reply({
                        content: `❌ ${error.message}`,
                        ephemeral: true
                    });
                }

                const endTime = new Date(Date.now() + duration);
                const formattedDuration = formatDuration(duration);

                const startEmbed = new EmbedBuilder()
                    .setTitle('🎰 New Raffle Started!')
                    .setColor('#FFD700')
                    .setDescription(`
**Prize:** ${prize}

**How to Enter:**
• Use \`/raffle join\` with your lucky number (1-100)
• A random winning number will be drawn
• The closest number(s) win!
• Winners can challenge each other using \`/raffle gamble\`

**Details:**
🏆 Winners: ${winnerCount}
⏰ Duration: ${formattedDuration}
⏰ Ends: <t:${Math.floor(endTime.getTime() / 1000)}:R>
👥 Current Entries: 0
                    `)
                    .setFooter({ text: 'May the odds be ever in your favor!' })
                    .setTimestamp();

                const message = await interaction.channel.send({ embeds: [startEmbed] });

                await Raffle.create({
                    guildId: interaction.guild.id,
                    channelId: interaction.channel.id,
                    messageId: message.id,
                    hostId: interaction.user.id,
                    prize,
                    winnerCount,
                    endTime,
                    entries: [],
                    status: 'ACTIVE'
                });

                await interaction.reply({
                    content: 'Raffle started successfully!',
                    ephemeral: true
                });

                // Schedule raffle end
                setTimeout(async () => {
                    try {
                        const raffleToEnd = await Raffle.findOne({
                            where: {
                                messageId: message.id,
                                status: 'ACTIVE'
                            }
                        });
                        
                        if (raffleToEnd) {
                            await endRaffle(raffleToEnd, interaction.guild);
                        }
                    } catch (error) {
                        console.error('Error ending raffle:', error);
                    }
                }, duration);
                break;
            }
        }
    }
}; 