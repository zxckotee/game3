const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CharacterStats', {
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
        onDelete: 'CASCADE',
        unique: true
      },
      strength: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      intelligence: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      spirit: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      agility: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      health: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      currentHealth: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      maxHealth: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      currentEnergy: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      maxEnergy: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      physicalDefense: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      spiritualDefense: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      attackSpeed: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
      },
      criticalChance: {
        type: Sequelize.FLOAT,
        defaultValue: 0.05
      },
      movementSpeed: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
      },
      luck: {
        type: Sequelize.INTEGER,
        defaultValue: 5
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
    await queryInterface.dropTable('CharacterStats');
  }
};
