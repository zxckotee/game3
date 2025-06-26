/**
 * Отладочные инструменты для работы с сектами
 */

// Глобальные переменные для доступа из консоли
let sectDebugTools = {};

/**
 * Инициализирует инструменты отладки сект в глобальном пространстве
 */
export function initSectDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки сект...');
  
  // Функция для получения текущей секты из Redux-состояния
  const getCurrentSect = () => {
    if (!window.__GAME_STATE__?.sect?.data) {
      console.error('Данные о секте не найдены в состоянии игры');
      return null;
    }
    return window.__GAME_STATE__.sect.data;
  };
  
  // Функция для отображения секты в консоли
  const displaySect = (sect = null) => {
    const sectData = sect || getCurrentSect();
    if (!sectData) return null;
    
    console.log('Текущая секта:');
    console.table({
      id: sectData.id,
      name: sectData.name,
      rank: sectData.rank,
      level: sectData.level,
      experience: sectData.experience,
      requiredExperience: sectData.requiredExperience,
      influence: sectData.influence,
      resources: sectData.resources,
      territories: sectData.territories
    });
    
    // Вывод бонусов секты
    if (sectData.benefits && sectData.benefits.length > 0) {
      console.group('Бонусы секты:');
      console.table(sectData.benefits);
      console.groupEnd();
    }
    
    // Вывод членов секты
    if (sectData.members && sectData.members.length > 0) {
      console.group('Члены секты:');
      console.table(sectData.members.map(member => ({
        id: member.id,
        name: member.name,
        role: member.role,
        cultivationLevel: member.cultivationLevel,
        level: member.level,
        experience: member.experience,
        loyalty: member.loyalty
      })));
      console.groupEnd();
    }
    
    return sectData;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение секты по ID
  const testGetSectById = async (sectId) => {
    if (!sectId) {
      console.error('Необходимо указать ID секты');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/sects/${sectId}...`);
      const response = await fetch(`/api/sects/${sectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const sect = await response.json();
      console.log(`Получена секта с ID ${sectId}:`, sect);
      return sect;
    } catch (error) {
      console.error(`Ошибка при получении секты с ID ${sectId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение секты пользователя
  const testGetUserSect = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/sect...`);
      const response = await fetch(`/api/users/${userId}/sect`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.log('Пользователь не состоит в секте');
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const sect = await response.json();
      console.log('Получена секта пользователя:', sect);
      return sect;
    } catch (error) {
      console.error('Ошибка при получении секты пользователя:', error);
      return null;
    }
  };
  
  // Функция для тестирования создания секты
  const testCreateSect = async (sectName) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!sectName) {
      console.error('Необходимо указать название секты');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/sects...`);
      console.log(`Создание секты "${sectName}" для пользователя ${userId}`);
      
      const response = await fetch(`/api/sects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId,
          name: sectName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const sect = await response.json();
      console.log(`Секта "${sectName}" успешно создана:`, sect);
      return sect;
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      return null;
    }
  };
  
  // Функция для тестирования присоединения к секте
  const testJoinSect = async (sectId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!sectId) {
      console.error('Необходимо указать ID секты');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/sects/${sectId}/members...`);
      console.log(`Присоединение пользователя ${userId} к секте ${sectId}`);
      
      const response = await fetch(`/api/sects/${sectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const sectMember = await response.json();
      console.log(`Пользователь успешно присоединился к секте:`, sectMember);
      return sectMember;
    } catch (error) {
      console.error('Ошибка при присоединении к секте:', error);
      return null;
    }
  };
  
  // Функция для тестирования внесения вклада в секту
  const testContributeToSect = async (sectId, energyAmount) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!sectId) {
      console.error('Необходимо указать ID секты');
      return null;
    }
    
    if (!energyAmount || energyAmount <= 0) {
      console.error('Необходимо указать положительное количество энергии');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/sects/${sectId}/contribute...`);
      console.log(`Внесение ${energyAmount} единиц энергии в секту ${sectId}`);
      
      const response = await fetch(`/api/sects/${sectId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId,
          energyAmount
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Вклад успешно внесен:`, result);
      return result;
    } catch (error) {
      console.error('Ошибка при внесении вклада в секту:', error);
      return null;
    }
  };
  
  // Функция для тестирования тренировки с членом секты
  const testTrainWithMember = async (memberId, duration) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!memberId) {
      console.error('Необходимо указать ID члена секты');
      return null;
    }
    
    if (!duration || duration <= 0) {
      console.error('Необходимо указать положительную продолжительность тренировки');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/sects/members/${memberId}/train...`);
      console.log(`Тренировка с членом секты ${memberId} в течение ${duration} минут`);
      
      const response = await fetch(`/api/sects/members/${memberId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId,
          duration
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Тренировка успешно завершена:`, result);
      return result;
    } catch (error) {
      console.error('Ошибка при тренировке с членом секты:', error);
      return null;
    }
  };
  
  // Функция для тестирования получения бонусов от секты
  const testGetSectBenefits = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/sect/benefits...`);
      
      const response = await fetch(`/api/users/${userId}/sect/benefits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const benefits = await response.json();
      console.log(`Получены бонусы от секты:`, benefits);
      return benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов от секты:', error);
      return null;
    }
  };
  
  // Функция для тестирования получения ранга пользователя в секте
  const testGetUserSectRank = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/sect/rank...`);
      
      const response = await fetch(`/api/users/${userId}/sect/rank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const rank = await response.json();
      console.log(`Получен ранг пользователя в секте:`, rank);
      return rank;
    } catch (error) {
      console.error('Ошибка при получении ранга пользователя в секте:', error);
      return null;
    }
  };
  
  // Функция для тестирования выхода из секты
  const testLeaveSect = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/sect/leave...`);
      
      const response = await fetch(`/api/users/${userId}/sect/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Пользователь успешно вышел из секты:`, result);
      return result;
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      return null;
    }
  };
  
  // Функция для тестирования создания демо-секты
  const createDemoSect = async () => {
    // Создаем демо-секту с названием из традиционных восточных сект
    const sectNames = [
      'Секта Пурпурного Облака',
      'Секта Восходящего Солнца',
      'Секта Нефритового Лотоса',
      'Секта Бессмертного Меча',
      'Секта Лазурного Пика',
      'Секта Небесного Огня',
      'Секта Духовного Тумана',
      'Секта Звездной Реки'
    ];
    
    const randomName = sectNames[Math.floor(Math.random() * sectNames.length)];
    return await testCreateSect(randomName);
  };
  
  // Функция для тестирования внесения случайного вклада в секту
  const contributeRandomly = async () => {
    const sect = getCurrentSect();
    if (!sect) {
      console.error('Пользователь не состоит в секте');
      
      // Предложим создать секту
      const shouldCreate = confirm('Вы не состоите в секте. Создать новую секту?');
      if (shouldCreate) {
        const newSect = await createDemoSect();
        if (!newSect) return null;
        
        // Обновляем информацию о секте
        const updatedSect = await testGetUserSect();
        if (!updatedSect) return null;
        
        // Теперь можем внести вклад
        const energy = Math.floor(Math.random() * 20) + 10; // 10-30 единиц энергии
        return await testContributeToSect(updatedSect.id, energy);
      }
      
      return null;
    }
    
    // Случайное количество энергии для вклада
    const energy = Math.floor(Math.random() * 20) + 10; // 10-30 единиц энергии
    return await testContributeToSect(sect.id, energy);
  };
  
  // Функция для тренировки с случайным членом секты
  const trainWithRandomMember = async () => {
    const sect = getCurrentSect();
    if (!sect || !sect.members || sect.members.length === 0) {
      console.error('Секта не найдена или в ней нет членов');
      return null;
    }
    
    // Исключаем пользователя из списка членов для тренировки
    const userId = getCurrentUserId();
    const otherMembers = sect.members.filter(member => member.userId !== userId);
    
    if (otherMembers.length === 0) {
      console.error('В секте нет других членов для тренировки');
      return null;
    }
    
    // Выбираем случайного члена для тренировки
    const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];
    
    // Случайная продолжительность тренировки
    const duration = Math.floor(Math.random() * 30) + 15; // 15-45 минут
    
    return await testTrainWithMember(randomMember.id, duration);
  };
  
  // Функция для тестирования синхронизации секты
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события sect-changed...');
    window.dispatchEvent(new CustomEvent('sect-changed'));
    console.log('Событие отправлено. Компонент SectSynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  sectDebugTools = {
    getSect: getCurrentSect,
    displaySect,
    testGetSectById,
    testGetUserSect,
    testCreateSect,
    testJoinSect,
    testContributeToSect,
    testTrainWithMember,
    testGetSectBenefits,
    testGetUserSectRank,
    testLeaveSect,
    createDemoSect,
    contributeRandomly,
    trainWithRandomMember,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.sectDebug = sectDebugTools;
  console.log('Инструменты отладки сект инициализированы. Используйте window.sectDebug для доступа.');
  console.log('Доступные методы:', Object.keys(sectDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default sectDebugTools;