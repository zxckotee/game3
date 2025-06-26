const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CultivationProgress', {
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
      stage: {
        type: Sequelize.ENUM('закалка тела', 'очищение ци', 'золотое ядро', 'формирование души'),
        defaultValue: 'закалка тела'
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      currentExperience: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      requiredExperience: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      breakthroughProgress: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      dailyCultivationLimit: {
        type: Sequelize.INTEGER,
        defaultValue: 1000
      },
      dailyCultivationUsed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastCultivationReset: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
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
    await queryInterface.dropTable('CultivationProgress');
  }
};
