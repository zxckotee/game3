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

class CharacterStats extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    CharacterStats.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

// Исправление: не используем super за пределами класса
CharacterStats.init = async function(DataTypes, options) {
  // Если параметры переданы из registry, используем их
  let sequelize;
  if (options && options.sequelize) {
    sequelize = options.sequelize;
  } else {
    sequelize = await getSequelize();
  }
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    unique: true
  },
  strength: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  intellect: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  spirit: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  agility: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  health: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  physical_defense: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  spiritual_defense: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attack_speed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  critical_chance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  movement_speed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  luck: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  }, {
    sequelize,
    modelName: 'CharacterStats',
    tableName: 'character_stats',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await CharacterStats.init();
    console.log('CharacterStats модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели CharacterStats:', error);
    console.error(error.stack);
  }
})();

module.exports = CharacterStats;
