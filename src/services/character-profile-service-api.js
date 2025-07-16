/**
 * Клиентская версия CharacterProfileService без серверных зависимостей
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
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Ошибка при чтении данных из localStorage:', error);
    return {};
  }
}

/**
 * Сохраняет данные о профилях персонажей в localStorage
 * @param {Object} profiles Объект с профилями персонажей
 */
function saveProfilesToStorage(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Ошибка при сохранении данных в localStorage:', error);
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

class CharacterProfileServiceAPI {
  /**
   * Получение профиля персонажа
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Профиль персонажа
   */
  static async getCharacterProfile(userId) {
    console.log(`[CharacterProfileServiceAPI] Запрос профиля персонажа для пользователя ${userId}`);
    try {
      // Пробуем сначала получить профиль с сервера через API
      try {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (response.ok) {
          const profileData = await response.json();
          console.log(`[CharacterProfileServiceAPI] Получен профиль с сервера:`, profileData);
          return profileData;
        } else {
          console.warn(`[CharacterProfileServiceAPI] API вернул ошибку: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`[CharacterProfileServiceAPI] Ошибка API, используем localStorage:`, apiError);
      }
      
      // Если API не сработал, используем localStorage как резервный вариант
      const profiles = getProfilesFromStorage();
      const profile = profiles[userId];
      
      if (!profile) {
        console.log(`[CharacterProfileServiceAPI] Профиль не найден ни на сервере, ни в localStorage`);
        return null;
      }
      
      console.log(`[CharacterProfileServiceAPI] Возвращаем профиль из localStorage`);
      return formatProfileForApi(profile);
    } catch (error) {
      console.error('[CharacterProfileServiceAPI] Ошибка при получении профиля персонажа:', error);
      throw error;
    }
  }

  /**
   * Создание или обновление профиля персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} data - Данные профиля персонажа
   * @param {boolean} isInitializing - Флаг инициализации (для пропуска проверок)
   * @returns {Promise<Object>} - Обновленный профиль персонажа
   */
  static async updateCharacterProfile(userId, data, isInitializing = false) {
    console.log(`[CharacterProfileServiceAPI] Обновление профиля персонажа для пользователя ${userId}`);
    console.log(`[CharacterProfileServiceAPI] isInitializing:`, isInitializing);

    try {
      // Проверяем обязательные поля, но пропускаем проверку если это инициализация
      if (!data.name && !isInitializing) {
        console.warn('[CharacterProfileServiceAPI] Имя персонажа обязательно');
        throw new Error('Имя персонажа обязательно');
      }
      
      // Пробуем сначала отправить профиль на сервер через API
      try {
        console.log(`[CharacterProfileServiceAPI] Отправка профиля на сервер через API`);
        
        const response = await fetch(`/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          const updatedProfile = await response.json();
          console.log(`[CharacterProfileServiceAPI] Профиль успешно обновлен на сервере:`, updatedProfile);
          
          // Проверяем наличие spiritStones в ответе от сервера
          if (updatedProfile.currency && updatedProfile.currency.spiritStones === undefined) {
            console.warn('[CharacterProfileServiceAPI] spiritStones отсутствует в ответе от сервера, восстанавливаем');
            
            // Создаем объект currency, если его нет
            if (!updatedProfile.currency) {
              updatedProfile.currency = {};
            }
            
            // Восстанавливаем spiritStones из переданных данных
            if (data.currency && data.currency.spiritStones !== undefined) {
              console.log('[CharacterProfileServiceAPI] Восстанавливаем spiritStones из данных запроса:', data.currency.spiritStones);
              updatedProfile.currency.spiritStones = data.currency.spiritStones;
            } else {
              // Если в запросе нет spiritStones, пробуем взять из localStorage
              const storedProfiles = getProfilesFromStorage();
              const storedProfile = storedProfiles[userId];
              if (storedProfile && storedProfile.spiritStones !== undefined) {
                console.log('[CharacterProfileServiceAPI] Восстанавливаем spiritStones из localStorage:', storedProfile.spiritStones);
                updatedProfile.currency.spiritStones = storedProfile.spiritStones;
              } else {
                // Если нигде нет, устанавливаем в 0
                console.log('[CharacterProfileServiceAPI] Устанавливаем spiritStones в 0');
                updatedProfile.currency.spiritStones = 0;
              }
            }
          }
          
          // Для совместимости также обновляем в localStorage
          const profiles = getProfilesFromStorage();
          profiles[userId] = {
            userId,
            name: updatedProfile.name,
            gender: updatedProfile.gender,
            region: updatedProfile.region,
            background: updatedProfile.background,
            description: updatedProfile.description,
            avatar: updatedProfile.avatar,
            level: updatedProfile.level,
            experience: updatedProfile.experience,
            gold: updatedProfile.currency?.gold || 0,
            silver: updatedProfile.currency?.silver || 0,
            copper: updatedProfile.currency?.copper || 0,
            spiritStones: updatedProfile.currency?.spiritStones || 0,
            reputation: updatedProfile.reputation || {},
            relationships: updatedProfile.relationships || {}
          };
          saveProfilesToStorage(profiles);
          
          return updatedProfile;
        } else {
          console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при обновлении: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`[CharacterProfileServiceAPI] Ошибка API при обновлении, используем localStorage:`, apiError);
      }
      
      // Если API не сработал, используем localStorage как резервный вариант
      console.log(`[CharacterProfileServiceAPI] Используем localStorage для обновления профиля`);
      const profiles = getProfilesFromStorage();
      const profile = profiles[userId];
      
      // Если записи нет, создаем новую
      if (!profile) {
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
      console.log(`[CharacterProfileServiceAPI] Профиль обновлен в localStorage`);
      return formatProfileForApi(profiles[userId]);
    } catch (error) {
      console.error('[CharacterProfileServiceAPI] Ошибка при обновлении профиля персонажа:', error);
      throw error;
    }
  }

  /**
   * Проверка, создан ли персонаж
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} - Флаг, создан ли персонаж
   */
  static async isCharacterCreated(userId) {
    console.log(`[CharacterProfileServiceAPI] Проверка наличия персонажа для пользователя ${userId}`);
    try {
      // Пробуем сначала проверить наличие персонажа через API
      try {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (response.ok) {
          const profileData = await response.json();
          console.log(`[CharacterProfileServiceAPI] Получен профиль с сервера для проверки:`, profileData);
          
          // Если профиль успешно получен и у него есть имя, значит персонаж создан
          const isCreated = !!profileData && !!profileData.name;
          console.log(`[CharacterProfileServiceAPI] Персонаж ${isCreated ? 'найден' : 'не найден'} через API`);
          return isCreated;
        } else {
          console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при проверке: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`[CharacterProfileServiceAPI] Ошибка API при проверке, используем localStorage:`, apiError);
      }
      
      // Если API не сработал, используем localStorage
      const profiles = getProfilesFromStorage();
      const isCreated = !!profiles[userId] && !!profiles[userId].name;
      console.log(`[CharacterProfileServiceAPI] Персонаж ${isCreated ? 'найден' : 'не найден'} в localStorage`);
      return isCreated;
    } catch (error) {
      console.error('[CharacterProfileServiceAPI] Ошибка при проверке создания персонажа:', error);
      throw error;
    }
  }

  /**
   * Обновление валюты персонажа
   * @param {number} userId - ID пользователя
   * @param {Object} currency - Данные о валюте
   * @returns {Promise<Object>} - Обновленная валюта
   */
  static async updateCurrency(userId, currency) {
    console.log(`[CharacterProfileServiceAPI] Обновление валюты для пользователя ${userId}:`, currency);
    try {
      // Пробуем сначала получить профиль с сервера через API
      try {
        // Сначала получаем текущий профиль
        const getResponse = await fetch(`/api/users/${userId}/profile`);
        
        if (getResponse.ok) {
          const profileData = await getResponse.json();
          console.log(`[CharacterProfileServiceAPI] Текущий профиль с сервера:`, profileData);
          
          // Создаем обновленный профиль с новыми данными валюты
          const updatedProfile = {
            ...profileData,
            currency: {
              ...profileData.currency,
              ...currency
            }
          };
          
          // Отправляем обновленный профиль на сервер
          const updateResponse = await fetch(`/api/users/${userId}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProfile)
          });
          
          if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log(`[CharacterProfileServiceAPI] Валюта успешно обновлена на сервере:`, result.currency);
            
            // Для совместимости обновляем и localStorage
            const profiles = getProfilesFromStorage();
            if (profiles[userId]) {
              if (currency.gold !== undefined) profiles[userId].gold = currency.gold;
              if (currency.silver !== undefined) profiles[userId].silver = currency.silver;
              if (currency.copper !== undefined) profiles[userId].copper = currency.copper;
              if (currency.spiritStones !== undefined) profiles[userId].spiritStones = currency.spiritStones;
              saveProfilesToStorage(profiles);
            }
            
            return result.currency;
          } else {
            console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при обновлении валюты: ${updateResponse.status}`);
          }
        } else {
          console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при получении профиля: ${getResponse.status}`);
        }
      } catch (apiError) {
        console.warn(`[CharacterProfileServiceAPI] Ошибка API при обновлении валюты, используем localStorage:`, apiError);
      }
      
      // Если API не сработал, используем localStorage как резервный вариант
      console.log(`[CharacterProfileServiceAPI] Используем localStorage для обновления валюты`);
      const profiles = getProfilesFromStorage();
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
      console.log(`[CharacterProfileServiceAPI] Валюта обновлена в localStorage`);
      return {
        gold: profile.gold,
        silver: profile.silver,
        copper: profile.copper,
        spiritStones: profile.spiritStones
      };
    } catch (error) {
      console.error('[CharacterProfileServiceAPI] Ошибка при обновлении валюты персонажа:', error);
      throw error;
    }
  }

  /**
   * Обновление отношений с NPC
   * @param {number} userId - ID пользователя
   * @param {Object} relationships - Данные об отношениях
   * @returns {Promise<Object>} - Обновленные отношения
   */
  static async updateRelationships(userId, relationships) {
    console.log(`[CharacterProfileServiceAPI] Обновление отношений для пользователя ${userId}`);
    try {
      // Пробуем сначала получить профиль с сервера через API
      try {
        // Сначала получаем текущий профиль
        const getResponse = await fetch(`/api/users/${userId}/profile`);
        
        if (getResponse.ok) {
          const profileData = await getResponse.json();
          console.log(`[CharacterProfileServiceAPI] Текущий профиль с сервера:`, profileData);
          
          // Создаем обновленный профиль с новыми данными отношений
          const updatedProfile = {
            ...profileData,
            relationships: relationships
          };
          
          // Отправляем обновленный профиль на сервер
          const updateResponse = await fetch(`/api/users/${userId}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProfile)
          });
          
          if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log(`[CharacterProfileServiceAPI] Отношения успешно обновлены на сервере:`, result.relationships);
            
            // Для совместимости обновляем и localStorage
            const profiles = getProfilesFromStorage();
            if (profiles[userId]) {
              profiles[userId].relationships = relationships;
              saveProfilesToStorage(profiles);
            }
            
            return result.relationships;
          } else {
            console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при обновлении отношений: ${updateResponse.status}`);
          }
        } else {
          console.warn(`[CharacterProfileServiceAPI] API вернул ошибку при получении профиля: ${getResponse.status}`);
        }
      } catch (apiError) {
        console.warn(`[CharacterProfileServiceAPI] Ошибка API при обновлении отношений, используем localStorage:`, apiError);
      }
      
      // Если API не сработал, используем localStorage как резервный вариант
      console.log(`[CharacterProfileServiceAPI] Используем localStorage для обновления отношений`);
      const profiles = getProfilesFromStorage();
      const profile = profiles[userId];
      
      if (!profile) {
        throw new Error('Профиль персонажа не найден');
      }
      
      // Обновляем отношения
      profile.relationships = relationships;
      
      // Сохраняем обновленные профили
      saveProfilesToStorage(profiles);
      
      // Возвращаем обновленные отношения
      console.log(`[CharacterProfileServiceAPI] Отношения обновлены в localStorage`);
      return profile.relationships;
    } catch (error) {
      console.error('[CharacterProfileServiceAPI] Ошибка при обновлении отношений персонажа:', error);
      throw error;
    }
  }

  /**
   * Загрузка аватарки персонажа
   * @param {number} userId - ID пользователя
   * @param {File} file - Файл аватарки
   * @returns {Promise<Object>} - Результат загрузки
   */
  static async uploadAvatar(userId, file) {
    try {
      console.log(`[CharacterProfileServiceAPI] Загрузка аватарки для пользователя ${userId}`);
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[CharacterProfileServiceAPI] Аватарка успешно загружена:`, result);
        
        // Обновляем localStorage
        const profiles = getProfilesFromStorage();
        if (profiles[userId]) {
          profiles[userId].avatar = result.avatar;
          saveProfilesToStorage(profiles);
        }
        
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка загрузки аватарки');
      }
    } catch (error) {
      console.error(`[CharacterProfileServiceAPI] Ошибка при загрузке аватарки:`, error);
      throw error;
    }
  }

  /**
   * Получение аватарки персонажа (УСТАРЕЛО - аватарка теперь приходит с профилем)
   * @param {number} userId - ID пользователя
   * @returns {Promise<string|null>} - Путь к аватарке или null
   */
  static async getAvatar(userId) {
    console.log(`[CharacterProfileServiceAPI] getAvatar устарел - аватарка теперь приходит с профилем`);
    
    // Получаем аватарку из профиля в localStorage
    const profiles = getProfilesFromStorage();
    const profile = profiles[userId];
    
    if (profile && profile.avatar) {
      console.log(`[CharacterProfileServiceAPI] Аватарка получена из профиля:`, profile.avatar);
      return profile.avatar;
    }
    
    console.log(`[CharacterProfileServiceAPI] Аватарка не найдена в профиле`);
    return null;
  }
}

