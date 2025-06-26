// API-клиент для работы с духовными питомцами
// Использует реальные API-запросы вместо моковых данных

// Базовый URL для API
const API_BASE_URL = '/api';
const USERS_API_URL = `${API_BASE_URL}/users`;
const PETS_API_URL = `${API_BASE_URL}/spirit-pets`;

// Вспомогательная функция для обработки ошибок
const handleError = (error, defaultMessage = 'Произошла ошибка при выполнении запроса') => {
  console.error('API Error:', error);
  
  // Возвращаем объект с информацией об ошибке
  return {
    success: false,
    error: error.message || defaultMessage,
    statusCode: error.statusCode || 500
  };
};

// Базовая функция для выполнения запросов
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP Error: ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }

    // Если ответ пустой, возвращаем объект успеха
    if (response.status === 204) {
      return { success: true };
    }

    // Парсим JSON-ответ
    const data = await response.json();
    return data;
  } catch (error) {
    return handleError(error);
  }
};

// Получить все типы питомцев из каталога
const fetchAllPetTypes = async () => {
  try {
    const petTypes = await fetchAPI(`${PETS_API_URL}/types`);
    
    // Проверяем наличие ошибки
    if (petTypes.error) {
      throw new Error(petTypes.error);
    }
    
    return petTypes;
  } catch (error) {
    console.error('Ошибка при получении типов питомцев:', error);
    return [];
  }
};

// Получить всех питомцев пользователя
const fetchUserPets = async (userId = 1) => {
  try {
    const pets = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets`);
    
    // Проверяем наличие ошибки
    if (pets.error) {
      throw new Error(pets.error);
    }
    
    return pets;
  } catch (error) {
    console.error('Ошибка при получении питомцев пользователя:', error);
    return [];
  }
};

// Получить активного питомца пользователя
const fetchActivePet = async (userId = 1) => {
  try {
    const activePet = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/active`);
    
    // Проверяем наличие ошибки
    if (activePet.error) {
      // Если ошибка 404 (нет активного питомца), возвращаем null
      if (activePet.statusCode === 404) {
        return null;
      }
      throw new Error(activePet.error);
    }
    
    return activePet;
  } catch (error) {
    console.error('Ошибка при получении активного питомца:', error);
    return null;
  }
};

// Получить детальную информацию о питомце пользователя
const fetchPetDetails = async (petId) => {
  try {
    if (!petId) {
      console.error('fetchPetDetails: petId не указан');
      return null;
    }
    
    // Добавить проверку специальных строковых значений
    if (petId === 'active' || petId === 'constants' || petId === 'food') {
      console.error(`fetchPetDetails: некорректный ID питомца: "${petId}"`);
      return null;
    }
    
    // Проверка, что ID является числом, если передана строка
    if (typeof petId === 'string' && !/^\d+$/.test(petId)) {
      console.error(`fetchPetDetails: ID питомца должен быть числом, получено: "${petId}"`);
      return null;
    }
    
    const pet = await fetchAPI(`${PETS_API_URL}/${petId}`);
    
    // Проверяем наличие ошибки
    if (pet.error) {
      throw new Error(pet.error);
    }
    
    return pet;
  } catch (error) {
    console.error(`Ошибка при получении информации о питомце с ID ${petId}:`, error);
    return null;
  }
};

// Активировать питомца пользователя
const activatePet = async (petId, userId = 1) => {
  try {
    if (!petId) {
      console.error('activatePet: petId не указан');
      return null;
    }
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/${petId}/activate`, {
      method: 'POST'
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при активации питомца с ID ${petId}:`, error);
    return null;
  }
};

// Накормить питомца
const feedPet = async (petId, foodItemId = null, userId = 1) => {
  try {
    if (!petId) {
      console.error('feedPet: petId не указан');
      return null;
    }
    
    if (!foodItemId) {
      console.error('feedPet: foodItemId не указан');
      return null;
    }
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/${petId}/feed`, {
      method: 'POST',
      body: JSON.stringify({ foodItemId })
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при кормлении питомца с ID ${petId}:`, error);
    return null;
  }
};

