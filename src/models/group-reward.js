/**
 * Модель наград за групповые активности
 * Отслеживает распределение наград между участниками групповых активностей
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

class GroupReward extends Model {
  static associate(models) {
    // Связь с экземпляром активности
    GroupReward.belongsTo(models.GroupActivityInstance, {
      foreignKey: 'activityInstanceId', // Оставляем camelCase
      as: 'activityInstance'
    });
    // Связь с пользователем
    GroupReward.belongsTo(models.User, {
      foreignKey: 'userId', // Оставляем camelCase
      as: 'user'
    });
  }
}

GroupReward.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  activityInstanceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'group_activity_instances', // Имя таблицы в lowercase
      key: 'id'
    },
    comment: 'ID экземпляра групповой активности'
  },
  userId: { // Соответствует userId в миграции
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id', // Добавляем field для snake_case
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    },
    comment: 'ID игрока, получившего награду'
  },
  rewardType: { // Соответствует rewardType в миграции
    type: DataTypes.ENUM,
    values: ['experience', 'cultivation', 'item', 'resource', 'currency', 'reputation', 'technique'],
    allowNull: false,
    comment: 'Тип награды'
  },
  rewardId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID предмета/ресурса/техники (если применимо)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Количество полученной награды'
  },
  quality: {
    type: DataTypes.ENUM,
    values: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    allowNull: true,
    comment: 'Качество награды (если применимо)'
  },
  bonusPercentage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Бонусный процент к награде (0-100)'
  },
  contribution: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Вклад игрока в успех активности (0-100)'
  },
  distributedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата и время выдачи награды'
  },
  claimedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата и время получения награды игроком'
  },
  isClaimed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Флаг получения награды игроком'
  }
  // Поля createdAt и updatedAt удалены, так как timestamps: true и underscored: true их обработают
}, {
  sequelize,
  modelName: 'GroupReward',
  tableName: 'group_rewards', // Имя таблицы в lowercase
  timestamps: true,          // Явно указываем использование временных меток
  underscored: true          // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
});
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await GroupReward.init();
    console.log('GroupReward модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели GroupReward:', error);
    console.error(error.stack);
  }
})();

module.exports = GroupReward;
