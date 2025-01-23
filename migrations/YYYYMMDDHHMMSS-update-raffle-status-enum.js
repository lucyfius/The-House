'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_Raffles_status" ADD VALUE IF NOT EXISTS 'ENDED';
        `);
    },

    down: async (queryInterface, Sequelize) => {
        // Cannot remove enum values in PostgreSQL
        console.log('Skipping enum value removal in down migration');
    }
}; 