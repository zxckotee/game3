const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаем таблицу achievement_types
    await queryInterface.createTable('achievement_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    // Добавляем индекс для оптимизации запросов
    await queryInterface.addIndex('achievement_types', ['category'], {
      name: 'idx_achievement_types_category'
    });

    // Заполняем таблицу типов достижений
    return queryInterface.bulkInsert('achievement_types', [
      {
        name: 'cultivation_level',
        description: 'Достижения за достижение определенного уровня культивации',
        category: 'cultivation',
        icon: 'cultivation-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'quest_complete',
        description: 'Достижения за выполнение определенного количества квестов',
        category: 'quests',
        icon: 'quest-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'technique_master',
        description: 'Достижения за освоение техник',
        category: 'combat',
        icon: 'technique-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'alchemy_create',
        description: 'Достижения за создание алхимических предметов',
        category: 'crafting',
        icon: 'alchemy-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'sect_contribution',
        description: 'Достижения за вклад в секту',
        category: 'social',
        icon: 'sect-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'merchant_trades',
        description: 'Достижения за торговлю с торговцами',
        category: 'economy',
        icon: 'merchant-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'enemy_defeat',
        description: 'Достижения за победу над врагами',
        category: 'combat',
        icon: 'battle-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'resource_collect',
        description: 'Достижения за сбор ресурсов',
        category: 'exploration',
        icon: 'resource-icon',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'group_activity',
        description: 'Достижения за участие в групповых активностях',
        category: 'social',
        icon: 'group-icon',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('achievement_types');
  }
};