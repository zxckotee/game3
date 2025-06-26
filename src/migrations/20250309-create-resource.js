const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Resources', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rarity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      effects: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      value: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      stackable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      maxStack: {
        type: Sequelize.INTEGER,
        defaultValue: 99
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
    await queryInterface.dropTable('Resources');
  }
};
