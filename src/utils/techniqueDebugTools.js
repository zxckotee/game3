/**
 * Отладочные инструменты для работы с техниками
 */

// Глобальные переменные для доступа из консоли
let techniqueDebugTools = {};

/**
 * Инициализирует инструменты отладки техник в глобальном пространстве
 */
export function initTechniqueDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки техник...');
  
  // Функция для получения текущих изученных техник из Redux-состояния
  const getLearnedTechniques = () => {
    if (!window.__GAME_STATE__?.player?.techniques) {
      console.error('Данные о техниках не найдены в состоянии игры');
      return null;
    }
    return window.__GAME_STATE__.player.techniques;
  };
  
  // Функция для отображения техник в консоли
  const displayTechniques = (techniques = null) => {
    const techniquesData = techniques || getLearnedTechniques();
    if (!techniquesData) return null;
    
    console.log('Текущие изученные техники:');
    console.table(techniquesData.map(technique => ({
      id: technique.id,
      name: technique.name,
      level: technique.level,
      type: technique.type,
      damage: technique.damage,
      energyCost: technique.energyCost
    })));
    
    return techniquesData;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение всех техник
  const testGetAllTechniques = async () => {
    try {
      console.log('Запрос GET /api/techniques...');
      const response = await fetch('/api/techniques', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const techniques = await response.json();
      console.log('Получены техники с сервера:', techniques);
      return techniques;
    } catch (error) {
      console.error('Ошибка при получении техник:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение техники по ID
  const testGetTechniqueById = async (techniqueId) => {
    if (!techniqueId) {
      console.error('Необходимо указать ID техники');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/techniques/${techniqueId}...`);
      const response = await fetch(`/api/techniques/${techniqueId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const technique = await response.json();
      console.log(`Получена техника с ID ${techniqueId}:`, technique);
      return technique;
    } catch (error) {
      console.error(`Ошибка при получении техники с ID ${techniqueId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение техники по названию
  const testGetTechniqueByName = async (techniqueName) => {
    if (!techniqueName) {
      console.error('Необходимо указать название техники');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/techniques/by-name/${encodeURIComponent(techniqueName)}...`);
      const response = await fetch(`/api/techniques/by-name/${encodeURIComponent(techniqueName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const technique = await response.json();
      console.log(`Получена техника с названием "${techniqueName}":`, technique);
      return technique;
    } catch (error) {
      console.error(`Ошибка при получении техники с названием "${techniqueName}":`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение изученных техник
  const testGetLearnedTechniques = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/techniques...`);
      const response = await fetch(`/api/users/${userId}/techniques`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const techniques = await response.json();
      console.log('Получены изученные техники с сервера:', techniques);
      return techniques;
    } catch (error) {
      console.error('Ошибка при получении изученных техник:', error);
      return null;
    }
  };
  
  // Функция для тестирования изучения новой техники
  const testLearnTechnique = async (techniqueId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!techniqueId) {
      console.error('Необходимо указать ID техники');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/techniques/${techniqueId}...`);
      const response = await fetch(`/api/users/${userId}/techniques/${techniqueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const technique = await response.json();
      console.log(`Техника с ID ${techniqueId} успешно изучена:`, technique);
      return technique;
    } catch (error) {
      console.error(`Ошибка при изучении техники с ID ${techniqueId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования повышения уровня техники
  const testUpgradeTechnique = async (techniqueId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!techniqueId) {
      console.error('Необходимо указать ID техники');
      return null;
    }
    
    try {
      console.log(`Запрос PUT /api/users/${userId}/techniques/${techniqueId}/upgrade...`);
      const response = await fetch(`/api/users/${userId}/techniques/${techniqueId}/upgrade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const technique = await response.json();
      console.log(`Техника с ID ${techniqueId} успешно улучшена:`, technique);
      return technique;
    } catch (error) {
      console.error(`Ошибка при улучшении техники с ID ${techniqueId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования использования техники
  const testUseTechnique = async (techniqueId) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!techniqueId) {
      console.error('Необходимо указать ID техники');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/techniques/${techniqueId}/use...`);
      const response = await fetch(`/api/users/${userId}/techniques/${techniqueId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Техника с ID ${techniqueId} успешно использована:`, result);
      return result;
    } catch (error) {
      console.error(`Ошибка при использовании техники с ID ${techniqueId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования изучения случайной техники
  const learnRandomTechnique = async () => {
    try {
      // Получаем все техники
      const allTechniques = await testGetAllTechniques();
      if (!allTechniques || allTechniques.length === 0) {
        console.error('Не удалось получить список техник');
        return null;
      }
      
      // Получаем изученные техники
      const learnedTechniques = await testGetLearnedTechniques();
      if (!learnedTechniques) {
        console.error('Не удалось получить список изученных техник');
        return null;
      }
      
      // Находим техники, которые еще не изучены
      const learnedTechniqueIds = learnedTechniques.map(t => t.id);
      const availableTechniques = allTechniques.filter(t => !learnedTechniqueIds.includes(t.id));
      
      if (availableTechniques.length === 0) {
        console.log('Все техники уже изучены');
        return null;
      }
      
      // Выбираем случайную технику
      const randomIndex = Math.floor(Math.random() * availableTechniques.length);
      const techniqueToLearn = availableTechniques[randomIndex];
      
      // Изучаем технику
      return await testLearnTechnique(techniqueToLearn.id);
    } catch (error) {
      console.error('Ошибка при изучении случайной техники:', error);
      return null;
    }
  };
  
  // Функция для тестирования повышения уровня всех техник
  const upgradeAllTechniques = async () => {
    try {
      // Получаем изученные техники
      const learnedTechniques = await testGetLearnedTechniques();
      if (!learnedTechniques || learnedTechniques.length === 0) {
        console.error('Не удалось получить список изученных техник или список пуст');
        return null;
      }
      
      // Повышаем уровень каждой техники
      const upgradedTechniques = [];
      for (const technique of learnedTechniques) {
        console.log(`Повышение уровня техники ${technique.name} (ID: ${technique.id})...`);
        const upgradedTechnique = await testUpgradeTechnique(technique.id);
        if (upgradedTechnique) {
          upgradedTechniques.push(upgradedTechnique);
        }
      }
      
      console.log(`Улучшено ${upgradedTechniques.length} техник`);
      return upgradedTechniques;
    } catch (error) {
      console.error('Ошибка при повышении уровня всех техник:', error);
      return null;
    }
  };
  
  // Функция для тестирования синхронизации техник
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события technique-changed...');
    window.dispatchEvent(new CustomEvent('technique-changed'));
    console.log('Событие отправлено. Компонент TechniqueSynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  techniqueDebugTools = {
    getLearnedTechniques,
    displayTechniques,
    testGetAllTechniques,
    testGetTechniqueById,
    testGetTechniqueByName,
    testGetLearnedTechniques,
    testLearnTechnique,
    testUpgradeTechnique,
    testUseTechnique,
    learnRandomTechnique,
    upgradeAllTechniques,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.techniqueDebug = techniqueDebugTools;
  console.log('Инструменты отладки техник инициализированы. Используйте window.techniqueDebug для доступа.');
  console.log('Доступные методы:', Object.keys(techniqueDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default techniqueDebugTools;