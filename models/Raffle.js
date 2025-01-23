const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Raffle = sequelize.define('Raffle', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hostId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prize: {
        type: DataTypes.STRING,
        allowNull: false
    },
    winnerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING'),
        defaultValue: 'ACTIVE',
        allowNull: false
    },
    winners: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
    },
    entries: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
    },
    winningNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bettingRound: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    numbers: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: []
    }
});

module.exports = Raffle; 