// Экспортируем класс через CommonJS
module.exports = CharacterProfileServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getCharacterProfile = CharacterProfileServiceAPI.getCharacterProfile;
module.exports.updateCharacterProfile = CharacterProfileServiceAPI.updateCharacterProfile;
module.exports.isCharacterCreated = CharacterProfileServiceAPI.isCharacterCreated;
module.exports.updateCurrency = CharacterProfileServiceAPI.updateCurrency;
module.exports.updateRelationships = CharacterProfileServiceAPI.updateRelationships;
module.exports.uploadAvatar = CharacterProfileServiceAPI.uploadAvatar;
module.exports.getAvatar = CharacterProfileServiceAPI.getAvatar;
/**
 * Обработка взаимодействия с NPC
 * @param {number} characterId - ID персонажа (NPC)
 * @param {string} interactionType - Тип взаимодействия
 * @returns {Promise<Object>} - Ответ сервера
 */
module.exports.handleInteraction = async (characterId, interactionType) => {
  console.log(`[CharacterProfileServiceAPI] Взаимодействие с персонажем ${characterId}, тип: ${interactionType}`);
  try {
    const response = await fetch('/api/relationships/interact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ characterId, interactionType })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[CharacterProfileServiceAPI] Взаимодействие успешно обработано:`, result);
      
      // Проверяем успешность операции
      if (result.success) {
        return {
          success: true,
          updatedRelationship: result.updatedRelationship,
          newEnergy: result.newEnergy,
          energyCost: result.energyCost,
          relationshipChange: result.relationshipChange,
          message: result.message
        };
      } else {
        return {
          success: false,
          message: result.message || 'Операция не выполнена'
        };
      }
    } else {
      const errorData = await response.json();
      console.error(`[CharacterProfileServiceAPI] API вернул ошибку при взаимодействии: ${response.status}`, errorData);
      return {
        success: false,
        message: errorData.message || 'Ошибка при взаимодействии с персонажем'
      };
    }
  } catch (error) {
    console.error('[CharacterProfileServiceAPI] Ошибка при взаимодействии с NPC:', error);
    return {
      success: false,
      message: error.message || 'Ошибка сети при взаимодействии с персонажем'
    };
  }
};

/**
 * Добавление нового события к отношениям с NPC
 * @param {string} relationshipId - ID отношений (snake_case ID NPC)
 * @param {string} eventText - Текст события
 * @returns {Promise<Object>} - Ответ сервера
 */
module.exports.addRelationshipEvent = async (relationshipId, eventText) => {
  console.log(`[CharacterProfileServiceAPI] Добавление события к отношениям ${relationshipId}`);
  try {
    const response = await fetch('/api/relationships/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ relationshipId, eventText })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[CharacterProfileServiceAPI] Событие успешно добавлено:`, result);
      return result;
    } else {
      const errorData = await response.json();
      console.error(`[CharacterProfileServiceAPI] API вернул ошибку при добавлении события: ${response.status}`, errorData);
      throw new Error(errorData.message || 'Ошибка при добавлении события');
    }
  } catch (error) {
    console.error('[CharacterProfileServiceAPI] Ошибка при добавлении события в отношения:', error);
    throw error;
  }
};