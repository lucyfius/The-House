const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Warning = sequelize.define('Warning', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

module.exports = Warning; 