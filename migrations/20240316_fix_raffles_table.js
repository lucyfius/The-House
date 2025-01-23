'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing enum if it exists
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status" CASCADE;');

    // Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Raffles_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING');
    `);

    // First, drop the status column if it exists
    try {
      await queryInterface.removeColumn('Raffles', 'status');
    } catch (error) {
      console.log('Error removing status column:', error.message);
    }

    // Then add it back as an ENUM
    try {
      await queryInterface.addColumn('Raffles', 'status', {
        type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'BETTING'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      });
    } catch (error) {
      console.log('Error adding status column:', error.message);
      throw error;
    }

    // Add winningNumber column if it doesn't exist
    try {
      await queryInterface.addColumn('Raffles', 'winningNumber', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.log('winningNumber column might already exist:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // First, drop the ENUM status column
    try {
      await queryInterface.removeColumn('Raffles', 'status');
    } catch (error) {
      console.log('Error removing ENUM status column:', error.message);
    }

    // Then add back the STRING status column
    await queryInterface.addColumn('Raffles', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ACTIVE'
    });

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Raffles_status";');

    // Remove winningNumber column
    await queryInterface.removeColumn('Raffles', 'winningNumber');
  }
}; 