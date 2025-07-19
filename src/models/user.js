const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

class User extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    User.hasOne(models.CultivationProgress, {
      foreignKey: 'userId',
      as: 'cultivationProgress'
    });
   User.hasOne(models.CharacterStats, {
     foreignKey: 'user_id',
     as: 'characterStats'
   });
  }
}

// Переменные для хранения инициализированной модели и промиса инициализации
let initializedUserModel = null;
let initializationPromise = null;

/**
 * Функция для получения инициализированной модели User
 * Гарантирует, что модель будет инициализирована перед использованием
 * @returns {Promise<Model>} Промис, который резолвится инициализированной моделью
 */
async function getInitializedUserModel() {
  // Если модель уже инициализирована, возвращаем её
  if (initializedUserModel) {
    return initializedUserModel;
  }
  
  // Если инициализация уже началась, ждем её завершения
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Начинаем инициализацию
  initializationPromise = initializeUserModel();
  return initializationPromise;
}

/**
 * Функция для инициализации модели User
 * @private
 * @returns {Promise<Model>} Промис, который резолвится инициализированной моделью
 */
async function initializeUserModel() {
  try {
    // Получаем экземпляр Sequelize напрямую через connection-provider
    const result = await connectionProvider.getSequelizeInstance();
    const sequelize = result.db;
    
    // Инициализируем модель
    Model.init.call(User, {
      // Явно определяем ID для соответствия SQL
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash' // Маппинг на поле password_hash в базе данных
      },
      cultivationLevel: { // Соответствует cultivation_level в SQL
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lastLogin: { // Соответствует last_login в SQL
        type: DataTypes.DATE
      }
      // Sequelize автоматически добавит createdAt и updatedAt
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users', // Исправлено: имя таблицы в lowercase
      timestamps: true,   // Явно указываем использование временных меток
      underscored: true   // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
    });
    
    console.log('User модель инициализирована');
    initializedUserModel = User;
    return User;
  } catch (error) {
    console.error('Ошибка инициализации модели User:', error);
    console.error(error.stack);
    throw error;
  }
}

// Инициализируем модель при импорте модуля
(async () => {
  try {
    await getInitializedUserModel();
    console.log('User модель успешно инициализирована при импорте');
  } catch (error) {
    console.error('Ошибка при начальной инициализации модели User:', error);
  }
})();

// Экспорт для CommonJS - следуем паттерну других моделей
module.exports = User;
module.exports.getInitializedUserModel = getInitializedUserModel;
