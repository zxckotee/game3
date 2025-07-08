const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('effects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        field: 'user_id',
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sourceType: {
        type: Sequelize.ENUM('technique', 'sect', 'equipment', 'pet', 'status'),
        allowNull: false,
        field: 'source_type'
      },
      sourceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'source_id'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: -1 // -1 означает постоянный эффект
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'expires_at'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
        defaultValue: Sequelize.NOW
      }
    });
    
    // Создание индексов для оптимизации запросов
    await queryInterface.addIndex('effects', ['user_id']);
    await queryInterface.addIndex('effects', ['source_type', 'source_id']);
    await queryInterface.addIndex('effects', ['type']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('effects');
  }
};