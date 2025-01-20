'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ReactionRoles', 'roleId', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''  // Temporary default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ReactionRoles', 'roleId');
  }
};
