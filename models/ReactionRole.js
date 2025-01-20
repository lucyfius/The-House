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
    emojiRolePairs: {
        type: DataTypes.JSONB,  // or DataTypes.JSON if not using PostgreSQL
        allowNull: false,
        defaultValue: []
    }
});

module.exports = ReactionRole; 