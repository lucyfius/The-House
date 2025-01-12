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
            await logChannel.send({ embeds: [embed] });
        }
    }

    // Moderation Actions
    async logModAction(interaction, action, target, reason, details = {}) {
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ ${action}`)
            .setColor('#FF0000')
            .setTimestamp();

        if (action === 'Channel Purged') {
            embed.addFields(
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Channel', value: `<#${details.channelId}>`, inline: true },
                { name: 'Messages Purged', value: `${details.messageCount}`, inline: true }
            );
        } else {
            embed.addFields(
                { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided' }
            );

            if (details.deleteDays) embed.addFields({ name: 'Messages Deleted', value: `${details.deleteDays} days` });
            if (details.duration) embed.addFields({ name: 'Duration', value: details.duration });
        }

        await this.logToChannel(interaction.guild, embed);
    }

    // Message Events
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

    // Member Events
    async logMemberUpdate(oldMember, newMember) {
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setTitle('📝 Nickname Changed')
                .setColor('#00FF00')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})` },
                    { name: 'Old Nickname', value: oldMember.nickname || 'None' },
                    { name: 'New Nickname', value: newMember.nickname || 'None' }
                )
                .setTimestamp();

            await this.logToChannel(newMember.guild, embed);
        }
    }

    // User Events
    async logUserUpdate(oldUser, newUser) {
        const changes = [];
        
        if (oldUser.username !== newUser.username) {
            changes.push(`Username: ${oldUser.username} → ${newUser.username}`);
        }
        
        if (oldUser.avatarURL() !== newUser.avatarURL()) {
            changes.push(`Avatar: Changed`);
        }

        if (changes.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle('👤 User Updated')
                .setColor('#0099FF')
                .addFields(
                    { name: 'User', value: `${newUser.tag} (${newUser.id})` },
                    { name: 'Changes', value: changes.join('\n') }
                )
                .setTimestamp();

            if (oldUser.avatarURL() !== newUser.avatarURL()) {
                embed.setThumbnail(newUser.avatarURL());
            }

            await this.logToChannel(newUser.guild, embed);
        }
    }
}

module.exports = Logger; 