// Тренировать питомца
const trainPet = async (petId, stat, userId = 1) => {
  try {
    if (!petId) {
      console.error('trainPet: petId не указан');
      return null;
    }
    
    if (!stat) {
      console.error('trainPet: stat не указан');
      return null;
    }
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/${petId}/train`, {
      method: 'POST',
      body: JSON.stringify({ attribute: stat })
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    // Если ошибка связана с голодом питомца, пробрасываем её наверх
    if (error.message && error.message.includes('голоден')) {
      throw error;
    }
    
    console.error(`Ошибка при тренировке питомца с ID ${petId}:`, error);
    return null;
  }
};

// Получить питомца (для новых игроков или при нахождении питомца)
const acquirePet = async (petTypeId = null, userId = 1) => {
  try {
    // Если petTypeId не указан, используем локацию по умолчанию
    const location = petTypeId ? undefined : 'forest';
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/tame`, {
      method: 'POST',
      body: JSON.stringify({ location, petTypeId })
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при получении нового питомца:', error);
    return null;
  }
};

// Проверить состояние питомцев (уменьшение голода и лояльности с течением времени)
const checkPetsStatus = async (userId = 1) => {
  try {
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/update-state`, {
      method: 'POST'
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при обновлении состояния питомцев:', error);
    return [];
  }
};

// Боевые функции питомцев
const fetchPetCombatBonuses = async (userId = 1) => {
  try {
    const response = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/combat-bonus`);
    
    // Проверяем наличие ошибки
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Если у пользователя нет активного питомца
    if (!response.hasActivePet && response.hasActivePet !== undefined) {
      return { bonuses: null, hasActivePet: false };
    }
    
    return response;
  } catch (error) {
    console.error('Ошибка при получении боевых бонусов питомца:', error);
    return { bonuses: null, hasActivePet: false };
  }
};

// Использовать способность питомца в бою
const usePetAbility = async (abilityId, battleId = null, userId = 1) => {
  try {
    if (!abilityId) {
      console.error('usePetAbility: abilityId не указан');
      return null;
    }
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/use-ability`, {
      method: 'POST',
      body: JSON.stringify({ abilityId, battleId })
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    // Если ошибка связана с отсутствием активного питомца или недостаточной лояльностью/голодом,
    // пробрасываем её наверх
    if (error.message && (
      error.message.includes('нет активного питомца') ||
      error.message.includes('лояльность') ||
      error.message.includes('голоден')
    )) {
      throw error;
    }
    
    console.error(`Ошибка при использовании способности питомца:`, error);
    return null;
  }
};

// Обработка результатов боя для питомца
const processBattleResults = async (battleData, userId = 1) => {
  try {
    // Получаем активного питомца
    const activePet = await fetchActivePet(userId);
    
    if (!activePet) {
      return { success: true, petUpdated: false };
    }
    
    const { victory, fled, damageDealt } = battleData;
    let petUpdated = false;
    let updatedStats = {};
    
    // Если питомец сбежал, уменьшаем лояльность
    if (fled) {
      const result = await fetchAPI(`${PETS_API_URL}/${activePet.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          loyalty: Math.max(0, activePet.loyalty - 10) 
        })
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      petUpdated = true;
      updatedStats = {
        level: result.level,
        experience: result.experience,
        loyalty: result.loyalty,
        hunger: result.hunger,
        damageDealt: result.combat_damage_dealt || 0
      };
    } 
    // Если победа, увеличиваем опыт и лояльность
    else if (victory) {
      // Рассчитываем новые значения
      let newExp = activePet.experience + 20;
      let newLevel = activePet.level;
      let newLoyalty = Math.min(100, activePet.loyalty + 5);
      let statsIncrease = {};
      
      // Проверяем повышение уровня
      const expRequired = activePet.level * 100;
      if (newExp >= expRequired) {
        newLevel += 1;
        newExp -= expRequired;
        
        // Увеличиваем характеристики при повышении уровня
        statsIncrease = {
          strength: activePet.strength + 1,
          intelligence: activePet.intelligence + 1,
          agility: activePet.agility + 1,
          vitality: activePet.vitality + 1,
          spirit: activePet.spirit + 1
        };
      }
      
      // Обновляем питомца
      const result = await fetchAPI(`${PETS_API_URL}/${activePet.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          experience: newExp,
          level: newLevel,
          loyalty: newLoyalty,
          combat_damage_dealt: (activePet.combat_damage_dealt || 0) + (damageDealt || 0),
          ...statsIncrease
        })
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      petUpdated = true;
      updatedStats = {
        level: result.level,
        experience: result.experience,
        loyalty: result.loyalty,
        hunger: result.hunger,
        damageDealt: result.combat_damage_dealt || 0
      };
    } 
    // Если поражение, небольшой опыт
    else {
      const result = await fetchAPI(`${PETS_API_URL}/${activePet.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          experience: activePet.experience + 5,
          combat_damage_dealt: (activePet.combat_damage_dealt || 0) + (damageDealt || 0)
        })
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      petUpdated = true;
      updatedStats = {
        level: result.level,
        experience: result.experience,
        loyalty: result.loyalty,
        hunger: result.hunger,
        damageDealt: result.combat_damage_dealt || 0
      };
    }
    
    return {
      success: true,
      petUpdated,
      petStats: updatedStats
    };
  } catch (error) {
    console.error('Ошибка при обработке результатов боя для питомца:', error);
    return { success: false, error: error.message };
  }
};

