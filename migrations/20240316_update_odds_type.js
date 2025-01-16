const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('BetStats', 'odds', {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('BetStats', 'odds', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
  }
}; 