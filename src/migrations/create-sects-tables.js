import { DataTypes } from 'sequelize';

/**
 * Миграция для создания таблиц сект и членов сект
 */
export default {
  name: 'create-sects-tables',
  up: async (queryInterface) => {
    // Создание таблицы сект
    await queryInterface.createTable('Sects', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      rank: {
        type: DataTypes.STRING,
        defaultValue: 'Начальная'
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      requiredExperience: {
        type: DataTypes.INTEGER,
        defaultValue: 100
      },
      influence: {
        type: DataTypes.INTEGER,
        defaultValue: 100
      },
      resources: {
        type: DataTypes.INTEGER,
        defaultValue: 50
      },
      resourcesJson: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      territories: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      techniques: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      foundingDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      benefits: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      leaderId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Создание таблицы членов сект
    await queryInterface.createTable('SectMembers', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('Глава секты', 'Старейшина', 'Внутренний ученик', 'Внешний ученик'),
        defaultValue: 'Внешний ученик'
      },
      cultivationLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      requiredExperience: {
        type: DataTypes.INTEGER,
        defaultValue: 100
      },
      loyalty: {
        type: DataTypes.INTEGER,
        defaultValue: 50
      },
      specialization: {
        type: DataTypes.STRING,
        allowNull: true
      },
      skills: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      lastTrainingDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sectId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Sects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Создание индексов для оптимизации запросов
    await queryInterface.addIndex('Sects', ['name']);
    await queryInterface.addIndex('Sects', ['leaderId']);
    await queryInterface.addIndex('SectMembers', ['userId']);
    await queryInterface.addIndex('SectMembers', ['sectId']);
    await queryInterface.addIndex('SectMembers', ['role']);
  },

  down: async (queryInterface) => {
    // Удаление таблиц в обратном порядке
    await queryInterface.dropTable('SectMembers');
    await queryInterface.dropTable('Sects');
  }
};
