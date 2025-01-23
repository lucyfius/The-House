'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing enum if it exists
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status" CASCADE;');

    // Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Raffles_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING');
    `);

    // Add winningNumber column if it doesn't exist
    try {
      await queryInterface.addColumn('Raffles', 'winningNumber', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.log('winningNumber column might already exist:', error.message);
    }

    // Update status column
    await queryInterface.changeColumn('Raffles', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert status column
    await queryInterface.changeColumn('Raffles', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ACTIVE'
    });

    // Remove winningNumber column
    await queryInterface.removeColumn('Raffles', 'winningNumber');

    // Drop enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status";');
  }
}; 