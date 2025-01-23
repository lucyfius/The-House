const { EmbedBuilder } = require('discord.js');
const Raffle = require('../models/Raffle');

async function endRaffle(raffle, guild) {
    try {
        const channel = await guild.channels.fetch(raffle.channelId);
        if (!channel) {
            throw new Error('Raffle channel not found');
        }

        // Pick winners
        const entries = raffle.entries || [];
        const winners = [];
        const numWinners = Math.min(raffle.winners, entries.length);

        for (let i = 0; i < numWinners; i++) {
            const winnerIndex = Math.floor(Math.random() * entries.length);
            winners.push(entries.splice(winnerIndex, 1)[0]);
        }

        // Create winners announcement
        const embed = new EmbedBuilder()
            .setTitle('🎉 Raffle Ended!')
            .setColor('#00FF00')
            .setDescription(`Prize: ${raffle.prize}\nWinners: ${winners.map(w => `<@${w}>`).join(', ') || 'No winners'}`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        // Update raffle status
        raffle.status = 'ENDED';
        raffle.winners = winners;
        await raffle.save();

    } catch (error) {
        console.error('Error in endRaffle:', error);
        throw error;
    }
}

module.exports = { endRaffle }; 