const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        await sequelize.sync();
        console.log('Database models synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { sequelize, initDatabase }; 