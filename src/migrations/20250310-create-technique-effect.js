const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TechniqueEffects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      damage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      damageType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      healing: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      stats: {
        type: Sequelize.JSON,
        allowNull: true
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
    await queryInterface.dropTable('TechniqueEffects');
  }
};
