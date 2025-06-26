/**
 * Миграция для создания таблиц системы репутации
 */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создание таблицы reputations
    await queryInterface.createTable('reputations', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      entityType: {
        type: Sequelize.ENUM('city', 'faction', 'global'),
        allowNull: false,
        primaryKey: true
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        primaryKey: true
      },
      sphere: {
        type: Sequelize.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
        allowNull: false,
        primaryKey: true
      },
      value: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      level: {
        type: Sequelize.ENUM(
          'враждебный', 'неприязненный', 'подозрительный', 'нейтральный',
          'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
        ),
        defaultValue: 'нейтральный'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      history: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Создание таблицы reputation_features
    await queryInterface.createTable('reputation_features', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      requiredLevel: {
        type: Sequelize.ENUM(
          'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
        ),
        allowNull: false
      },
      entityType: {
        type: Sequelize.ENUM('city', 'faction', 'global'),
        allowNull: false
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sphere: {
        type: Sequelize.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
        allowNull: false
      },
      featureType: {
        type: Sequelize.ENUM('discount', 'access', 'quest', 'item', 'training', 'title'),
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Создание таблицы reputation_relations
    await queryInterface.createTable('reputation_relations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sourceType: {
        type: Sequelize.ENUM('city', 'faction', 'global'),
        allowNull: false
      },
      sourceId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sourceSphere: {
        type: Sequelize.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
        allowNull: false
      },
      targetType: {
        type: Sequelize.ENUM('city', 'faction', 'global'),
        allowNull: false
      },
      targetId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      targetSphere: {
        type: Sequelize.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
        allowNull: false
      },
      impactFactor: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Создание индексов для оптимизации запросов
    await queryInterface.addIndex('reputations', ['userId']);
    await queryInterface.addIndex('reputations', ['entityType', 'entityId']);
    await queryInterface.addIndex('reputation_features', ['entityType', 'entityId', 'sphere']);
    await queryInterface.addIndex('reputation_relations', ['sourceType', 'sourceId', 'sourceSphere']);
    await queryInterface.addIndex('reputation_relations', ['targetType', 'targetId', 'targetSphere']);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаление таблиц в обратном порядке
    await queryInterface.dropTable('reputation_relations');
    await queryInterface.dropTable('reputation_features');
    await queryInterface.dropTable('reputations');
  }
};