// Проверка возможности бегства питомца из боя
const checkPetFlee = async (userId = 1) => {
  try {
    // Получаем активного питомца
    const activePet = await fetchActivePet(userId);
    
    if (!activePet) {
      return { willFlee: false, hasActivePet: false };
    }
    
    // Проверяем на возможность бегства на основе лояльности и голода
    let fleeChance = 0;
    
    // Низкая лояльность увеличивает шанс бегства
    if (activePet.loyalty < 30) {
      fleeChance += (30 - activePet.loyalty) * 2; // до +60% при лояльности 0
    }
    
    // Голод увеличивает шанс бегства
    if (activePet.hunger < 20) {
      fleeChance += (20 - activePet.hunger) * 2; // до +40% при голоде 0
    }
    
    // Окончательный шанс бегства (максимум 80%)
    fleeChance = Math.min(80, fleeChance);
    
    // Определяем, сбежит ли питомец
    const willFlee = Math.random() * 100 < fleeChance;
    
    return {
      willFlee,
      hasActivePet: true,
      fleeChance,
      petStats: {
        loyalty: activePet.loyalty,
        hunger: activePet.hunger
      }
    };
  } catch (error) {
    console.error('Ошибка при проверке возможности бегства питомца:', error);
    return { willFlee: false, hasActivePet: false, error: error.message };
  }
};

// Получить все доступные корма для питомцев
const fetchPetFood = async (userId = null) => {
  try {
    // Если userId указан, добавляем его как параметр запроса
    const url = userId ? `${PETS_API_URL}/food?userId=${userId}` : `${PETS_API_URL}/food`;
    const food = await fetchAPI(url);
    
    // Проверяем наличие ошибки
    if (food.error) {
      throw new Error(food.error);
    }
    
    return food;
  } catch (error) {
    console.error('Ошибка при получении кормов для питомцев:', error);
    return [];
  }
};

// Получить константы для питомцев
const fetchPetConstants = async () => {
  try {
    const constants = await fetchAPI(`${PETS_API_URL}/constants`);
    
    // Проверяем наличие ошибки
    if (constants.error) {
      throw new Error(constants.error);
    }
    
    return constants;
  } catch (error) {
    console.error('Ошибка при получении констант для питомцев:', error);
    return null;
  }
};

// Переименовать питомца
const renamePet = async (petId, newName, userId = 1) => {
  try {
    if (!petId) {
      console.error('renamePet: petId не указан');
      return null;
    }
    
    if (!newName) {
      console.error('renamePet: newName не указан');
      return null;
    }
    
    const result = await fetchAPI(`${USERS_API_URL}/${userId}/spirit-pets/${petId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ newName })
    });
    
    // Проверяем наличие ошибки
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Ошибка при переименовании питомца с ID ${petId}:`, error);
    return null;
  }
};

// Экспортируем все функции в формате CommonJS
module.exports = {
  fetchAllPetTypes,
  fetchUserPets,
  fetchActivePet,
  fetchPetDetails,
  activatePet,
  feedPet,
  trainPet,
  acquirePet,
  checkPetsStatus,
  fetchPetCombatBonuses,
  usePetAbility,
  processBattleResults,
  checkPetFlee,
  fetchPetFood,
  fetchPetConstants,
  renamePet
};