const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServerLog = sequelize.define('ServerLog', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    actionType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    executorId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    targetId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = ServerLog; 