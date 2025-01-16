const { EmbedBuilder } = require('discord.js');

class Logger {
    constructor(client) {
        this.client = client;
    }

    async logToChannel(guild, embed) {
        const logChannel = guild.channels.cache.find(
            channel => channel.name === 'server-logs'
        );
        
        if (logChannel) {
            try {
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to log to server-logs:', error);
            }
        } else {
            console.warn(`Log channel server-logs not found in guild ${guild.name}`);
        }
    }

    async logMessageDelete(message) {
        if (message.author?.bot) return;

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Message Deleted')
            .setColor('#FFA500')
            .addFields(
                { name: 'Author', value: `${message.author?.tag} (${message.author?.id})`, inline: true },
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Content', value: message.content || 'No content (possibly embed/attachment)' }
            )
            .setTimestamp();

        await this.logToChannel(message.guild, embed);
    }
}

module.exports = Logger; 