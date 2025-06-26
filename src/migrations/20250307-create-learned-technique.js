const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LearnedTechniques', {
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
      techniqueId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Techniques',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      masteryLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      experience: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isEquipped: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      learnedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      lastUsed: {
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
    await queryInterface.dropTable('LearnedTechniques');
  }
};
