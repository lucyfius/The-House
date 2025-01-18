const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const Raffle = require('../models/Raffle');

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
                .setDescription('🏁 End the current raffle early (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('❌ Cancel the current raffle (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bet')
                .setDescription('💰 Challenge another winner')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('🤝 Who do you want to challenge?')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('💵 How much do you want to bet?')
                        .setRequired(true))),
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

        // Check for active raffle
        const activeRaffle = await Raffle.findOne({
            where: {
                guildId: interaction.guild.id,
                status: 'ACTIVE'
            }
        });

        switch (subcommand) {
            case 'end': {
                if (!isAdmin(interaction.member) && interaction.guild.ownerId !== interaction.user.id) {
                    return interaction.reply({
                        content: '❌ Only administrators and the server owner can end raffles early.',
                        ephemeral: true
                    });
                }

                if (!activeRaffle) {
                    return interaction.reply({
                        content: '❌ There is no active raffle to end.',
                        ephemeral: true
                    });
                }

                await interaction.deferReply();
                await endRaffle(activeRaffle.messageId);
                await interaction.editReply('🏁 Raffle ended early by admin!');
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

                if (activeRaffle) {
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
• The closest number wins!
• Multiple winners can challenge each other to double their prizes

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
                    endTime
                });

                await interaction.reply({
                    content: 'Raffle started successfully!',
                    ephemeral: true
                });

                // Schedule raffle end
                setTimeout(() => endRaffle(message.id), duration * 60000);
                break;
            }

            case 'join': {
                if (!activeRaffle) {
                    return interaction.reply({
                        content: '❌ There is no active raffle to join! Wait for one to start.',
                        ephemeral: true
                    });
                }

                const number = interaction.options.getInteger('number');
                
                // Check if user already joined
                if (activeRaffle.entries.some(entry => entry.userId === interaction.user.id)) {
                    return interaction.reply({
                        content: '❌ You have already joined this raffle!',
                        ephemeral: true
                    });
                }

                // Add entry
                activeRaffle.entries.push({
                    userId: interaction.user.id,
                    number: number
                });
                await activeRaffle.save();

                await interaction.reply({
                    content: `🎫 You joined the raffle with number ${number}! Good luck!`,
                    ephemeral: true
                });
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
                        content: '❌ There is no raffle in the betting phase!',
                        ephemeral: true
                    });
                }

                // Check if user is a winner
                if (!raffle.winners.some(w => w.userId === interaction.user.id)) {
                    return interaction.reply({
                        content: '❌ Only raffle winners can place bets!',
                        ephemeral: true
                    });
                }

                const opponent = interaction.options.getUser('opponent');
                const amount = interaction.options.getInteger('amount');

                // Validate opponent is also a winner
                if (!raffle.winners.some(w => w.userId === opponent.id)) {
                    return interaction.reply({
                        content: '❌ You can only challenge other raffle winners!',
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
                    amount: amount,
                    status: 'PENDING',
                    timestamp: new Date()
                };
                await raffle.save();

                const betEmbed = new EmbedBuilder()
                    .setTitle('🎲 Betting Challenge')
                    .setColor('#FFD700')
                    .setDescription(`
${interaction.user} has challenged ${opponent} to a bet!

💰 Amount: ${amount} units
⏰ Expires: <t:${Math.floor(Date.now()/1000 + 300)}:R>

${opponent}, use \`/raffle accept\` or \`/raffle decline\` to respond!`)
                    .setFooter({ text: 'Bet expires in 5 minutes' })
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

                // Update betting round status
                raffle.bettingRound.status = 'ACTIVE';
                await raffle.save();

                const acceptEmbed = new EmbedBuilder()
                    .setTitle('🎲 Bet Accepted!')
                    .setColor('#00FF00')
                    .setDescription(`
💫 The bet is on! 

🤝 Players: <@${raffle.bettingRound.challenger}> vs <@${raffle.bettingRound.opponent}>
💰 Amount: ${raffle.bettingRound.amount} units

Use \`/betstats add\` to record the result when done!`)
                    .setTimestamp();

                await interaction.reply({ embeds: [acceptEmbed] });
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
        }
    }
};

async function endRaffle(messageId) {
    const raffle = await Raffle.findOne({
        where: { messageId, status: 'ACTIVE' }
    });

    if (!raffle) return;

    // Select winners based on lucky numbers
    const winners = [];
    const winningNumber = Math.floor(Math.random() * 100) + 1;
    
    // Sort entries by how close they are to the winning number
    const sortedEntries = raffle.entries.sort((a, b) => {
        const aDiff = Math.abs(a.number - winningNumber);
        const bDiff = Math.abs(b.number - winningNumber);
        return aDiff - bDiff;
    });

    winners.push(...sortedEntries.slice(0, raffle.winnerCount));

    // Update raffle status
    raffle.status = 'BETTING';
    raffle.winners = winners;
    await raffle.save();

    // Send winner announcement
    const channel = await client.channels.fetch(raffle.channelId);
    const winnerEmbed = new EmbedBuilder()
        .setTitle('🎉 Raffle Winners!')
        .setColor('#FFD700')
        .setDescription(`
**Winning Number:** ${winningNumber}

${winners.map((w, i) => `${i + 1}. ${w.user.tag} (picked ${w.number})`).join('\n')}

**Prize:** ${raffle.prize}
**Total Entries:** ${raffle.entries.length}

🎲 Winners can now use \`/raffle bet\` to challenge each other!
        `)
        .setFooter({ text: 'Congratulations to all winners!' })
        .setTimestamp();

    await channel.send({ embeds: [winnerEmbed] });
} 