const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SectMemberships', {
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
      sectId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Sects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rank: {
        type: Sequelize.ENUM('ученик', 'внутренний ученик', 'старший ученик', 'старейшина', 'глава'),
        defaultValue: 'ученик'
      },
      contribution: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      joinedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      lastContribution: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('SectMemberships');
  }
};
