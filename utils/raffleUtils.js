const { EmbedBuilder } = require('discord.js');
const Raffle = require('../models/Raffle');

async function endRaffle(messageId) {
    const raffle = await Raffle.findOne({
        where: {
            messageId: messageId,
            status: 'ACTIVE'
        }
    });

    if (!raffle) {
        throw new Error('Raffle not found or already ended');
    }

    // Generate winning number
    const winningNumber = Math.floor(Math.random() * 100) + 1;

    // Sort entries by closest number
    const sortedEntries = [...raffle.entries].sort((a, b) => {
        const aDiff = Math.abs(a.number - winningNumber);
        const bDiff = Math.abs(b.number - winningNumber);
        return aDiff - bDiff;
    });

    // Select winners
    const winners = sortedEntries.slice(0, raffle.winnerCount);

    // Update raffle status
    raffle.status = 'COMPLETED';
    raffle.winningNumber = winningNumber;
    raffle.winners = winners;
    await raffle.save();

    // Create results embed
    const resultsEmbed = new EmbedBuilder()
        .setTitle('🎉 Raffle Results!')
        .setColor('#00FF00')
        .setDescription(`
**Prize:** ${raffle.prize}
**Winning Number:** ${winningNumber}
**Total Entries:** ${raffle.entries.length}

${winners.map((w, i) => `**Winner ${i + 1}:** <@${w.userId}> (Number: ${w.number})`).join('\n')}
        `)
        .setFooter({ text: 'Congratulations to the winners!' })
        .setTimestamp();

    // Update original message
    const channel = await raffle.client.channels.fetch(raffle.channelId);
    if (channel) {
        const message = await channel.messages.fetch(raffle.messageId);
        if (message) {
            await message.edit({ embeds: [resultsEmbed] });
        }
    }

    return winners;
}

module.exports = {
    endRaffle
}; 