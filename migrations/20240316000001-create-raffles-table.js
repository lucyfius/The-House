'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Raffles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      guildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      messageId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hostId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      prize: {
        type: Sequelize.STRING,
        allowNull: false
      },
      winnerCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING, // We'll convert this to ENUM in the next migration
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      winners: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      entries: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      winningNumber: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bettingRound: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Raffles');
  }
}; 