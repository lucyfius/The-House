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
        defaultValue: 1
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'ENDED', 'BETTING'),
        defaultValue: 'ACTIVE'
    },
    winners: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    entries: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    bettingRound: {
        type: DataTypes.JSONB,
        defaultValue: null
    }
});

module.exports = Raffle; 