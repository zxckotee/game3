/**
 * Утилиты отладки для игры "Путь к Бессмертию"
 * Содержит функции для доступа к важной игровой информации через консоль браузера
 */

import WeatherService from '../services/weather-service-adapter';
import './directConsoleCommands'; // Импортируем прямые консольные команды
import { initInventoryDebugTools } from './inventoryDebugTools'; // Импортируем инструменты отладки инвентаря
import { initCultivationDebugTools } from './cultivationDebugTools'; // Импортируем инструменты отладки культивации
import { initCharacterStatsDebugTools } from './characterStatsDebugTools'; // Импортируем инструменты отладки характеристик
import { initTechniqueDebugTools } from './techniqueDebugTools'; // Импортируем инструменты отладки техник
import { initSectDebugTools } from './sectDebugTools'; // Импортируем инструменты отладки сект
import { initResourceDebugTools } from './resourceDebugTools'; // Импортируем инструменты отладки ресурсов
import { initAlchemyDebugTools } from './alchemyDebugTools'; // Импортируем инструменты отладки алхимии
import { initSpiritPetDebugTools } from './spiritPetDebugTools'; // Импортируем инструменты отладки духовных питомцев
import { initMarketDebugTools } from './marketDebugTools'; // Импортируем инструменты отладки рынка

// Храним глобальную ссылку на состояние игры
let gameStateRef = null;

// Хранение ID интервала для периодического вывода состояния
let stateLoggingIntervalId = null;

/**
 * Инициализирует инструменты отладки и подключает их к состоянию игры
 * @param {Object} store - Redux store (если используется Redux)
 */
