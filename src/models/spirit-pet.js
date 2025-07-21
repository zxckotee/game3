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

class SpiritPet extends Model {
  // Улучшенный метод associate с безопасными проверками
  static associate(models) {
    try {
      // Проверяем, что models существует и имеет Sequelize
      if (!models || !models.Sequelize) {
        console.warn('SpiritPet.associate: models или models.Sequelize не определены');
        return;
      }
      
      // Проверяем, что models.User существует и является моделью Sequelize
      if (models.User) {
        // Проверяем, что models.User является моделью Sequelize
        const isUserModel = models.User.prototype instanceof models.Sequelize.Model ||
                           typeof models.User.findOne === 'function' ||
                           models.User.prototype instanceof Model;
        
        if (isUserModel) {
          SpiritPet.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'owner'
          });
          console.log('Ассоциация SpiritPet -> User успешно установлена');
        } else {
          console.warn('Ассоциация SpiritPet -> User не установлена: User не является моделью Sequelize');
        }
      } else {
        console.warn('Ассоциация SpiritPet -> User не установлена: User не найден в models');
        
        // Пытаемся получить модель User через require как запасной вариант
        try {
          const User = require('./user');
          if (User && (User.prototype instanceof Model)) {
            SpiritPet.belongsTo(User, {
              foreignKey: 'userId',
              as: 'owner'
            });
            console.log('Ассоциация SpiritPet -> User установлена через прямой импорт');
          }
        } catch (importError) {
          console.error('Не удалось импортировать модель User для ассоциации:', importError.message);
        }
      }
    } catch (error) {
      console.error('Общая ошибка при установке ассоциаций для SpiritPet:', error.message);
    }
  }
}

// Исправление: не используем super за пределами класса
SpiritPet.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Имя таблицы в lowercase
      key: 'id'
    }
    // onUpdate/onDelete не указаны в миграции, оставляем по умолчанию
  },
  name: { // Соответствует name в миграции
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Тип духовного питомца (огненный, водный, земляной и т.д.)'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  loyalty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    comment: 'Лояльность питомца (0-100)'
  },
  hunger: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    comment: 'Уровень сытости (0-100)'
  },
  strength: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Сила питомца'
  },
  intelligence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Интеллект питомца'
  },
  agility: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Ловкость питомца'
  },
  vitality: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Живучесть питомца'
  },
  spirit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Духовная сила питомца'
  },
  abilities: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Список способностей питомца'
  },
  evolutionStage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Стадия эволюции питомца'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Активен ли питомец в данный момент'
  },
  lastFed: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lastTrained: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    allowNull: false,
    defaultValue: DataTypes.NOW // Sequelize обработает это как CURRENT_TIMESTAMP
  }
  // Поля createdAt и updatedAt удалены, так как timestamps: true их добавит
}, {
  sequelize,
  modelName: 'SpiritPet',
  tableName: 'spirit_pets', // Исправлено: имя таблицы в snake_case
  timestamps: true,         // Явно указываем использование временных меток
  underscored: true         // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
});
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = SpiritPet;
