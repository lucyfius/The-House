const { PermissionFlagsBits } = require('discord.js');

function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator) || 
           member.roles.cache.some(role => role.name.toLowerCase() === 'moderator');
}

module.exports = { isAdmin }; 