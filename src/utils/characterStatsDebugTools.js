/**
 * Отладочные инструменты для работы с характеристиками персонажа
 */

// Глобальные переменные для доступа из консоли
let characterStatsDebugTools = {};

/**
 * Инициализирует инструменты отладки характеристик в глобальном пространстве
 */
export function initCharacterStatsDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки характеристик персонажа...');
  
  // Функция для получения характеристик из локального хранилища CharacterStatsManager
  const getCharacterStatsFromManager = () => {
    if (!window.characterStatsManager) {
      console.error('CharacterStatsManager не инициализирован');
      return null;
    }
    return window.characterStatsManager.getStats();
  };
  
  // Функция для отображения характеристик персонажа в консоли
  const displayCharacterStats = (stats = null) => {
    const characterStats = stats || getCharacterStatsFromManager();
    
    if (!characterStats) {
      console.log('Характеристики персонажа не найдены');
      return null;
    }
    
    console.log('Характеристики персонажа:');
    console.group('Основные характеристики:');
    
    console.log(`Сила: ${characterStats.strength || 0}`);
    console.log(`Ловкость: ${characterStats.agility || 0}`);
    console.log(`Здоровье: ${characterStats.health || 0}`);
    console.log(`Интеллект: ${characterStats.intellect || 0}`);
    console.log(`Дух: ${characterStats.spirit || 0}`);
    
    console.groupEnd();
    
    // Если есть вторичные характеристики, выводим их
    if (characterStats.secondaryStats) {
      console.group('Вторичные характеристики:');
      
      const secondary = characterStats.secondaryStats;
      console.log(`Физическая атака: ${secondary.physicalAttack || 0}`);
      console.log(`Физическая защита: ${secondary.physicalDefense || 0}`);
      console.log(`Духовная защита: ${secondary.spiritualDefense || 0}`);
      console.log(`Скорость атаки: ${secondary.attackSpeed || 0}`);
      console.log(`Шанс критического удара: ${secondary.criticalChance || 0}%`);
      console.log(`Скорость передвижения: ${secondary.movementSpeed || 0}`);
      console.log(`Удача: ${secondary.luck || 0}`);
      
      console.groupEnd();
    }
    
    return characterStats;
  };
  
  // Функция для обновления характеристик персонажа
  const updateCharacterStat = async (statName, value) => {
    if (!window.characterStatsManager) {
      console.error('CharacterStatsManager не инициализирован');
      return null;
    }
    
    const currentStats = getCharacterStatsFromManager();
    
    if (!currentStats) {
      console.error('Характеристики персонажа не найдены');
      return null;
    }
    
    // Проверяем, что статистика существует
    if (!(statName in currentStats)) {
      console.error(`Характеристика '${statName}' не найдена`);
      return null;
    }
    
    // Создаем обновленные характеристики
    const updatedStats = {
      ...currentStats,
      [statName]: parseInt(value, 10)
    };
    
    console.log(`Обновление характеристики ${statName} с ${currentStats[statName]} на ${value}`);
    
    try {
      // Обновляем характеристики через менеджер
      const result = await window.characterStatsManager.updateStats(updatedStats);
      
      if (result.success) {
        console.log(`Характеристика ${statName} успешно обновлена`);
        return result.stats;
      } else {
        console.error(`Ошибка при обновлении характеристики: ${result.message}`);
        return null;
      }
    } catch (error) {
      console.error('Ошибка при обновлении характеристики:', error);
      return null;
    }
  };
  
  // Функция для расчета вторичных характеристик
  const calculateSecondaryStats = (cultivation = null) => {
    if (!window.characterStatsManager) {
      console.error('CharacterStatsManager не инициализирован');
      return null;
    }
    
    const currentStats = getCharacterStatsFromManager();
    
    if (!currentStats) {
      console.error('Характеристики персонажа не найдены');
      return null;
    }
    
    // Если культивация не указана, пытаемся получить ее из глобального менеджера
    let cultivationData = cultivation;
    if (!cultivationData && window.cultivationManager) {
      cultivationData = window.cultivationManager.getCultivation();
    }
    
    if (!cultivationData) {
      console.warn('Данные о культивации не найдены, используем значения по умолчанию');
      cultivationData = {
        stage: 'закалка тела',
        level: 1
      };
    }
    
    // Рассчитываем вторичные характеристики
    const secondaryStats = window.characterStatsManager.calculateSecondaryStats(
      currentStats,
      cultivationData
    );
    
    console.log('Расчет вторичных характеристик:');
    console.group('Базовые характеристики:');
    console.log(`Сила: ${currentStats.strength || 0}`);
    console.log(`Ловкость: ${currentStats.agility || 0}`);
    console.log(`Здоровье: ${currentStats.health || 0}`);
    console.log(`Интеллект: ${currentStats.intellect || 0}`);
    console.log(`Дух: ${currentStats.spirit || 0}`);
    console.groupEnd();
    
    console.group('Культивация:');
    console.log(`Стадия: ${cultivationData.stage}`);
    console.log(`Уровень: ${cultivationData.level}`);
    console.groupEnd();
    
    console.group('Вторичные характеристики:');
    console.log(`Физическая атака: ${secondaryStats.physicalAttack || 0}`);
    console.log(`Физическая защита: ${secondaryStats.physicalDefense || 0}`);
    console.log(`Духовная защита: ${secondaryStats.spiritualDefense || 0}`);
    console.log(`Скорость атаки: ${secondaryStats.attackSpeed || 0}`);
    console.log(`Шанс критического удара: ${secondaryStats.criticalChance || 0}%`);
    console.log(`Скорость передвижения: ${secondaryStats.movementSpeed || 0}`);
    console.log(`Удача: ${secondaryStats.luck || 0}`);
    console.groupEnd();
    
    return secondaryStats;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Безопасное извлечение ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      }
      return null;
    } catch (err) {
      console.error('Ошибка при получении ID пользователя из токена:', err);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение характеристик персонажа
  const testGetCharacterStats = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/stats...`);
      const response = await fetch(`/api/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const stats = await response.json();
      console.log('Получены характеристики персонажа:', stats);
      return stats;
    } catch (error) {
      console.error('Ошибка при получении характеристик персонажа:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на обновление характеристик персонажа
  const testUpdateCharacterStats = async (updatedStats) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос PUT /api/users/${userId}/stats...`);
      const response = await fetch(`/api/users/${userId}/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updatedStats)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат обновления характеристик персонажа:', result);
      
      // Обновляем характеристики в UI
      window.dispatchEvent(new CustomEvent('character-stats-changed'));
      
      return result;
    } catch (error) {
      console.error('Ошибка при обновлении характеристик персонажа:', error);
      return null;
    }
  };
  
  // Функция для тестирования синхронизации характеристик
  const testSynchronization = () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события character-stats-changed...');
    window.dispatchEvent(new CustomEvent('character-stats-changed'));
    console.log('Событие отправлено. Компонент CharacterStatsSynchronizer должен обновить данные.');
  };
  
  // Функция для увеличения всех характеристик персонажа на указанное значение
  const increasAllStats = async (amount = 1) => {
    if (!window.characterStatsManager) {
      console.error('CharacterStatsManager не инициализирован');
      return null;
    }
    
    const currentStats = getCharacterStatsFromManager();
    
    if (!currentStats) {
      console.error('Характеристики персонажа не найдены');
      return null;
    }
    
    // Увеличиваем все базовые характеристики
    const updatedStats = {
      ...currentStats,
      strength: (currentStats.strength || 0) + amount,
      agility: (currentStats.agility || 0) + amount,
      health: (currentStats.health || 0) + amount,
      intellect: (currentStats.intellect || 0) + amount,
      spirit: (currentStats.spirit || 0) + amount
    };
    
    console.log(`Увеличение всех характеристик на ${amount}`);
    
    try {
      // Обновляем характеристики через менеджер
      const result = await window.characterStatsManager.updateStats(updatedStats);
      
      if (result.success) {
        console.log('Характеристики успешно обновлены');
        return result.stats;
      } else {
        console.error(`Ошибка при обновлении характеристик: ${result.message}`);
        return null;
      }
    } catch (error) {
      console.error('Ошибка при обновлении характеристик:', error);
      return null;
    }
  };
  
  // Создаем объект с функциями отладки
  characterStatsDebugTools = {
    getCharacterStats: getCharacterStatsFromManager,
    displayCharacterStats,
    updateCharacterStat,
    calculateSecondaryStats,
    testGetCharacterStats,
    testUpdateCharacterStats,
    testSynchronization,
    increasAllStats
  };
  
  // Экспортируем функции в глобальное пространство
  window.characterStatsDebug = characterStatsDebugTools;
  console.log('Инструменты отладки характеристик персонажа инициализированы. Используйте window.characterStatsDebug для доступа.');
  console.log('Доступные методы:', Object.keys(characterStatsDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default characterStatsDebugTools;