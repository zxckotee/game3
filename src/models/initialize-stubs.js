/**
 * Файл заглушек для проблемных моделей
 * Создает базовую модель User, которая используется во многих связях
 */

const { Sequelize, Model, DataTypes } = require('sequelize');
const connectionProvider = require('../utils/connection-provider');

// Прямое подключение к базе данных без circular dependency
async function getDirectConnection() {
  try {
    console.log('Инициализация прямого подключения к базе данных через connection-provider...');
    const result = await connectionProvider.getSequelizeInstance();
    return result.db;
  } catch (error) {
    console.error('Ошибка при получении прямого подключения:', error);
    throw error;
  }
}

/**
 * Инициализация заглушки модели User
 */
async function initializeUserStub() {
  console.log('Инициализация заглушки модели User...');
  try {
    const sequelize = await getDirectConnection();
    
    // Определяем базовый класс User для использования в ассоциациях
    class User extends Model {}
    
    User.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true
    });
    
    console.log('Заглушка модели User успешно инициализирована');
    
    // Регистрируем модель в реестре
    const { registerModel } = require('../services/database-connection-manager');
    registerModel('User', User);
    
    return User;
  } catch (error) {
    console.error('Ошибка при инициализации заглушки модели User:', error);
    throw error;
  }
}

/**
 * Инициализация заглушки модели CharacterProfile
 */
async function initializeCharacterProfileStub() {
  console.log('Инициализация заглушки модели CharacterProfile...');
  try {
    const sequelize = await getDirectConnection();
    
    class CharacterProfile extends Model {}
    
    CharacterProfile.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'CharacterProfile',
      tableName: 'character_profiles',
      timestamps: true,
      underscored: true
    });
    
    console.log('Заглушка модели CharacterProfile успешно инициализирована');
    
    // Регистрируем модель в реестре
    const { registerModel } = require('../services/database-connection-manager');
    registerModel('CharacterProfile', CharacterProfile);
    
    return CharacterProfile;
  } catch (error) {
    console.error('Ошибка при инициализации заглушки модели CharacterProfile:', error);
    throw error;
  }
}

/**
 * Инициализация заглушки модели SpiritPet
 */
async function initializeSpiritPetStub() {
  console.log('Инициализация заглушки модели SpiritPet...');
  try {
    const sequelize = await getDirectConnection();
    
    class SpiritPet extends Model {}
    
    SpiritPet.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'SpiritPet',
      tableName: 'spirit_pets',
      timestamps: true,
      underscored: true
    });
    
    console.log('Заглушка модели SpiritPet успешно инициализирована');
    
    // Регистрируем модель в реестре
    const { registerModel } = require('../services/database-connection-manager');
    registerModel('SpiritPet', SpiritPet);
    
    return SpiritPet;
  } catch (error) {
    console.error('Ошибка при инициализации заглушки модели SpiritPet:', error);
    throw error;
  }
}

/**
 * Инициализация заглушки модели SectMember
 */
async function initializeSectMemberStub() {
  console.log('Инициализация заглушки модели SectMember...');
  try {
    const sequelize = await getDirectConnection();
    
    class SectMember extends Model {}
    
    SectMember.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      sectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      sequelize,
      modelName: 'SectMember',
      tableName: 'sect_members',
      timestamps: true,
      underscored: true
    });
    
    console.log('Заглушка модели SectMember успешно инициализирована');
    
    // Регистрируем модель в реестре
    const { registerModel } = require('../services/database-connection-manager');
    registerModel('SectMember', SectMember);
    
    return SectMember;
  } catch (error) {
    console.error('Ошибка при инициализации заглушки модели SectMember:', error);
    throw error;
  }
}

/**
 * Инициализация всех заглушек моделей
 * @returns {Promise<Object>} - Объект с заглушками моделей
 */
async function initializeStubs() {
  try {
    console.log('Инициализация заглушек моделей...');
    
    // Инициализируем заглушки
    const User = await initializeUserStub();
    const CharacterProfile = await initializeCharacterProfileStub();
    const SpiritPet = await initializeSpiritPetStub();
    const SectMember = await initializeSectMemberStub();
    
    console.log('Все заглушки моделей успешно инициализированы');
    
    return {
      User,
      CharacterProfile,
      SpiritPet,
      SectMember
    };
  } catch (error) {
    console.error('Ошибка при инициализации заглушек моделей:', error);
    throw error;
  }
}

module.exports = {
  initializeStubs,
  initializeUserStub,
  initializeCharacterProfileStub,
  initializeSpiritPetStub,
  initializeSectMemberStub,
  getDirectConnection
};

// Если скрипт запущен напрямую, инициализируем заглушки
if (require.main === module) {
  initializeStubs()
    .then(() => {
      console.log('Инициализация заглушек завершена успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error('Ошибка при инициализации заглушек:', error);
      process.exit(1);
    });
}