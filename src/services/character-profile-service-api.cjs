/**
 * Клиентская версия CharacterProfileService без серверных зависимостей (CommonJS)
 * Используется в браузере вместо оригинального character-profile-service.js
 */

// Ключ для локального хранилища
const STORAGE_KEY = 'character_profiles';

/**
 * Получает данные о профилях персонажей из localStorage
 * @returns {Object} Объект с профилями персонажей
 */
function getProfilesFromStorage() {
  try {
    // Проверяем, что localStorage доступен (в Node.js его нет)
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } else {
      // Если нет localStorage, используем объект в памяти
      if (!global._mockProfiles) {
        global._mockProfiles = {};
      }
      return global._mockProfiles;
    }
  } catch (error) {
    console.error('Ошибка при чтении данных из хранилища:', error);
    return {};
  }
}

/**
 * Сохраняет данные о профилях персонажей в хранилище
 * @param {Object} profiles Объект с профилями персонажей
 */
function saveProfilesToStorage(profiles) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } else {
      // Если нет localStorage, используем объект в памяти
      global._mockProfiles = profiles;
    }
  } catch (error) {
    console.error('Ошибка при сохранении данных в хранилище:', error);
  }
}

/**
 * Преобразует внутреннее представление профиля в формат для API
 * @param {Object} profile Внутреннее представление профиля
 * @returns {Object} Профиль в формате для API
 */
function formatProfileForApi(profile) {
  if (!profile) return null;
  
  return {
    name: profile.name,
    gender: profile.gender,
    region: profile.region,
    background: profile.background,
    description: profile.description,
    avatar: profile.avatar,
    level: profile.level,
    experience: profile.experience,
    currency: {
      gold: profile.gold,
      silver: profile.silver,
      copper: profile.copper,
      spiritStones: profile.spiritStones
    },
    reputation: profile.reputation,
    relationships: profile.relationships
  };
}

