const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('achievement_progress', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      achievement_id: {
        type: Sequelize.STRING(30),
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      current_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_rewarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем уникальный индекс для пары (user_id, achievement_id)
    await queryInterface.addIndex('achievement_progress', ['user_id', 'achievement_id'], {
      unique: true,
      name: 'achievement_progress_user_achievement_unique'
    });

    // Добавляем индексы для оптимизации запросов
    await queryInterface.addIndex('achievement_progress', ['user_id'], {
      name: 'idx_achievement_progress_user_id'
    });
    
    await queryInterface.addIndex('achievement_progress', ['achievement_id'], {
      name: 'idx_achievement_progress_achievement_id'
    });
    
    await queryInterface.addIndex('achievement_progress', ['is_completed'], {
      name: 'idx_achievement_progress_completed'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('achievement_progress');
  }
};