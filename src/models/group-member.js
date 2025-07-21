/**
 * Модель участника группы
 * Связывает пользователей с группами и определяет их роли
 */
const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class GroupMember extends Model {
  static associate(models) {
    // Связь с пользователем
    GroupMember.belongsTo(models.User, {
      foreignKey: 'userId', // Оставляем camelCase
      as: 'user'
    });
    // Связь с группой
    GroupMember.belongsTo(models.Group, {
      foreignKey: 'groupId', // Оставляем camelCase
      as: 'group'
    });
  }
}

GroupMember.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    }
    // onDelete/onUpdate не указаны в миграции, оставляем по умолчанию
  },
  groupId: { // Соответствует groupId в миграции
    type: DataTypes.UUID,
    allowNull: false,
    field: 'group_id', // Добавляем field для snake_case
    references: {
      model: 'groups', // Имя таблицы в lowercase
      key: 'id'
    }
    // onDelete/onUpdate не указаны в миграции, оставляем по умолчанию
  },
  role: { // Соответствует role в миграции
    type: DataTypes.ENUM,
    values: ['leader', 'officer', 'member'],
    allowNull: false,
    defaultValue: 'member'
  },
  specialization: {
    type: DataTypes.ENUM,
    values: ['tank', 'damage', 'support', 'scout', 'alchemist', 'healer'],
    allowNull: true
  },
  joinedAt: { // Соответствует joinedAt в миграции
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW // Sequelize обработает это как CURRENT_TIMESTAMP
  },
  lastActiveAt: { // Соответствует lastActiveAt в миграции
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW // Sequelize обработает это как CURRENT_TIMESTAMP
  },
  contributionPoints: { // Соответствует contributionPoints в миграции
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Очки вклада в группу'
  }
  // Sequelize автоматически добавит createdAt и updatedAt
}, {
  sequelize,
  modelName: 'GroupMember',
  tableName: 'group_members', // Имя таблицы в lowercase
  timestamps: true,          // Явно указываем использование временных меток
  underscored: true          // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
  // Убрано переопределение createdAt и updatedAt
});
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = GroupMember;
