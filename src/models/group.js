/**
 * Модель группы игроков
 * Представляет собой группу культиваторов, объединившихся для совместной активности
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

class Group extends Model {
  static associate(models) {
    // Связь с участниками группы
    Group.hasMany(models.GroupMember, {
      foreignKey: 'group_id', // Используем snake_case
      as: 'members'
    });
    // Связь с лидером группы
    Group.belongsTo(models.User, {
      foreignKey: 'leaderId', // Оставляем camelCase, так как поле в модели leaderId
      as: 'leader'
    });
    // Связь с экземплярами активностей
    Group.hasMany(models.GroupActivityInstance, {
      foreignKey: 'group_id', // Используем snake_case
      as: 'activityInstances'
    });
    // Связь с приглашениями
    Group.hasMany(models.GroupInvitation, {
      foreignKey: 'group_id', // Используем snake_case
      as: 'invitations'
    });
  }
}

Group.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 30]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  leaderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'leader_id', // Добавляем field для snake_case
    comment: 'ID лидера группы',
    references: { // Добавляем ссылку на таблицу users
      model: 'users',
      key: 'id'
    }
  },
  maxMembers: { // Соответствует maxMembers в миграции
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 2,
      max: 10
    }
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  minCultivationLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Минимальный уровень культивации для вступления в группу',
    field: 'min_cultivation_level' // Добавляем field для snake_case
  }
  // Поля createdAt и updatedAt удалены, так как timestamps: true и underscored: true их обработают
}, {
  sequelize,
  modelName: 'Group',
  tableName: 'groups', // Имя таблицы уже в lowercase
  timestamps: true,   // Явно указываем использование временных меток
  underscored: true   // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
});
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = Group;
