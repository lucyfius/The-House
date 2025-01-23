'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReactionRoles');
  }
}; 