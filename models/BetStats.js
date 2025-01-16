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
        type: DataTypes.FLOAT,
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

module.exports = BetStats; 