const { PermissionFlagsBits } = require('discord.js');

function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator) || 
           member.roles.cache.some(role => role.name.toLowerCase() === 'moderator');
}

function canModerate(moderator, target) {
    if (!moderator.roles || !target.roles) return false;
    return moderator.roles.highest.position > target.roles.highest.position;
}

module.exports = { isAdmin, canModerate }; 