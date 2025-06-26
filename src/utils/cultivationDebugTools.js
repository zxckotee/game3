/**
 * Отладочные инструменты для работы с системой культивации
 */

// Глобальные переменные для доступа из консоли
let cultivationDebugTools = {};

/**
 * Инициализирует инструменты отладки культивации в глобальном пространстве
 */
export function initCultivationDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки культивации...');
  
  // Функция для получения текущих данных культивации из Redux-состояния
  const getCurrentCultivation = () => {
    if (!window.__GAME_STATE__?.player?.cultivation) {
      console.error('Данные культивации не найдены в состоянии игры');
      return null;
    }
    return window.__GAME_STATE__.player.cultivation;
  };
  
  // Функция для отображения данных культивации в консоли
  const displayCultivation = (cultivation = null) => {
    const cultivationData = cultivation || getCurrentCultivation();
    if (!cultivationData) return null;
    
    console.log('Текущие данные культивации:');
    console.table({
      realm: cultivationData.realm,
      level: cultivationData.level,
      experience: `${cultivationData.experience}/${cultivationData.experienceToNextLevel}`,
      energy: `${cultivationData.energy}/${cultivationData.maxEnergy}`,
      bottleneck: cultivationData.bottleneck ? `${cultivationData.bottleneckProgress}/${cultivationData.bottleneckThreshold}` : 'Нет',
      insights: cultivationData.insights || 0,
      tribulations: cultivationData.completedTribulations || 0
    });
    
    // Вывод дополнительной информации
    if (cultivationData.attributes) {
      console.group('Атрибуты культивации:');
      console.table(cultivationData.attributes);
      console.groupEnd();
    }
    
    if (cultivationData.techniques && cultivationData.techniques.length > 0) {
      console.group('Изученные техники:');
      console.table(cultivationData.techniques.map(t => ({
        name: t.name,
        level: t.level,
        mastery: t.masteryLevel
      })));
      console.groupEnd();
    }
    
    return cultivationData;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение данных о культивации
  const testGetCultivation = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/cultivation/${userId}...`);
      const response = await fetch(`/api/cultivation/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const cultivation = await response.json();
      console.log('Получены данные о культивации с сервера:', cultivation);
      return cultivation;
    } catch (error) {
      console.error('Ошибка при получении данных о культивации:', error);
      return null;
    }
  };
  
  // Функция для тестирования обновления данных о культивации через API
  const testUpdateCultivation = async (updates) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!updates || typeof updates !== 'object') {
      console.error('Необходимо указать объект с данными для обновления');
      return null;
    }
    
    try {
      console.log(`Запрос PUT /api/cultivation/${userId}...`);
      console.log('Данные для обновления:', updates);
      
      const response = await fetch(`/api/cultivation/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const cultivation = await response.json();
      console.log('Обновленные данные о культивации:', cultivation);
      return cultivation;
    } catch (error) {
      console.error('Ошибка при обновлении данных о культивации:', error);
      return null;
    }
  };
  
  // Функция для тестирования проверки возможности прорыва
  const testCheckBreakthrough = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/cultivation/${userId}/breakthrough-check...`);
      const response = await fetch(`/api/cultivation/${userId}/breakthrough-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат проверки возможности прорыва:', result);
      return result;
    } catch (error) {
      console.error('Ошибка при проверке возможности прорыва:', error);
      return null;
    }
  };
  
  // Функция для тестирования завершения трибуляции
  const testCompleteTribulation = async (success = true, data = {}) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/cultivation/${userId}/complete-tribulation...`);
      const tribulationResult = {
        success,
        ...data
      };
      
      console.log('Данные о результате трибуляции:', tribulationResult);
      
      const response = await fetch(`/api/cultivation/${userId}/complete-tribulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(tribulationResult)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат завершения трибуляции:', result);
      return result;
    } catch (error) {
      console.error('Ошибка при завершении трибуляции:', error);
      return null;
    }
  };
  
  // Функция для тестирования увеличения прогресса "бутылочного горлышка"
  const testIncreaseBottleneckProgress = async (amount = 10) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/cultivation/${userId}/bottleneck-progress...`);
      const response = await fetch(`/api/cultivation/${userId}/bottleneck-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат увеличения прогресса:', result);
      
      // Обновляем состояние Redux после успешного запроса
      if (result.success && window.__GAME_STATE__ && window.__GAME_DISPATCH__) {
        // Определяем поля прогресса в зависимости от структуры ответа
        const bottleneckProgress = result.bottleneckProgress || result.currentProgress;
        const requiredProgress = result.requiredBottleneckProgress || result.requiredProgress;
        
        console.log('Обновляем Redux-состояние bottleneckProgress:', bottleneckProgress);
        
        // 1. Диспетчеризируем действие для обновления Redux
        window.__GAME_DISPATCH__({
          type: 'UPDATE_CULTIVATION',
          payload: {
            bottleneckProgress: bottleneckProgress,
            requiredBottleneckProgress: requiredProgress
          }
        });
        
        // 2. Отправляем событие с детальными данными для CultivationSynchronizer
        console.log('Отправляем событие cultivation-changed с данными прогресса:', bottleneckProgress);
        window.dispatchEvent(new CustomEvent('cultivation-changed', {
          detail: {
            bottleneckProgress: bottleneckProgress,
            requiredBottleneckProgress: requiredProgress,
            // Добавляем дополнительные поля для обратной совместимости
            currentProgress: bottleneckProgress,
            requiredProgress: requiredProgress
          }
        }));
        
        // 3. Проверка обновления Redux состояния через небольшую задержку
        setTimeout(() => {
          const currentState = window.__GAME_STATE__?.player?.cultivation;
          console.log('TestIncreaseBottleneckProgress: текущее значение в Redux =',
            currentState?.bottleneckProgress);
        }, 100);
      } else {
        console.warn('Не удалось обновить Redux-состояние:', {
          success: result.success,
          hasDispatch: Boolean(window.__GAME_DISPATCH__),
          hasState: Boolean(window.__GAME_STATE__)
        });
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при увеличении прогресса:', error);
      return null;
    }
  };
  
  // Функция для тестирования получения озарения
  const testGainInsight = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/cultivation/${userId}/gain-insight...`);
      const response = await fetch(`/api/cultivation/${userId}/gain-insight`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат получения озарения:', result);
      return result;
    } catch (error) {
      console.error('Ошибка при получении озарения:', error);
      return null;
    }
  };
  
  // Функция для повышения уровня культивации для отладки
  const increaseCultivationLevel = async (levels = 1) => {
    const currentCultivation = getCurrentCultivation();
    if (!currentCultivation) return null;
    
    const updates = {
      level: currentCultivation.level + levels,
      experience: 0,
      experienceToNextLevel: currentCultivation.experienceToNextLevel * (1 + 0.2 * levels)
    };
    
    // Используем API для обновления
    return await testUpdateCultivation(updates);
  };
  
  // Функция для тестирования синхронизации культивации
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события cultivation-changed...');
    window.dispatchEvent(new CustomEvent('cultivation-changed'));
    console.log('Событие отправлено. Компонент CultivationSynchronizer должен обновить данные.');
  };
  
  // Функция для ручного обновления прогресса в Redux без запроса к API
  const updateBottleneckProgressManually = (progress) => {
    // Проверяем наличие глобального менеджера культивации
    if (window.cultivationManager && typeof window.cultivationManager.increaseBottleneckProgress === 'function') {
      console.log('Вызываем метод increaseBottleneckProgress в CultivationManager напрямую');
      
      // Асинхронно вызываем метод менеджера для увеличения прогресса
      window.cultivationManager.increaseBottleneckProgress(progress)
        .then(result => {
          console.log('Результат обновления прогресса через менеджер:', result);
        })
        .catch(error => {
          console.error('Ошибка при вызове менеджера культивации:', error);
        });
        
      return true;
    }
    // Если менеджер недоступен, используем напрямую Redux
    else if (window.__GAME_DISPATCH__) {
      console.log('CultivationManager недоступен. Вручную обновляем прогресс через Redux:', progress);
      
      // 1. Обновление Redux-состояния
      window.__GAME_DISPATCH__({
        type: 'UPDATE_CULTIVATION',
        payload: {
          bottleneckProgress: progress
        }
      });
      
      // 2. Создаем событие для уведомления компонентов интерфейса
      window.dispatchEvent(new CustomEvent('cultivation-changed', {
        detail: {
          bottleneckProgress: progress,
          requiredBottleneckProgress: window.__GAME_STATE__?.player?.cultivation?.requiredBottleneckProgress || 100
        }
      }));
      
      // 3. Добавляем уведомление о прогрессе
      window.__GAME_DISPATCH__({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now(),
          type: 'success',
          message: `Вы продвинулись в преодолении "бутылочного горлышка" (+${progress})`,
          duration: 3000
        }
      });
      
      // Проверяем, обновилось ли состояние
      setTimeout(() => {
        const currentState = window.__GAME_STATE__?.player?.cultivation;
        console.log('Текущее значение bottleneckProgress в Redux:',
          currentState ? currentState.bottleneckProgress : 'недоступно');
      }, 100);
      
      return true;
    } else {
      console.error('Ни CultivationManager, ни Redux dispatch недоступны');
      return false;
    }
  };

  // Создаем объект с функциями отладки
  cultivationDebugTools = {
    getCultivation: getCurrentCultivation,
    displayCultivation,
    testGetCultivation,
    testUpdateCultivation,
    testCheckBreakthrough,
    testCompleteTribulation,
    testIncreaseBottleneckProgress,
    testGainInsight,
    increaseCultivationLevel,
    testSynchronization,
    updateBottleneckProgressManually
  };
  
  // Экспортируем функции в глобальное пространство
  window.cultivationDebug = cultivationDebugTools;
  console.log('Инструменты отладки культивации инициализированы. Используйте window.cultivationDebug для доступа.');
  console.log('Доступные методы:', Object.keys(cultivationDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default cultivationDebugTools;