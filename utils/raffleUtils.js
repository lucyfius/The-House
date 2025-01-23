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

        console.log('Debug - Winners before storage:', winners);

        // Store winners as a stringified array
        raffle.winners = winners;  // Remove the JSON.parse(JSON.stringify()) conversion
        raffle.status = 'BETTING';
        await raffle.save();

        // Double check storage
        const savedRaffle = await Raffle.findByPk(raffle.id);
        console.log('Debug - Saved winners:', {
            rawWinners: savedRaffle.winners,
            parsedWinners: Array.isArray(savedRaffle.winners) ? savedRaffle.winners : JSON.parse(savedRaffle.winners)
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