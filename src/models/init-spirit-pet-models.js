/**
 * Модуль для правильной инициализации моделей духовных питомцев
 * Решает проблемы с циклическими зависимостями и порядком инициализации
 */

const { Sequelize, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

// Подключаем модели
const SpiritPetCatalog = require('./spirit-pet-catalog');
const UserSpiritPet = require('./user-spirit-pet');
const SpiritPetFood = require('./spirit-pet-food');

/**
 * Инициализирует все модели, связанные с духовными питомцами
 * @returns {Promise<Object>} Объект, содержащий инициализированные модели
 */
async function initializeSpiritPetModels() {
  console.log('Инициализация моделей духовных питомцев...');
  
  try {
    // Получаем экземпляр Sequelize
    const sequelizeResult = await connectionProvider.getSequelizeInstance();
    const sequelize = sequelizeResult.db;
    
    // Инициализируем модели в правильном порядке
    await SpiritPetCatalog.init();
    console.log('Модель SpiritPetCatalog инициализирована');
    
    await UserSpiritPet.init();
    console.log('Модель UserSpiritPet инициализирована');
    
    await SpiritPetFood.init();
    console.log('Модель SpiritPetFood инициализирована');
    
    // Устанавливаем ассоциации вручную
    SpiritPetCatalog.hasMany(UserSpiritPet, {
      foreignKey: 'petId',
      sourceKey: 'id',
      as: 'userPets'
    });
    
    UserSpiritPet.belongsTo(SpiritPetCatalog, {
      foreignKey: 'petId',
      targetKey: 'id',
      as: 'petType'
    });
    
    // Если есть модель пользователя, устанавливаем с ней связь
    if (sequelize.models.User) {
      UserSpiritPet.belongsTo(sequelize.models.User, {
        foreignKey: 'userId',
        as: 'owner'
      });
    }
    
    console.log('Ассоциации моделей духовных питомцев установлены');
    
    return {
      SpiritPetCatalog,
      UserSpiritPet,
      SpiritPetFood
    };
  } catch (error) {
    console.error('Ошибка при инициализации моделей духовных питомцев:', error);
    throw error;
  }
}

// Экспортируем функцию инициализации и модели
module.exports = {
  initializeSpiritPetModels,
  SpiritPetCatalog,
  UserSpiritPet,
  SpiritPetFood
};

// Автоматически инициализируем модели при импорте модуля
(async () => {
  try {
    await initializeSpiritPetModels();
  } catch (error) {
    console.error('Ошибка при автоматической инициализации моделей духовных питомцев:', error);
  }
})();