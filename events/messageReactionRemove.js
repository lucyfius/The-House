const { Events } = require('discord.js');
const ReactionRole = require('../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        try {
            console.log('Debug - Processing reaction remove:', {
                emoji: reaction.emoji.name,
                messageId: reaction.message.id,
                userId: user.id
            });

            const reactionRole = await ReactionRole.findOne({
                where: {
                    messageId: reaction.message.id,
                    guildId: reaction.message.guild.id
                }
            });

            if (!reactionRole) {
                console.log('Debug - No reaction role setup found for this message');
                return;
            }

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

            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(pair.roleId);

            if (!role) {
                console.error(`Role ${pair.roleId} not found`);
                return;
            }

            // Remove role
            await member.roles.remove(role);
            console.log(`Debug - Removed role ${role.name} from user ${user.tag}`);
        } catch (error) {
            console.error('Error in reaction role removal:', error);
        }
    },
}; 