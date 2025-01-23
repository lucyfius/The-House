'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Raffles', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Raffles', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ACTIVE'
    });
  }
}; 