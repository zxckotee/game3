const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Techniques', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      type: {
        type: Sequelize.ENUM('боевая', 'защитная', 'вспомогательная'),
        allowNull: false
      },
      element: {
        type: Sequelize.ENUM('огонь', 'вода', 'дерево', 'металл', 'земля', 'молния', 'ветер', 'тьма', 'свет'),
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      energyCost: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      damage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      cooldown: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      requiredCultivationLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 1
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
    await queryInterface.dropTable('Techniques');
  }
};
