const { Events } = require('discord.js');
const { ReactionRole } = require('../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Don't respond to bot reactions
        if (user.bot) return;

        // Partial reaction handling
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        try {
            // Find reaction role setup for this message
            const reactionRole = await ReactionRole.findOne({
                where: {
                    messageId: reaction.message.id,
                    guildId: reaction.message.guild.id
                }
            });

            if (!reactionRole) return;

            // Find matching emoji-role pair
            const emojiIdentifier = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.toString();
            const pair = reactionRole.emojiRolePairs.find(p => 
                p.emoji === emojiIdentifier || 
                p.emoji === reaction.emoji.name || 
                p.emoji === reaction.emoji.toString()
            );
            if (!pair) return;

            // Get member and role
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(pair.roleId);

            if (!role) {
                console.error(`Role ${pair.roleId} not found`);
                return;
            }

            // Add role
            await member.roles.add(role);
        } catch (error) {
            console.error('Error in reaction role assignment:', error);
        }
    },
}; 