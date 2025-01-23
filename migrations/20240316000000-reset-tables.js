'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop all tables and types
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "ReactionRoles" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Raffles" CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status" CASCADE;');

    // Create ReactionRoles table
    await queryInterface.createTable('ReactionRoles', {
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
      messageId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      emoji: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      roleId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      emojiRolePairs: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
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

    // Create enum type for Raffles status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Raffles_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING');
    `);

    // Create Raffles table
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
        type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING'),
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
    await queryInterface.dropTable('ReactionRoles');
    await queryInterface.dropTable('Raffles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status" CASCADE;');
  }
}; 