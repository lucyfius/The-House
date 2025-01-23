const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const { checkRateLimit, checkRaidPrevention } = require('../utils/rateLimiter');
const Raffle = require('../models/Raffle');
const { client } = require('../index.js');
const { endRaffle } = require('../utils/raffleUtils');

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
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('⏰ How long should the raffle last?')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10080)))
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
                .setName('end')
                .setDescription('🏁 End the current raffle (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('❌ Cancel the current raffle (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bet')
                .setDescription('🎲 Challenge another winner - Winner takes all prizes, loser gets nothing!')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('🤝 Which winner do you want to challenge?')
                        .setRequired(true)))
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

            case 'bet': {
                const raffle = await Raffle.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        status: 'BETTING'
                    }
                });

                if (!raffle) {
                    return interaction.reply({
                        content: '❌ There is no raffle in the challenge phase!',
                        ephemeral: true
                    });
                }

                // Ensure winners is properly parsed
                const winners = Array.isArray(raffle.winners) ? raffle.winners : JSON.parse(raffle.winners);
                
                console.log('Debug - Challenge check:', {
                    userId: interaction.user.id,
                    rawWinners: raffle.winners,
                    parsedWinners: winners,
                    isUserWinner: winners.includes(interaction.user.id)
                });

                // Check if user is a winner
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
                        content: '❌ One of the users is already in an active bet!',
                        ephemeral: true
                    });
                }

                // Create betting round
                raffle.bettingRound = {
                    challenger: interaction.user.id,
                    opponent: opponent.id,
                    status: 'PENDING',
                    timestamp: new Date()
                };
                await raffle.save();

                const betEmbed = new EmbedBuilder()
                    .setTitle('⚠️ High Stakes Challenge!')
                    .setColor('#FF0000')
                    .setDescription(`
${interaction.user} has challenged ${opponent} to a winner-takes-all duel!

⚠️ **WARNING:**
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
                        status: 'BETTING'
                    }
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
                const challengerNumber = Math.floor(Math.random() * 100) + 1;
                const opponentNumber = Math.floor(Math.random() * 100) + 1;

                const winner = challengerNumber > opponentNumber ? 
                    raffle.bettingRound.challenger : 
                    raffle.bettingRound.opponent;
                const loser = winner === raffle.bettingRound.challenger ? 
                    raffle.bettingRound.opponent : 
                    raffle.bettingRound.challenger;

                // Update winners array to remove loser and keep only winner
                raffle.winners = raffle.winners.filter(w => w !== loser);
                
                const resultEmbed = new EmbedBuilder()
                    .setTitle('🎲 Challenge Results')
                    .setColor('#FFD700')
                    .setDescription(`
🎯 ${interaction.user}: ${opponentNumber}
🎯 <@${raffle.bettingRound.challenger}>: ${challengerNumber}

🏆 <@${winner}> wins and claims both raffle prizes!

Better luck next time, <@${loser}>!`)
                    .setTimestamp();

                // Clear betting round and save updated winners
                raffle.bettingRound = null;
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
                    .setTitle('🚫 Bet Declined')
                    .setColor('#FF0000')
                    .setDescription(`<@${interaction.user.id}> has declined the betting challenge.`)
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
                const duration = interaction.options.getInteger('minutes');
                const endTime = new Date(Date.now() + duration * 60000);

                const startEmbed = new EmbedBuilder()
                    .setTitle('🎰 New Raffle Started!')
                    .setColor('#FFD700')
                    .setDescription(`
**Prize:** ${prize}

**How to Enter:**
• Use \`/raffle join\` with your lucky number (1-100)
• A random winning number will be drawn
• The closest number(s) win!
• Winners can challenge each other to combine prizes

**Details:**
🏆 Winners: ${winnerCount}
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
                }, duration * 60000);
                break;
            }
        }
    }
}; 