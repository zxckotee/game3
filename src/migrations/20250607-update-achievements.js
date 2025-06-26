const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Сначала создаем новую таблицу achievements с правильной структурой
    await queryInterface.createTable('achievements_new', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      rewards: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      required_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      is_hidden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('achievements_new', ['category'], {
      name: 'idx_achievements_category'
    });
    
    await queryInterface.addIndex('achievements_new', ['is_hidden'], {
      name: 'idx_achievements_hidden'
    });

    // Удаляем старую таблицу Achievements
    await queryInterface.dropTable('Achievements');

    // Переименовываем новую таблицу в achievements
    await queryInterface.renameTable('achievements_new', 'achievements');
  },

  down: async (queryInterface, Sequelize) => {
    // Для отката мы восстанавливаем оригинальную структуру
    await queryInterface.createTable('Achievements_old', {
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
      category: {
        type: Sequelize.ENUM('боевые', 'исследовательские', 'профессиональные', 'культивационные', 'социальные'),
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING
      },
      reward: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    // Удаляем новую таблицу
    await queryInterface.dropTable('achievements');

    // Переименовываем старую таблицу обратно
    await queryInterface.renameTable('Achievements_old', 'Achievements');
  }
};