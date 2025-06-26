const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InventoryItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      type: {
        type: Sequelize.ENUM('оружие', 'броня', 'артефакт', 'расходник', 'ресурс'),
        allowNull: false
      },
      rarity: {
        type: Sequelize.ENUM('обычный', 'необычный', 'редкий', 'эпический', 'легендарный'),
        defaultValue: 'обычный'
      },
      stats: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      equipped: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('InventoryItems');
  }
};
