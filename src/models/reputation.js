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

class Reputation extends Model {
  static associate(models) {
    // Связь с пользователем
    Reputation.belongsTo(models.User, {
      foreignKey: 'userId', // Оставляем camelCase
      as: 'user'
    });
    // Связи с другими сущностями (city, faction) могут быть добавлены здесь,
    // если для них существуют модели
  }
}

Reputation.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    userId: {
      type: DataTypes.INTEGER, // Предполагаем, что ID пользователя - INTEGER
      allowNull: false,
      primaryKey: true,
      field: 'user_id', // Добавляем field для snake_case
      references: { // Добавляем ссылку на таблицу users
        model: 'users',
        key: 'id'
      }
    },
    entityType: {
      type: DataTypes.ENUM('city', 'faction', 'global'),
      allowNull: false,
      primaryKey: true,
      field: 'entity_type' // Добавляем field для snake_case
    },
    entityId: {
      type: DataTypes.INTEGER, // Может потребоваться UUID
      allowNull: true, // В SQL нет NOT NULL
      primaryKey: true,
      field: 'entity_id' // Добавляем field для snake_case
    },
    sphere: {
      type: DataTypes.ENUM('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general'),
      allowNull: false,
      primaryKey: true
    },
    value: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: -100,
        max: 100
      }
    },
    level: {
      type: DataTypes.ENUM(
        'враждебный', 'неприязненный', 'подозрительный', 'нейтральный',
        'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный'
      ),
      defaultValue: 'нейтральный'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    history: {
      type: DataTypes.JSONB, // Используем JSONB для PostgreSQL
      defaultValue: []
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'Reputation',
    tableName: 'reputations', // Имя таблицы в snake_case
    timestamps: true,        // Используем timestamps
    underscored: true        // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await Reputation.init();
    console.log('Reputation модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели Reputation:', error);
    console.error(error.stack);
  }
})();

module.exports = Reputation;
