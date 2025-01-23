'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Raffles', 'numbers', {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            defaultValue: []
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Raffles', 'numbers');
    }
}; 