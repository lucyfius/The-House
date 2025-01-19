const { Events } = require('discord.js');
const { ReactionRole } = require('../models/ReactionRole');

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
            const reactionRole = await ReactionRole.findOne({
                where: {
                    messageId: reaction.message.id,
                    guildId: reaction.message.guild.id
                }
            });

            if (!reactionRole) return;

            const pair = reactionRole.emojiRolePairs.find(p => p.emoji === reaction.emoji.name);
            if (!pair) return;

            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(pair.roleId);

            if (!role) {
                console.error(`Role ${pair.roleId} not found`);
                return;
            }

            // Remove role
            await member.roles.remove(role);
        } catch (error) {
            console.error('Error in reaction role removal:', error);
        }
    },
}; 