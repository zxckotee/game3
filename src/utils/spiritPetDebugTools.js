/**
 * Отладочные инструменты для работы с духовными питомцами
 */

// Глобальные переменные для доступа из консоли
let spiritPetDebugTools = {};

/**
 * Инициализирует инструменты отладки духовных питомцев в глобальном пространстве
 */
export function initSpiritPetDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки духовных питомцев...');
  
  // Функция для получения типов питомцев из Redux-состояния
  const getPetTypesFromState = () => {
    if (!window.__GAME_STATE__?.spiritPets?.petTypes) {
      console.error('Данные о типах духовных питомцев не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.spiritPets.petTypes;
  };
  
  // Функция для получения питомцев пользователя из Redux-состояния
  const getUserPetsFromState = () => {
    if (!window.__GAME_STATE__?.spiritPets?.userPets) {
      console.error('Данные о духовных питомцах пользователя не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.spiritPets.userPets;
  };
  
  // Функция для отображения типов духовных питомцев в консоли
  const displayPetTypes = (petTypes = null) => {
    const petTypesData = petTypes || getPetTypesFromState();
    if (!petTypesData || petTypesData.length === 0) {
      console.log('Типы духовных питомцев не найдены');
      return null;
    }
    
    console.log(`Найдено ${petTypesData.length} типов духовных питомцев:`);
    console.table(petTypesData.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      element: t.element,
      rarity: t.rarity,
      baseStats: `STR:${t.baseStats?.strength} AGI:${t.baseStats?.agility} INT:${t.baseStats?.intelligence}`
    })));
    
    return petTypesData;
  };
  
  // Функция для отображения детальной информации о типе питомца
  const displayPetTypeDetails = async (petTypeId) => {
    if (!petTypeId) {
      console.error('Необходимо указать ID типа питомца');
      return null;
    }
    
    // Используем spiritPetManager для получения типа питомца
    if (!window.spiritPetManager) {
      console.error('SpiritPetManager не инициализирован');
      return null;
    }
    
    const petType = await window.spiritPetManager.getPetTypeById(petTypeId);
    
    if (!petType) {
      console.error(`Тип питомца с ID ${petTypeId} не найден`);
      return null;
    }
    
    console.log(`Детальная информация о типе питомца ID ${petTypeId}:`);
    console.log('Название:', petType.name);
    console.log('Описание:', petType.description);
    console.log('Тип:', petType.type);
    console.log('Элемент:', petType.element);
    console.log('Редкость:', petType.rarity);
    
    // Вывод информации о базовых характеристиках
    if (petType.baseStats) {
      console.group('Базовые характеристики:');
      for (const [stat, value] of Object.entries(petType.baseStats)) {
        console.log(`- ${stat}: ${value}`);
      }
      console.groupEnd();
    }
    
    // Вывод информации о возможных навыках
    if (petType.possibleSkills && petType.possibleSkills.length > 0) {
      console.group('Возможные навыки:');
      petType.possibleSkills.forEach(skill => {
        console.log(`- ${skill.name}: ${skill.description}`);
      });
      console.groupEnd();
    }
    
    return petType;
  };
  
  // Функция для отображения питомцев пользователя
  const displayUserPets = (pets = null) => {
    const petsData = pets || getUserPetsFromState();
    if (!petsData || petsData.length === 0) {
      console.log('Духовные питомцы пользователя не найдены');
      return null;
    }
    
    console.log(`Найдено ${petsData.length} духовных питомцев пользователя:`);
    console.table(petsData.map(p => ({
      id: p.id,
      name: p.name,
      type: p.petTypeId,
      level: p.level,
      exp: `${p.exp}/${p.maxExp}`,
      loyalty: p.loyalty,
      skills: p.skills?.length || 0
    })));
    
    return petsData;
  };
  
  // Функция для отображения детальной информации о питомце
  const displayPetDetails = async (petId) => {
    if (!petId) {
      console.error('Необходимо указать ID питомца');
      return null;
    }
    
    // Используем spiritPetManager для получения питомца
    if (!window.spiritPetManager) {
      console.error('SpiritPetManager не инициализирован');
      return null;
    }
    
    const pet = await window.spiritPetManager.getUserPetById(petId);
    
    if (!pet) {
      console.error(`Питомец с ID ${petId} не найден`);
      return null;
    }
    
    console.log(`Детальная информация о питомце ID ${petId}:`);
    console.log('Название:', pet.name);
    console.log('Тип:', pet.petTypeId);
    console.log('Уровень:', pet.level);
    console.log('Опыт:', `${pet.exp}/${pet.maxExp}`);
    console.log('Лояльность:', pet.loyalty);
    console.log('Тип бонуса:', pet.bonusType);
    console.log('Значение бонуса:', pet.bonusValue);
    
    // Вывод информации о характеристиках
    if (pet.attributes) {
      console.group('Характеристики:');
      for (const [attr, value] of Object.entries(pet.attributes)) {
        console.log(`- ${attr}: ${value}`);
      }
      console.groupEnd();
    }
    
    // Вывод информации о навыках
    if (pet.skills && pet.skills.length > 0) {
      console.group('Навыки:');
      pet.skills.forEach(skill => {
        console.log(`- ${skill.name} (уровень ${skill.level})`);
      });
      console.groupEnd();
    }
    
    return pet;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение всех типов питомцев
  const testGetAllPetTypes = async () => {
    try {
      console.log('Запрос GET /api/spirit-pets/types...');
      const response = await fetch('/api/spirit-pets/types', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const petTypes = await response.json();
      console.log('Получены типы духовных питомцев с сервера:', petTypes);
      return petTypes;
    } catch (error) {
      console.error('Ошибка при получении типов духовных питомцев:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение типа питомца по ID
  const testGetPetTypeById = async (petTypeId) => {
    if (!petTypeId) {
      console.error('Необходимо указать ID типа питомца');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/spirit-pets/types/${petTypeId}...`);
      const response = await fetch(`/api/spirit-pets/types/${petTypeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.error(`Тип питомца с ID ${petTypeId} не найден`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const petType = await response.json();
      console.log(`Получен тип питомца с ID ${petTypeId}:`, petType);
      return petType;
    } catch (error) {
      console.error(`Ошибка при получении типа питомца с ID ${petTypeId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение питомцев пользователя
  const testGetUserPets = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/spirit-pets...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const pets = await response.json();
      console.log(`Получены духовные питомцы пользователя:`, pets);
      return pets;
    } catch (error) {
      console.error('Ошибка при получении духовных питомцев пользователя:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение питомца по ID
  const testGetUserPetById = async (petId) => {
    if (!petId) {
      console.error('Необходимо указать ID питомца');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/spirit-pets/${petId}...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.error(`Питомец с ID ${petId} не найден`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const pet = await response.json();
      console.log(`Получен питомец с ID ${petId}:`, pet);
      return pet;
    } catch (error) {
      console.error(`Ошибка при получении питомца с ID ${petId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на переименование питомца
  const testRenamePet = async (petId, newName) => {
    if (!petId || !newName) {
      console.error('Необходимо указать ID питомца и новое имя');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос PUT /api/users/${userId}/spirit-pets/${petId}/rename...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ newName })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат переименования питомца:`, result);
      
      // Обновляем информацию о питомцах
      window.dispatchEvent(new CustomEvent('user-pets-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при переименовании питомца:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на тренировку питомца
  const testTrainPet = async (petId, attribute) => {
    if (!petId || !attribute) {
      console.error('Необходимо указать ID питомца и атрибут для тренировки');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/spirit-pets/${petId}/train...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ attribute })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат тренировки питомца:`, result);
      
      // Обновляем информацию о питомцах
      window.dispatchEvent(new CustomEvent('user-pets-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при тренировке питомца:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на отправку питомца на поиск
  const testSendPetForaging = async (petId, location) => {
    if (!petId || !location) {
      console.error('Необходимо указать ID питомца и локацию для поиска');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/spirit-pets/${petId}/forage...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}/forage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ location })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат отправки питомца на поиск:`, result);
      
      // Если есть найденные предметы, выводим их
      if (result.foundItems && result.foundItems.length > 0) {
        console.group('Найденные предметы:');
        result.foundItems.forEach(item => {
          console.log(`- ${item.name}: ${item.quantity} шт.`);
        });
        console.groupEnd();
        
        // Обновляем инвентарь
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при отправке питомца на поиск:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на кормление питомца
  const testFeedPet = async (petId, foodItem) => {
    if (!petId || !foodItem) {
      console.error('Необходимо указать ID питомца и предмет для кормления');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/spirit-pets/${petId}/feed...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ foodItem })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат кормления питомца:`, result);
      
      // Обновляем информацию о питомцах
      window.dispatchEvent(new CustomEvent('user-pets-changed'));
      
      // Обновляем инвентарь (удаляем использованную еду)
      window.dispatchEvent(new CustomEvent('inventory-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при кормлении питомца:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на изучение навыка
  const testLearnPetSkill = async (petId, skillId) => {
    if (!petId || !skillId) {
      console.error('Необходимо указать ID питомца и ID навыка');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/spirit-pets/${petId}/learn-skill...`);
      const response = await fetch(`/api/users/${userId}/spirit-pets/${petId}/learn-skill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ skillId })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат изучения навыка:`, result);
      
      // Обновляем информацию о питомцах
      window.dispatchEvent(new CustomEvent('user-pets-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при изучении навыка:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение констант
  const testGetConstants = async () => {
    try {
      console.log(`Запрос GET /api/spirit-pets/constants...`);
      const response = await fetch('/api/spirit-pets/constants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const constants = await response.json();
      console.log(`Получены константы:`, constants);
      
      // Выводим типы питомцев
      console.group('Типы питомцев:');
      console.table(Object.entries(constants.PET_TYPES).map(([key, value]) => ({ key, value })));
      console.groupEnd();
      
      // Выводим элементы питомцев
      console.group('Элементы питомцев:');
      console.table(Object.entries(constants.PET_ELEMENTS).map(([key, value]) => ({ key, value })));
      console.groupEnd();
      
      // Выводим редкости питомцев
      console.group('Редкости питомцев:');
      console.table(Object.entries(constants.PET_RARITY).map(([key, value]) => ({ key, value })));
      console.groupEnd();
      
      // Выводим уровни привязанности
      console.group('Уровни привязанности:');
      console.table(Object.entries(constants.BOND_LEVELS).map(([key, value]) => ({ 
        key, 
        name: value.name,
        min: value.min,
        max: value.max
      })));
      console.groupEnd();
      
      return constants;
    } catch (error) {
      console.error(`Ошибка при получении констант:`, error);
      return null;
    }
  };
  
  // Функция тестирования случайной тренировки
  const trainRandomAttribute = async (petId) => {
    if (!petId) {
      // Если не указан ID питомца, выбираем случайного из доступных
      const userPets = getUserPetsFromState();
      if (!userPets || userPets.length === 0) {
        console.error('У пользователя нет питомцев');
        return null;
      }
      
      petId = userPets[Math.floor(Math.random() * userPets.length)].id;
      console.log(`Выбран случайный питомец с ID ${petId}`);
    }
    
    // Список возможных атрибутов для тренировки
    const attributes = ['strength', 'agility', 'intelligence', 'vitality', 'luck'];
    
    // Выбираем случайный атрибут
    const attribute = attributes[Math.floor(Math.random() * attributes.length)];
    
    console.log(`Тренировка атрибута ${attribute} для питомца с ID ${petId}`);
    return await testTrainPet(petId, attribute);
  };
  
  // Функция для отправки случайного питомца на поиск
  const sendRandomPetForaging = async () => {
    // Выбираем случайного питомца из доступных
    const userPets = getUserPetsFromState();
    if (!userPets || userPets.length === 0) {
      console.error('У пользователя нет питомцев');
      return null;
    }
    
    const petId = userPets[Math.floor(Math.random() * userPets.length)].id;
    
    // Список возможных локаций для поиска
    const locations = [
      'forest', 'mountains', 'lake', 'cave', 
      'valley', 'ruins', 'ancient_temple', 'spirit_field'
    ];
    
    // Выбираем случайную локацию
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    console.log(`Отправка питомца с ID ${petId} на поиск в локацию ${location}`);
    return await testSendPetForaging(petId, location);
  };
  
  // Функция для тестирования синхронизации духовных питомцев
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события pet-types-changed...');
    window.dispatchEvent(new CustomEvent('pet-types-changed'));
    console.log('Генерация события user-pets-changed...');
    window.dispatchEvent(new CustomEvent('user-pets-changed'));
    console.log('События отправлены. Компонент SpiritPetSynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  spiritPetDebugTools = {
    getPetTypes: getPetTypesFromState,
    getUserPets: getUserPetsFromState,
    displayPetTypes,
    displayPetTypeDetails,
    displayUserPets,
    displayPetDetails,
    testGetAllPetTypes,
    testGetPetTypeById,
    testGetUserPets,
    testGetUserPetById,
    testRenamePet,
    testTrainPet,
    testSendPetForaging,
    testFeedPet,
    testLearnPetSkill,
    testGetConstants,
    trainRandomAttribute,
    sendRandomPetForaging,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.spiritPetDebug = spiritPetDebugTools;
  console.log('Инструменты отладки духовных питомцев инициализированы. Используйте window.spiritPetDebug для доступа.');
  console.log('Доступные методы:', Object.keys(spiritPetDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default spiritPetDebugTools;