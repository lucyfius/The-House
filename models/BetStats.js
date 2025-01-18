const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BetStats = sequelize.define('BetStats', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    betType: {
        type: DataTypes.ENUM(
            'FIRST_TO_5',
            'GAME_WIN',
            'KILL_UNDER',
            'TIME_OVER',
            'ROUND_WINNER',
            'PLAYER_PERFORMANCE',
            'MAP_WINNER',
            'OTHER'
        ),
        allowNull: false
    },
    result: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    odds: {
        type: DataTypes.STRING,
        allowNull: true
    },
    details: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

const BetStatsView = sequelize.define('BetStatsView', {
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
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timeframe: {
        type: DataTypes.STRING,
        defaultValue: 'all'
    }
});

module.exports = { BetStats, BetStatsView }; 