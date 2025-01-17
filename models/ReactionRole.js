const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReactionRole = sequelize.define('ReactionRole', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emoji: {
        type: DataTypes.STRING,
        allowNull: false
    },
    roleId: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = ReactionRole; 