'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, ensure the column exists with correct type
    await queryInterface.changeColumn('ReactionRoles', 'emojiRolePairs', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ReactionRoles', 'emojiRolePairs', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  }
}; 