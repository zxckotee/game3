/**
 * Модель групповой активности
 * Определяет типы и параметры доступных групповых активностей
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

class GroupActivity extends Model {
  static associate(models) {
    // Связь с экземплярами активностей
    GroupActivity.hasMany(models.GroupActivityInstance, {
      foreignKey: 'activity_id', // Используем snake_case
      as: 'instances'
    });
  }
}

GroupActivity.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM,
    values: ['raid', 'hunt', 'expedition', 'tournament', 'caravan', 'tribulation', 'craft'],
    allowNull: false,
    comment: 'Тип групповой активности'
  },
  difficulty: {
    type: DataTypes.ENUM,
    values: ['easy', 'medium', 'hard', 'extreme', 'legendary'],
    allowNull: false,
    defaultValue: 'medium'
  },
  minParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  minCultivationLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Минимальный уровень культивации для участия'
  },
  recommendedCultivationLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Примерная продолжительность в минутах'
  },
  cooldown: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1440, // в минутах (24 часа)
    comment: 'Период ожидания между попытками в минутах'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Основная локация проведения активности'
  },
  requiredSpecializations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Требуемые специализации участников в формате JSON'
  },
  rewardStructure: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Структура наград в формате JSON'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  specialConditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Особые условия для активации или завершения'
  }
  // Поля createdAt и updatedAt удалены, так как timestamps: true и underscored: true их обработают
}, {
  sequelize,
  modelName: 'GroupActivity',
  tableName: 'group_activities', // Имя таблицы в lowercase
  timestamps: true,             // Явно указываем использование временных меток
  underscored: true             // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
});
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await GroupActivity.init();
    console.log('GroupActivity модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели GroupActivity:', error);
    console.error(error.stack);
  }
})();

module.exports = GroupActivity;
