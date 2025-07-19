const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await connectionProvider.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class CharacterProfile extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    CharacterProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

// Исправление: не используем super за пределами класса
CharacterProfile.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id', // Маппинг на snake_case поле в БД
    references: {
      model: 'Users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    defaultValue: 'male'
  },
  region: {
    type: DataTypes.STRING,
    defaultValue: 'central'
  },
  background: {
    type: DataTypes.STRING,
    defaultValue: 'commoner'
  },
  description: {
    type: DataTypes.TEXT
  },
  avatar: {
    type: DataTypes.STRING
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gold: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  silver: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  copper: {
    type: DataTypes.INTEGER, 
    defaultValue: 0
  },
  spiritStones: {
    type: DataTypes.INTEGER,
    field: 'spirit_stones', // Маппинг на snake_case поле в БД
    defaultValue: 0
  },
  reputation: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  relationships: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
  }, {
    sequelize,
    modelName: 'CharacterProfile',
    tableName: 'character_profile',
    timestamps: true,
    underscored: true, // Автоматическое использование snake_case для колонок
    createdAt: 'created_at',
    updatedAt: 'updated_at'
    });
};

// Инициализируем модель автоматически для обеспечения работы сервисов
(async () => {
  try {
    await CharacterProfile.init();
    console.log('CharacterProfile модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели CharacterProfile:', error);
    console.error(error.stack);
  }
})();

module.exports = CharacterProfile;
