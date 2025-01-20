const { Events } = require('discord.js');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        console.log('Debug - Reaction Add Event Triggered');
        
        if (user.bot) {
            console.log('Debug - Ignoring bot reaction');
            return;
        }

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
            console.log('Debug - Processing reaction add:', {
                emoji: reaction.emoji.name,
                messageId: reaction.message.id,
                userId: user.id,
                guildId: reaction.message.guild.id
            });

            // Find reaction role setup for this message
            const reactionRole = await ReactionRole.findOne({
                where: {
                    messageId: reaction.message.id,
                    guildId: reaction.message.guild.id
                }
            });

            console.log('Debug - Database query result:', reactionRole);

            if (!reactionRole) {
                console.log('Debug - No reaction role setup found for this message');
                return;
            }

            console.log('Debug - Found reaction role setup:', {
                storedPairs: reactionRole.emojiRolePairs,
                reactionEmoji: reaction.emoji.name
            });

            // Find matching emoji-role pair
            const pair = reactionRole.emojiRolePairs.find(p => 
                p.emoji === `:${reaction.emoji.name}:` || 
                p.emoji === reaction.emoji.name ||
                p.emoji.replace(/:/g, '') === reaction.emoji.name ||
                p.emoji === 'white_check_mark' && reaction.emoji.name === '✅'
            );

            if (!pair) {
                console.log('Debug - No matching emoji-role pair found');
                return;
            }

            console.log('Debug - Found matching pair:', pair);

            // Get member and role
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(pair.roleId);

            if (!role) {
                console.error(`Role ${pair.roleId} not found`);
                return;
            }

            // Add role
            await member.roles.add(role);
            console.log(`Debug - Added role ${role.name} to user ${user.tag}`);
        } catch (error) {
            console.error('Error in reaction role assignment:', error);
        }
    },
}; 