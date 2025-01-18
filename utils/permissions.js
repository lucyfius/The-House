const { PermissionFlagsBits } = require('discord.js');

function isAdmin(member) {
    return member.guild.ownerId === member.id || // Check if user is server owner
           member.permissions.has(PermissionFlagsBits.Administrator) || 
           member.roles.cache.some(role => role.name.toLowerCase() === 'moderator');
}

function canModerate(moderator, target) {
    if (!moderator.roles || !target.roles) return false;
    if (moderator.guild.ownerId === moderator.id) return true; // Owner can moderate anyone
    return moderator.roles.highest.position > target.roles.highest.position;
}

module.exports = { isAdmin, canModerate }; 