const CharacterProfileServiceAPI = {
  /**
   * Получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Профиль персонажа
   */
  async getCharacterProfile(userId) {
    try {
      // Получаем профили из хранилища
      const profiles = getProfilesFromStorage();
      
      // Получаем профиль для указанного пользователя
      const profile = profiles[userId];
      
      // Если запись нет, возвращаем null (персонаж не создан)
      if (!profile) {
        return null;
      }
      
      // Форматируем и возвращаем данные
      return formatProfileForApi(profile);
    } catch (error) {
      console.error('Ошибка при получении профиля персонажа:', error);
      throw error;
    }
  },

  /**
   * Создание или обновление профиля персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Данные профиля персонажа
   * @param {boolean} isInitializing - Флаг инициализации (для пропуска проверок)
   * @returns {Promise<Object>} - Обновленный профиль персонажа
   */
  async updateCharacterProfile(userId, data, isInitializing = false) {
    try {
      // Получаем профили из хранилища
      const profiles = getProfilesFromStorage();
      
      // Получаем профиль для указанного пользователя
      const profile = profiles[userId];
      
      // Если записи нет, создаем новую
      if (!profile) {
        // Проверяем обязательные поля, но пропускаем проверку если это инициализация
        if (!data.name && !isInitializing) {
          throw new Error('Имя персонажа обязательно');
        }
        
        profiles[userId] = {
          userId,
          name: data.name,
          gender: data.gender || 'male',
          region: data.region || 'central',
          background: data.background || 'commoner',
          description: data.description || '',
          avatar: data.avatar || '',
          level: data.level || 1,
          experience: data.experience || 0,
          gold: data.currency?.gold || 0,
          silver: data.currency?.silver || 0,
          copper: data.currency?.copper || 0,
          spiritStones: data.currency?.spiritStones || 0,
          reputation: data.reputation || {},
          relationships: data.relationships || {}
        };
      } else {
        // Обновляем существующий профиль
        if (data.name !== undefined) profiles[userId].name = data.name;
        if (data.gender !== undefined) profiles[userId].gender = data.gender;
        if (data.region !== undefined) profiles[userId].region = data.region;
        if (data.background !== undefined) profiles[userId].background = data.background;
        if (data.description !== undefined) profiles[userId].description = data.description;
        if (data.avatar !== undefined) profiles[userId].avatar = data.avatar;
        if (data.level !== undefined) profiles[userId].level = data.level;
        if (data.experience !== undefined) profiles[userId].experience = data.experience;
        
        // Обновляем валюту
        if (data.currency) {
          if (data.currency.gold !== undefined) profiles[userId].gold = data.currency.gold;
          if (data.currency.silver !== undefined) profiles[userId].silver = data.currency.silver;
          if (data.currency.copper !== undefined) profiles[userId].copper = data.currency.copper;
          if (data.currency.spiritStones !== undefined) profiles[userId].spiritStones = data.currency.spiritStones;
        }
        
        // Обновляем репутацию и отношения
        if (data.reputation !== undefined) profiles[userId].reputation = data.reputation;
        if (data.relationships !== undefined) profiles[userId].relationships = data.relationships;
      }
      
      // Сохраняем обновленные профили
      saveProfilesToStorage(profiles);
      
      // Форматируем и возвращаем данные
      return formatProfileForApi(profiles[userId]);
    } catch (error) {
      console.error('Ошибка при обновлении профиля персонажа:', error);
      throw error;
    }
  },

  /**
   * Проверка, создан ли персонаж
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} - Флаг, создан ли персонаж
   */
  async isCharacterCreated(userId) {
    try {
      // Получаем профили из хранилища
      const profiles = getProfilesFromStorage();
      
      // Проверяем наличие профиля для указанного пользователя
      return !!profiles[userId];
    } catch (error) {
      console.error('Ошибка при проверке создания персонажа:', error);
      throw error;
    }
  },

  /**
   * Обновление валюты персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} currency - Данные о валюте
   * @returns {Promise<Object>} - Обновленная валюта
   */
  async updateCurrency(userId, currency) {
    try {
      // Получаем профили из хранилища
      const profiles = getProfilesFromStorage();
      
      // Получаем профиль для указанного пользователя
      const profile = profiles[userId];
      
      if (!profile) {
        throw new Error('Профиль персонажа не найден');
      }
      
      // Обновляем валюту
      if (currency.gold !== undefined) profile.gold = currency.gold;
      if (currency.silver !== undefined) profile.silver = currency.silver;
      if (currency.copper !== undefined) profile.copper = currency.copper;
      if (currency.spiritStones !== undefined) profile.spiritStones = currency.spiritStones;
      
      // Сохраняем обновленные профили
      saveProfilesToStorage(profiles);
      
      // Возвращаем обновленную валюту
      return {
        gold: profile.gold,
        silver: profile.silver,
        copper: profile.copper,
        spiritStones: profile.spiritStones
      };
    } catch (error) {
      console.error('Ошибка при обновлении валюты персонажа:', error);
      throw error;
    }
  },

  /**
   * Обновление отношений с NPC
   * @param {number} userId - ID пользователя
   * @param {Object} relationships - Данные об отношениях
   * @returns {Promise<Object>} - Обновленные отношения
   */
  async updateRelationships(userId, relationships) {
    try {
      // Получаем профили из хранилища
      const profiles = getProfilesFromStorage();
      
      // Получаем профиль для указанного пользователя
      const profile = profiles[userId];
      
      if (!profile) {
        throw new Error('Профиль персонажа не найден');
      }
      
      // Обновляем отношения
      profile.relationships = relationships;
      
      // Сохраняем обновленные профили
      saveProfilesToStorage(profiles);
      
      // Возвращаем обновленные отношения
      return profile.relationships;
    } catch (error) {
      console.error('Ошибка при обновлении отношений персонажа:', error);
      throw error;
    }
  }
};

// Экспортируем модуль для CommonJS
module.exports = CharacterProfileServiceAPI;