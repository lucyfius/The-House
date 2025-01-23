const { EmbedBuilder } = require('discord.js');
const Raffle = require('../models/Raffle');

async function endRaffle(raffle, guild) {
    try {
        // First check if raffle exists and is active
        if (!raffle || raffle.status !== 'ACTIVE') {
            console.log('Raffle not found or not active');
            return;
        }

        const channel = await guild.channels.fetch(raffle.channelId);
        if (!channel) {
            throw new Error('Raffle channel not found');
        }

        // Generate winning number between 1-100
        const winningNumber = Math.floor(Math.random() * 100) + 1;
        raffle.winningNumber = winningNumber;

        // Find closest numbers
        const entries = raffle.entries || [];
        const numbers = raffle.numbers || [];
        const participants = entries.map((userId, index) => ({
            userId,
            number: numbers[index],
            difference: Math.abs(numbers[index] - winningNumber)
        }));

        // Sort by closest to winning number
        participants.sort((a, b) => a.difference - b.difference);

        // Select winners (closest numbers)
        const winners = participants
            .slice(0, raffle.winnerCount)
            .map(p => p.userId);

        console.log('Debug - Winners array:', {
            winners,
            type: typeof winners,
            isArray: Array.isArray(winners),
            stringified: JSON.stringify(winners)
        });

        // Store winners directly as an array
        raffle.winners = winners;
        raffle.status = 'BETTING';
        await raffle.save();

        // Verify storage immediately after save
        const freshRaffle = await Raffle.findByPk(raffle.id);
        console.log('Debug - Stored winners:', {
            winners: freshRaffle.winners,
            type: typeof freshRaffle.winners,
            isArray: Array.isArray(freshRaffle.winners),
            parsed: JSON.parse(JSON.stringify(freshRaffle.winners))
        });

        // Create winners announcement with number details
        const embed = new EmbedBuilder()
            .setTitle('🎉 Raffle Ended!')
            .setColor('#00FF00')
            .setDescription(`
Prize: ${raffle.prize}
🎯 Winning Number: ${winningNumber}

Winners:
${participants
    .slice(0, raffle.winnerCount)
    .map(p => `<@${p.userId}> (picked ${p.number}, off by ${p.difference})`)
    .join('\n')}

🎲 **High Stakes Challenge System:**
• Winners can challenge each other using \`/raffle bet\`
• Winner of the challenge claims ALL prizes
• Losers will forfeit their prize
• Choose wisely!`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        console.log(`Raffle ${raffle.id} ended successfully with ${winners.length} winners. Winning number: ${winningNumber}`);

    } catch (error) {
        console.error('Error in endRaffle:', error);
        throw error;
    }
}

module.exports = { endRaffle }; 