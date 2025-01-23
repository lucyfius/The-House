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

        // Pick winners
        const entries = raffle.entries || [];
        const winners = [];
        const numWinners = Math.min(raffle.winnerCount, entries.length);

        for (let i = 0; i < numWinners; i++) {
            const winnerIndex = Math.floor(Math.random() * entries.length);
            winners.push(entries.splice(winnerIndex, 1)[0]);
        }

        // Create winners announcement
        const embed = new EmbedBuilder()
            .setTitle('🎉 Raffle Ended!')
            .setColor('#00FF00')
            .setDescription(`
Prize: ${raffle.prize}
Winners: ${winners.map(w => `<@${w}>`).join(', ') || 'No winners'}

🎲 Winners can use \`/raffle bet\` to gamble their winnings against each other!`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        // Update raffle status
        raffle.status = 'BETTING';
        raffle.winners = winners;
        await raffle.save();

        console.log(`Raffle ${raffle.id} ended successfully with ${winners.length} winners`);

    } catch (error) {
        console.error('Error in endRaffle:', error);
        throw error;
    }
}

module.exports = { endRaffle }; 