export function initDebugTools(store) {
  // Привязываем глобальные функции для добавления ресурсов
  if (typeof window !== 'undefined') {
    // Функция для добавления 1000 единиц каждой валюты
    window.add1000ToEverything = () => {
      try {
        // Получаем контекст игры
        const gameContext = window.__GAME_CONTEXT__ || window.gameContext;
        
        if (!gameContext || !gameContext.actions) {
          // Если не нашли контекст через глобальные переменные
          console.error('Не удалось найти игровой контекст. Используйте add1000Currency(), которая работает через прямой доступ.');
          // Пробуем использовать директ-функцию, если она есть
          if (typeof window.add1000Currency === 'function') {
            window.add1000Currency();
          }
          return false;
        }
        
        // Получаем текущие значения валют из состояния
        const currentCurrency = gameContext.state?.player?.inventory?.currency || {};
        
        // Добавляем 1000 единиц каждой валюты (используем аддитивный режим)
        const updatedCurrency = {
          copper: 1000,
          silver: 1000,
          gold: 1000,
          spiritStones: 1000
        };
        
        // Обновляем валюту в состоянии игры (true для аддитивного режима)
        gameContext.actions.updateCurrency(updatedCurrency, true);
        
        console.log('Добавлено по 1000 единиц каждой валюты!', updatedCurrency);
        return true;
      } catch (error) {
        console.error('Ошибка при добавлении валюты:', error);
        return false;
      }
    };
    
    // Синоним на русском
    window.добавить1000Всего = window.add1000ToEverything;
  }
  // Добавляем функцию для получения времени
  if (typeof window !== 'undefined') {
    // Глобальная функция для доступа к отладочной информации
    window.gameDebug = window.gameDebug || {};
    
    // Создаем WeatherService для использования в функциях отладки
    const weatherService = new WeatherService();
    
    // Регистрируем глобальную функцию для получения времени
    window.getGameTime = (customState = null) => {
      // Используем переданное состояние, или сохраненную ссылку, или пытаемся найти глобальное состояние
      const state = customState || gameStateRef || window.gameState || window.gameContext?.state;
      
      if (!state) {
        console.warn('Не удалось получить состояние игры. Возможно, страница еще не полностью загружена.');
        console.info('Попробуйте снова через несколько секунд или передайте состояние явно: getGameTime(yourStateObject)');
        return null;
      }
      
      // Извлекаем данные о времени из различных возможных мест в состоянии
      const weatherState = state.weather || {};
      const worldTime = state.world?.time || {};
      
      // Комбинируем данные из разных частей состояния
      const timeData = {
        hour: weatherState.hour || worldTime.hour || 12,
        minute: weatherState.minute || worldTime.minute || 0,
        dayCount: weatherState.dayCount || worldTime.day || 1,
        currentSeason: weatherState.currentSeason || worldTime.season || 'spring',
        seasonDay: weatherState.seasonDay || 1,
        isDayTime: weatherState.isDayTime !== undefined ? weatherState.isDayTime : true,
        nextWeatherChange: weatherState.nextWeatherChange,
        currentWeather: weatherState.currentWeather || 'clear'
      };
      
      // Вычисляем период суток, если его нет в состоянии
      if (!timeData.daytimePeriod) {
        timeData.daytimePeriod = weatherService._getDaytimePeriod(timeData.hour);
      }
      
      // Получаем имя периода суток
      timeData.daytimeName = weatherService.daytimeEffects?.[
        timeData.daytimePeriod
      ]?.name || 'Неизвестно';
      
      // Форматируем время
      timeData.formattedTime = `${timeData.hour.toString().padStart(2, '0')}:${timeData.minute.toString().padStart(2, '0')}`;
      
      // Выводим информацию в консоль
     /* console.group('🕒 Информация об игровом времени:');
      console.log(`Текущее время: ${timeData.formattedTime} (${timeData.daytimeName})`);
      console.log(`День: ${timeData.dayCount}, Сезон: ${timeData.currentSeason} (день ${timeData.seasonDay})`);
      console.log(`Период суток: ${timeData.daytimeName} (${timeData.daytimePeriod || '-'})`);
      console.log(`Световой день: ${timeData.isDayTime ? 'Да' : 'Нет'}`);
      
      if (timeData.activeEvent) {
        console.log(`Активное событие: ${timeData.activeEvent}, осталось ${timeData.eventRemainingTime} мин. игрового времени`);
      }
      
      console.log(`Следующая смена погоды через: ${timeData.nextWeatherChange} мин. игрового времени (${timeData.nextWeatherChange ? Math.ceil(timeData.nextWeatherChange / WeatherService.TIME_MULTIPLIER) : '-'} мин. реального времени)`);
      console.log(`Множитель времени: 1:${WeatherService.TIME_MULTIPLIER} (1 мин. реального времени = ${WeatherService.TIME_MULTIPLIER} мин. игрового времени)`);
      console.groupEnd();
      */
      return timeData;
    };
    
    // Алиас для getGameTime для совместимости
    window.gameDebug.getTime = window.getGameTime;
    
    /**
     * Функция для запуска периодического вывода состояния игры в консоль
     * @param {number} interval - Интервал вывода в миллисекундах (по умолчанию 3000 мс)
     * @returns {boolean} - true если запущено успешно, false если уже запущено
     */
    window.startStateLogging = (interval = 3000) => {
      // Проверяем, не запущен ли уже интервал
      if (stateLoggingIntervalId !== null) {
        console.warn('Логирование состояния уже запущено. Сначала остановите его с помощью window.stopStateLogging()');
        return false;
      }

      // Определяем функцию вывода состояния
      const logGameState = () => {
        try {
          // Расширенный способ получения состояния игры - проверяем несколько возможных источников
          const state = window.__GAME_STATE__ || 
                     gameStateRef || 
                     window.gameContext?.state || 
                     window.__GAME_CONTEXT__?.state;
          
          // Если стандартные методы не сработали, попробуем получить состояние через React DevTools
          if (!state && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            try {
              // Пытаемся получить доступ к фиберам React для извлечения состояния
              const reactInstance = Array.from(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.values())[0];
              if (reactInstance && reactInstance._currentFiber) {
                const gameContextFiber = reactInstance._currentFiber;
                
                // Ищем компонент GameContextProvider и его состояние
                let fiber = gameContextFiber;
                let maxIterations = 1000; // Защита от бесконечного цикла
                
                while (fiber && maxIterations > 0) {
                  if (fiber.type && 
                      ((typeof fiber.type === 'function' && fiber.type.name === 'GameContextProvider') ||
                       (typeof fiber.type === 'object' && fiber.type.displayName === 'GameContextProvider'))) {
                    
                    // Нашли нужный компонент, получаем его состояние
                    if (fiber.memoizedState && fiber.memoizedState.memoizedState) {
                      console.log('Найдено состояние через React DevTools');
                      return fiber.memoizedState.memoizedState;
                    }
                  }
                  
                  // Проверяем дочерние компоненты
                  if (fiber.child) {
                    fiber = fiber.child;
                  } else if (fiber.sibling) {
                    fiber = fiber.sibling;
                  } else {
                    // Переходим к следующему узлу вверх по дереву
                    let current = fiber;
                    fiber = fiber.return;
                    
                    while (fiber && !fiber.sibling && maxIterations > 0) {
                      fiber = fiber.return;
                      maxIterations--;
                    }
                    
                    if (fiber) {
                      fiber = fiber.sibling;
                    }
                  }
                  
                  maxIterations--;
                }
              }
            } catch (reactError) {
              console.debug('Не удалось получить состояние через React DevTools:', reactError);
            }
          }
          
          // Последняя попытка - попытаться найти через DOM
          if (!state && document.querySelector('[data-gamestate]')) {
            try {
              const gameStateAttribute = document.querySelector('[data-gamestate]').getAttribute('data-gamestate');
              if (gameStateAttribute) {
                return JSON.parse(gameStateAttribute);
              }
            } catch (domError) {
              console.debug('Не удалось получить состояние через DOM атрибуты:', domError);
            }
          }
          
          if (!state) {
            console.error('Не удалось получить состояние игры для логирования');
            console.info('Убедитесь, что страница полностью загружена и игра инициализирована');
            console.info('Можете попробовать выполнить window.getGameDebugInfo() для дополнительной информации');
            
            // Выводим дополнительную информацию для отладки
            console.group('Доступные глобальные объекты:');
            console.log('window.__GAME_STATE__:', Boolean(window.__GAME_STATE__));
            console.log('gameStateRef:', Boolean(gameStateRef));
            console.log('window.gameContext:', Boolean(window.gameContext));
            console.log('window.__GAME_CONTEXT__:', Boolean(window.__GAME_CONTEXT__));
            console.groupEnd();
            return;
          }
          
          // Выводим состояние в консоль с понятной структурой
          console.group('🎮 Состояние игры:');
          console.log('⏰ Время:', new Date().toLocaleTimeString());
          
          // Вывод данных игрока
          console.group('👤 Игрок:');
          console.log('Имя:', state.player?.name || 'Нет данных');
          console.log('Уровень:', state.player?.cultivation?.level || 'Нет данных');
          
          // Всегда берем здоровье и энергию из stats, так как теперь они там правильно определены
          const health = state.player?.stats?.health || 100;
          const maxHealth = state.player?.stats?.maxHealth || 100;
          console.log('Здоровье:', health + '/' + maxHealth);
          
          // Энергия также взята из stats
          const energy = state.player?.stats?.energy || 100;
          const maxEnergy = state.player?.stats?.maxEnergy || 100;
          console.log('Энергия:', energy + '/' + maxEnergy);
          
          // Показываем более подробную информацию о статус-эффектах
          if (state.player?.statusEffects) {
            if (Object.keys(state.player.statusEffects).length > 0) {
              console.group('Статус-эффекты:');
              Object.entries(state.player.statusEffects).forEach(([id, effect]) => {
                console.log(`- ${effect.name || id}: ${effect.description || 'Нет описания'}`);
              });
              console.groupEnd();
            } else {
              console.log('Статус-эффекты: Нет активных эффектов');
            }
          } else {
            console.log('Статус-эффекты: Нет данных');
          }
          console.groupEnd();
          
          // Вывод данных погоды и мира
          console.group('🌍 Игровой мир:');
          console.log('Локация:', state.world?.currentLocation?.name || 'Нет данных');
          console.log('Погода:', state.weather?.currentWeather || 'Нет данных');
          
          // Форматированное время с поддержкой разных источников данных
          const hour = state.weather?.hour || state.world?.time?.hour || 0;
          const minute = state.weather?.minute || state.world?.time?.minute || 0;
          console.log('Время:', `${hour}:${String(minute).padStart(2, '0')}`);
          
          // День и сезон могут быть в разных местах
          const day = state.weather?.dayCount || state.world?.time?.day || 1;
          const season = state.weather?.currentSeason || state.world?.time?.season || 'spring';
          console.log('День:', `${day} (сезон: ${season})`);
          
          // Детальная информация о погодных эффектах
          if (state.weather?.weatherEffects) {
            console.group('Погодные эффекты:');
            if (Array.isArray(state.weather.weatherEffects)) {
              if (state.weather.weatherEffects.length > 0) {
                state.weather.weatherEffects.forEach((effect, index) => {
                  console.log(`- Эффект ${index + 1}:`, effect);
                });
              } else {
                console.log('Нет активных погодных эффектов');
              }
            } else if (typeof state.weather.weatherEffects === 'object') {
              Object.entries(state.weather.weatherEffects).forEach(([key, value]) => {
                console.log(`- ${key}:`, value);
              });
            } else {
              console.log(state.weather.weatherEffects);
            }
            console.groupEnd();
          } else {
            console.log('Погодные эффекты: Нет данных');
          }
          console.groupEnd();
          
          // Полное состояние для отладки с возможностью фильтрации
          console.group('🔍 Полное состояние:');
          
          // Состояние игрока с выделением важных компонентов
          console.group('Игрок (state.player):');
          if (state.player) {
            // Выводим только ключевые свойства первого уровня для лучшей читаемости
            const playerKeys = Object.keys(state.player);
            playerKeys.forEach(key => {
              console.log(`- ${key}:`, state.player[key]);
            });
          } else {
            console.log('Нет данных');
          }
          console.groupEnd();
          
          // Состояние мира
          console.group('Мир (state.world):');
          if (state.world) {
            Object.keys(state.world).forEach(key => {
              console.log(`- ${key}:`, state.world[key]);
            });
          } else {
            console.log('Нет данных');
          }
          console.groupEnd();
          
          // Состояние погоды
          console.group('Погода (state.weather):');
          if (state.weather) {
            Object.keys(state.weather).forEach(key => {
              console.log(`- ${key}:`, state.weather[key]);
            });
          } else {
            console.log('Нет данных');
          }
          console.groupEnd();
          
          console.log('Полное состояние:', state);
          console.groupEnd();
          
          console.groupEnd();
          
          // Сохраняем состояние в глобальную переменную для доступа через консоль
          window.__LAST_LOGGED_STATE__ = state;
        } catch (error) {
          console.error('Ошибка при логировании состояния:', error);
        }
      };
      
      // Запускаем интервал
      stateLoggingIntervalId = setInterval(logGameState, interval);
      
      // Выполняем первый вывод сразу
      logGameState();
      
      console.info(`✅ Запущено логирование состояния игры каждые ${interval / 1000} секунд. Для остановки используйте window.stopStateLogging()`);
      return true;
    };
    
    /**
     * Функция для остановки периодического вывода состояния
     * @returns {boolean} - true если остановлено успешно, false если не было запущено
     */
    window.stopStateLogging = () => {
      if (stateLoggingIntervalId === null) {
        console.warn('Логирование состояния не запущено');
        return false;
      }
      
      clearInterval(stateLoggingIntervalId);
      stateLoggingIntervalId = null;
      
      console.info('✅ Логирование состояния игры остановлено');
      return true;
    };
    
    /**
     * Удобная функция для получения последнего залогированного состояния
     * @returns {Object} - последнее сохраненное состояние игры
     */
    window.getLastLoggedState = () => {
      if (!window.__LAST_LOGGED_STATE__) {
        console.warn('Нет сохраненного состояния. Запустите логирование с помощью window.startStateLogging()');
        return null;
      }
      return window.__LAST_LOGGED_STATE__;
    };
    
    /**
     * Функция для отображения дополнительной отладочной информации
     * @returns {Object} - объект с информацией об окружении
     */
    window.getGameDebugInfo = () => {
      const debugInfo = {
        globalGameState: Boolean(window.__GAME_STATE__),
        gameStateRef: Boolean(gameStateRef),
        gameContext: Boolean(window.gameContext) || Boolean(window.__GAME_CONTEXT__),
        lastLoggedState: Boolean(window.__LAST_LOGGED_STATE__),
        reactDevTools: Boolean(window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
        browser: navigator.userAgent,
        time: new Date().toISOString()
      };
      
      console.group('🛠️ Отладочная информация игры:');
      console.log('- Глобальное состояние (__GAME_STATE__):', debugInfo.globalGameState);
      console.log('- Ссылка на состояние (gameStateRef):', debugInfo.gameStateRef);
      console.log('- Игровой контекст (gameContext):', debugInfo.gameContext);
      console.log('- Последнее сохраненное состояние:', debugInfo.lastLoggedState);
      console.log('- React DevTools:', debugInfo.reactDevTools);
      console.log('- Браузер:', debugInfo.browser);
      console.log('- Время:', debugInfo.time);
      console.groupEnd();
      
      return debugInfo;
    };
    
    // Инициализация инструментов отладки
    initInventoryDebugTools();
    initCultivationDebugTools();
    initCharacterStatsDebugTools();
    initTechniqueDebugTools();
    initSectDebugTools();
    initResourceDebugTools();
    initAlchemyDebugTools();
    initSpiritPetDebugTools();
    initMarketDebugTools();
    initMarketDebugTools();
    
    // Сообщаем пользователю о доступных функциях отладки
    console.info('🛠️ Инструменты отладки инициализированы. Доступные функции:');
    console.info('• window.getGameTime() - получить информацию об игровом времени');
    console.info('• window.gameDebug.getTime() - альтернативный способ получения информации о времени');
    console.info('• window.add1000ToEverything() - добавить 1000 единиц каждой валюты');
    console.info('• window.добавить1000Всего() - то же самое на русском');
    console.info('• window.add1000Currency() - альтернативный способ добавления валюты');
    console.info('• window.дать1000Ресурсов() - то же самое на русском');
    console.info('• window.startStateLogging(interval) - запустить периодический вывод состояния игры каждые 3 секунды');
    console.info('• window.stopStateLogging() - остановить периодический вывод состояния игры');
    console.info('• window.getLastLoggedState() - получить последнее залогированное состояние');
    console.info('• window.getGameDebugInfo() - получить отладочную информацию о доступности данных игры');
    
    // Информация о новых инструментах отладки инвентаря
    console.info('🧰 Инструменты отладки инвентаря (доступны через window.inventoryDebug):');
    console.info('• inventoryDebug.displayInventory() - отобразить текущий инвентарь в консоли');
    console.info('• inventoryDebug.testGetInventory() - тестировать получение инвентаря через API');
    console.info('• inventoryDebug.testAddItem(item) - тестировать добавление предмета через API');
    console.info('• inventoryDebug.testRemoveItem(itemId) - тестировать удаление предмета через API');
    console.info('• inventoryDebug.testEquipItem(itemId) - тестировать экипировку предмета через API');
    console.info('• inventoryDebug.createTestItems(count) - создать тестовые предметы для отладки');
    console.info('• inventoryDebug.testAddBatchItems(items) - тестировать массовое добавление предметов');
    console.info('• inventoryDebug.testFilterItems(filters) - тестировать фильтрацию предметов');
    
    // Информация о новых инструментах отладки культивации
    console.info('🔮 Инструменты отладки культивации (доступны через window.cultivationDebug):');
    console.info('• cultivationDebug.displayCultivation() - отобразить текущие данные культивации в консоли');
    console.info('• cultivationDebug.testGetCultivation() - тестировать получение данных культивации через API');
    console.info('• cultivationDebug.testUpdateCultivation(updates) - тестировать обновление данных через API');
    console.info('• cultivationDebug.testCheckBreakthrough() - тестировать проверку возможности прорыва');
    console.info('• cultivationDebug.testCompleteTribulation(success) - тестировать завершение трибуляции');
    console.info('• cultivationDebug.testGainInsight() - тестировать получение озарения');
    console.info('• cultivationDebug.increaseCultivationLevel(levels) - повысить уровень культивации для отладки');
    
    // Информация о новых инструментах отладки характеристик персонажа
    console.info('💪 Инструменты отладки характеристик персонажа (доступны через window.statsDebug):');
    console.info('• statsDebug.displayStats() - отобразить текущие характеристики персонажа в консоли');
    console.info('• statsDebug.testGetStats() - тестировать получение характеристик персонажа через API');
    console.info('• statsDebug.testUpdateStats(updates) - тестировать обновление характеристик через API');
    console.info('• statsDebug.testAllocatePoints(attribute, amount) - тестировать распределение очков характеристик');
    console.info('• statsDebug.testResetStats() - тестировать сброс характеристик персонажа');
    console.info('• statsDebug.testCalculateSecondaryStats() - тестировать расчет вторичных характеристик');
    console.info('• statsDebug.addRandomPoints(amount) - добавить случайное количество очков характеристик');
    console.info('• statsDebug.distributePointsEvenly(amount) - равномерно распределить очки характеристик');
    
    // Информация о новых инструментах отладки техник
    console.info('⚔️ Инструменты отладки техник (доступны через window.techniqueDebug):');
    console.info('• techniqueDebug.displayTechniques() - отобразить изученные техники в консоли');
    console.info('• techniqueDebug.testGetAllTechniques() - тестировать получение всех техник через API');
    console.info('• techniqueDebug.testGetTechniqueById(id) - тестировать получение техники по ID');
    console.info('• techniqueDebug.testGetTechniqueByName(name) - тестировать получение техники по названию');
    console.info('• techniqueDebug.testGetLearnedTechniques() - тестировать получение изученных техник');
    console.info('• techniqueDebug.testLearnTechnique(id) - тестировать изучение техники');
    console.info('• techniqueDebug.testUpgradeTechnique(id) - тестировать повышение уровня техники');
    console.info('• techniqueDebug.testUseTechnique(id) - тестировать использование техники');
    console.info('• techniqueDebug.learnRandomTechnique() - изучить случайную технику');
    console.info('• techniqueDebug.upgradeAllTechniques() - повысить уровень всех техник');
    
    // Информация о новых инструментах отладки сект
    console.info('🏯 Инструменты отладки сект (доступны через window.sectDebug):');
    console.info('• sectDebug.displaySect() - отобразить текущую секту в консоли');
    console.info('• sectDebug.testGetSectById(id) - тестировать получение секты по ID');
    console.info('• sectDebug.testGetUserSect() - тестировать получение секты пользователя');
    console.info('• sectDebug.testCreateSect(name) - тестировать создание секты');
    console.info('• sectDebug.testJoinSect(id) - тестировать присоединение к секте');
    console.info('• sectDebug.testContributeToSect(id, energy) - тестировать внесение вклада в секту');
    console.info('• sectDebug.testTrainWithMember(id, duration) - тестировать тренировку с членом секты');
    console.info('• sectDebug.createDemoSect() - создать демо-секту с случайным названием');
    console.info('• sectDebug.contributeRandomly() - внести случайный вклад в секту');
    console.info('• sectDebug.trainWithRandomMember() - тренироваться с случайным членом секты');
    
    // Информация о новых инструментах отладки ресурсов
    console.info('💎 Инструменты отладки ресурсов (доступны через window.resourceDebug):');
    console.info('• resourceDebug.displayResources() - отобразить все ресурсы в консоли');
    console.info('• resourceDebug.displayResourcesByType(type) - отобразить ресурсы указанного типа');
    console.info('• resourceDebug.displayResourcesByRarity(rarity) - отобразить ресурсы указанной редкости');
    console.info('• resourceDebug.displayResourceTypes() - отобразить типы ресурсов');
    console.info('• resourceDebug.displayRarityTypes() - отобразить редкости ресурсов');
    console.info('• resourceDebug.testGetAllResources() - тестировать получение всех ресурсов через API');
    console.info('• resourceDebug.testGetResourceById(id) - тестировать получение ресурса по ID');
    console.info('• resourceDebug.testGetResourcesByType(type) - тестировать получение ресурсов по типу');
    console.info('• resourceDebug.testGetResourcesByRarity(rarity) - тестировать получение ресурсов по редкости');
    console.info('• resourceDebug.testGetBreakthroughResources(stage, level) - получить ресурсы для прорыва');
    
    // Информация о новых инструментах отладки алхимии
    console.info('🧪 Инструменты отладки алхимии (доступны через window.alchemyDebug):');
    console.info('• alchemyDebug.displayRecipes() - отобразить все рецепты алхимии в консоли');
    console.info('• alchemyDebug.displayRecipeDetails(id) - отобразить детальную информацию о рецепте');
    console.info('• alchemyDebug.displayRecipesByType(type) - отобразить рецепты указанного типа');
    console.info('• alchemyDebug.displayRecipesByRarity(rarity) - отобразить рецепты указанной редкости');
    console.info('• alchemyDebug.displayAvailableRecipes(stage, level) - отобразить доступные рецепты');
    console.info('• alchemyDebug.displayUserItems() - отобразить предметы алхимии пользователя');
    console.info('• alchemyDebug.testGetAllRecipes() - тестировать получение всех рецептов через API');
    console.info('• alchemyDebug.testGetRecipeById(id) - тестировать получение рецепта по ID');
    console.info('• alchemyDebug.testCraftItem(recipeId) - тестировать создание предмета по рецепту');
    console.info('• alchemyDebug.craftRandomItem() - создать случайный предмет алхимии');
    console.info('• alchemyDebug.testGetEnemyDrops(type, level, isBoss, element) - получить выпадения с врага');
    
    // Информация о новых инструментах отладки духовных питомцев
    console.info('🐾 Инструменты отладки духовных питомцев (доступны через window.spiritPetDebug):');
    console.info('• spiritPetDebug.displayPetTypes() - отобразить все типы духовных питомцев в консоли');
    console.info('• spiritPetDebug.displayPetTypeDetails(id) - отобразить детальную информацию о типе питомца');
    console.info('• spiritPetDebug.displayUserPets() - отобразить питомцев пользователя');
    console.info('• spiritPetDebug.displayPetDetails(id) - отобразить детальную информацию о питомце');
    console.info('• spiritPetDebug.testGetAllPetTypes() - тестировать получение всех типов питомцев через API');
    console.info('• spiritPetDebug.testGetUserPets() - тестировать получение питомцев пользователя');
    console.info('• spiritPetDebug.testRenamePet(id, name) - тестировать переименование питомца');
    console.info('• spiritPetDebug.testTrainPet(id, attribute) - тестировать тренировку питомца');
    console.info('• spiritPetDebug.testSendPetForaging(id, location) - тестировать отправку питомца на поиск');
    console.info('• spiritPetDebug.trainRandomAttribute(id) - тренировать случайный атрибут');
    console.info('• spiritPetDebug.sendRandomPetForaging() - отправить случайного питомца на поиск');
    
    // Информация о новых инструментах отладки рынка
    console.info('🛒 Инструменты отладки рынка (доступны через window.marketDebug):');
    console.info('• marketDebug.displayMarketItems() - отобразить все товары на рынке в консоли');
    console.info('• marketDebug.displayItemDetails(id) - отобразить детальную информацию о товаре');
    console.info('• marketDebug.displayItemsByType(type) - отобразить товары указанного типа');
    console.info('• marketDebug.searchItems(criteria) - поиск товаров по критериям');
    console.info('• marketDebug.displayUserListings() - отобразить товары пользователя на рынке');
    console.info('• marketDebug.testGetAllItems() - тестировать получение всех товаров через API');
    console.info('• marketDebug.testBuyItem(id, quantity) - тестировать покупку товара');
    console.info('• marketDebug.testSellItem(itemData) - тестировать продажу товара');
    console.info('• marketDebug.testCancelListing(id) - тестировать отмену продажи товара');
    console.info('• marketDebug.sellRandomItem() - выставить на продажу случайный товар');
  }
}

/**
 * Подключает инструменты отладки к компоненту React
 * @param {Object} component - Компонент React
 * @param {Object} props - Свойства компонента
 */
export function connectDebugTools(component, props) {
  if (typeof window !== 'undefined' && component) {
    // Если компонент имеет доступ к контексту или состоянию
    if (component.context || component.state || props) {
      // Получаем данные о состоянии из разных источников
      const state = component.state || {};
      const context = component.context || {};
      const contextState = context.state || context.value?.state;
      
      // Сохраняем ссылку на состояние игры
      if (contextState) {
        gameStateRef = contextState;
      } else if (props && (props.state || props.weather || props.world)) {
        gameStateRef = props;
      }
    }
  }
}

/**
 * Пример использования в точке входа приложения:
 * 
 * import { initDebugTools } from './utils/debugTools';
 * import store from './store';
 * 
 * // В точке входа приложения
 * initDebugTools(store);
 * 
 * Пример использования в компоненте:
 * 
 * import { connectDebugTools } from './utils/debugTools';
 * 
 * class MyComponent extends React.Component {
 *   componentDidMount() {
 *     connectDebugTools(this, this.props);
 *   }
 * }
 */
