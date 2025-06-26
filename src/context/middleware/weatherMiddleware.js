import ACTION_TYPES from '../actions/actionTypes';
import { 
  UPDATE_GAME_TIME,
  FORCE_WEATHER_CHANGE,
  INITIALIZE_WEATHER,
  updateWeather 
} from '../actions/weather-actions';

// Флаг для отслеживания процесса обновления погоды
let isUpdatingWeather = false;
// Инстанс WeatherService (будет загружен асинхронно)
let weatherServiceInstance = null;
// Последнее обработанное ручное обновление времени
let lastManualUpdateTime = 0; 

// Временно включаем логи в консоль для отладки
// Установите в true чтобы включить отладочные логи
const ENABLE_LOGS = true;

// Middleware для обновления погоды в зависимости от времени
export const weatherMiddleware = store => next => action => {
  // ДОБАВЛЕНО: Подробное логирование всех входящих действий
  /*console.log(`🔍🔍🔍 MIDDLEWARE ПОЛУЧИЛ ДЕЙСТВИЕ: ${action.type}`, {
    действие: action.type,
    параметры: action.payload,
    время: new Date().toLocaleTimeString(),
    состояние_weatherInstance: weatherServiceInstance ? 'существует' : 'не существует'
  });*/
  
  // Обработка изменения множителя времени
  if (action.type === 'UPDATE_TIME_MULTIPLIER') {
    //console.log('⏱️ WeatherMiddleware: обработка UPDATE_TIME_MULTIPLIER', action.payload);
    
    // Убедимся, что WeatherService глобально доступен
    if (typeof WeatherService !== 'undefined') {
      //console.log(`✅ WeatherMiddleware: множитель времени установлен на ${action.payload.multiplier}`);
    } else {
      //console.log('⚠️ WeatherMiddleware: WeatherService не доступен глобально');
      // Пробуем обновить множитель через импорт
      import('../../services/weather-service').then(module => {
        const WeatherService = module.default;
        if (WeatherService) {
          WeatherService.TIME_MULTIPLIER = action.payload.multiplier;
          //console.log(`✅ WeatherMiddleware: множитель времени установлен на ${action.payload.multiplier} через импорт`);
        }
      }).catch(error => {
        //console.error('❌ Ошибка при импорте weather-service в middleware:', error);
      });
    }
    
    // Вызываем следующий обработчик для этого типа экшена
    return next(action);
  }
  
  // Сначала вызываем следующий обработчик для других типов экшенов
  const result = next(action);
  
  // Обработка инициализации погоды с прогнозом
  if (action.type === INITIALIZE_WEATHER) {
    /*console.log('🌦️🌦️🌦️ ВЫЗВАНА ИНИЦИАЛИЗАЦИЯ ПОГОДЫ (INITIALIZE_WEATHER)');
    console.log('📋📋 ПОДРОБНОСТИ ИНИЦИАЛИЗАЦИИ:', {
      время_вызова: new Date().toLocaleTimeString(),
      payload: action.payload,
      weatherServiceInstance: weatherServiceInstance ? 'существует' : 'не существует'
    });*/
    
    // Получаем текущее состояние
    const state = store.getState();
    const { dispatch } = store;
    
    // Загружаем WeatherService, если он еще не загружен
    if (!weatherServiceInstance) {
      //console.log('🔄🔄 weatherServiceInstance НЕ СУЩЕСТВУЕТ, выполняем импорт и инициализацию');
      
      import('../../services/weather-service').then(module => {
        //console.log('✅✅ МОДУЛЬ УСПЕШНО ИМПОРТИРОВАН для инициализации погоды');
        const WeatherService = module.default;
        weatherServiceInstance = new WeatherService();
        
        // Получаем worldTime для правильной инициализации
        const worldTime = state.world?.time;
        const currentLocation = state.world?.currentLocation || null;
  
        
        // Вызываем initWeather с полными данными времени
        const initializedWeather = weatherServiceInstance.initWeather(currentLocation, worldTime);
        
        
        // Отправляем обновленное состояние погоды в Redux
        dispatch(updateWeather(initializedWeather));
        
      }).catch(error => {
        console.error('❌ Ошибка при импорте weather-service для инициализации погоды:', error);
      });
    } else {
      // WeatherService уже загружен
      console.log('✅✅ weatherServiceInstance УЖЕ СУЩЕСТВУЕТ, используем его для инициализации погоды');
      
      try {
        // Получаем worldTime для правильной инициализации
        const worldTime = state.world?.time;
        const currentLocation = state.world?.currentLocation || null;
        
        dispatch(updateWeather(initializedWeather));
        
        // Проверяем, применились ли изменения в состоянии
        setTimeout(() => {
          const afterDispatchState = store.getState();
        }, 10);
      } catch (error) {
        console.error('❌ Ошибка при инициализации погоды:', error);
      }
    }
    
    return result;
  }
  
  // Обработка принудительной смены погоды
  if (action.type === FORCE_WEATHER_CHANGE) {
   
    
    // Получаем текущее состояние
    const state = store.getState();
    const { dispatch } = store;
    
    // Загружаем WeatherService, если он еще не загружен
    if (!weatherServiceInstance) {

      
      import('../../services/weather-service').then(module => {
   
        const WeatherService = module.default;
        weatherServiceInstance = new WeatherService();
        
        // Вызываем forceWeatherChange в WeatherService
        const currentWeatherState = state.weather || {};
        const currentLocation = state.world?.currentLocation || null;
        
        // Принудительно меняем погоду
        const updatedWeatherState = weatherServiceInstance.forceWeatherChange(
          currentWeatherState,
          currentLocation
        );
        
        // Отправляем обновленное состояние погоды в Redux
        dispatch(updateWeather(updatedWeatherState));
        
        
      }).catch(error => {
        console.error('❌ Ошибка при импорте weather-service для смены погоды:', error);
      });
    } else {
      // WeatherService уже загружен
      
      
      try {
        // Принудительно меняем погоду
        const currentWeatherState = state.weather || {};
        const currentLocation = state.world?.currentLocation || null;
        
        const updatedWeatherState = weatherServiceInstance.forceWeatherChange(
          currentWeatherState,
          currentLocation
        );
        
        // Отправляем обновленное состояние погоды в Redux
        dispatch(updateWeather(updatedWeatherState));
        
        
      } catch (error) {
        console.error('❌ Ошибка при смене погоды:', error);
      }
    }
    
    return result;
  }
  
  // Затем проверяем, нужно ли обновить погоду для UPDATE_GAME_TIME
  if (action.type === UPDATE_GAME_TIME) {
   
    
    // Извлекаем количество реальных минут для добавления и флаг ручного обновления
    const minutesToAdd = action.payload?.minutesToAdd || 1;
    const isManual = action.payload?.isManual || false;
    
    // Только один лог при ручном обновлении

    // Для ручных обновлений принудительно игнорируем флаг isUpdatingWeather
    if (isUpdatingWeather && !isManual) {
      return result;
    }
    
    // Отмечаем время последнего ручного обновления
    if (isManual) {
      lastManualUpdateTime = Date.now();
    } 
    // Для автоматических обновлений проверяем, не было ли недавно ручного обновления
    else {
      const timeSinceLastManual = Date.now() - lastManualUpdateTime;
      // Если прошло менее 1 секунды с момента ручного обновления, пропускаем автоматическое
      if (timeSinceLastManual < 1000) {
        return result;
      }
    }
    
    isUpdatingWeather = true; // Устанавливаем флаг, что обновление в процессе
    
    const { dispatch } = store;
    
    // Используем setTimeout для предотвращения блокировки UI
    setTimeout(() => {
      try {

        // Важно: получаем состояние здесь, а не раньше, чтобы получить самые свежие данные
        const state = store.getState();

        
        // Загружаем и инициализируем сервис погоды, если он еще не загружен
        if (!weatherServiceInstance) {

          
          import('../../services/weather-service').then(module => {
            const WeatherService = module.default;
            weatherServiceInstance = new WeatherService();
            updateWeatherState();
          }).catch(error => {

            isUpdatingWeather = false; // Сбрасываем флаг при ошибке
          });
        } else {

          updateWeatherState();
        }
      } catch (outerError) {
        isUpdatingWeather = false; // Сбрасываем флаг при неожиданной ошибке
      }
      
      // Функция обновления состояния погоды
      function updateWeatherState() {
        try {

          
          // Убедимся, что обновление все еще актуально (для автоматических)
          if (!isManual) {
            const timeSinceLastManual = Date.now() - lastManualUpdateTime;
           
            
            if (timeSinceLastManual < 1000) {

              isUpdatingWeather = false;
              return;
            }
          }
          
          // Важно: получаем самое последнее состояние снова внутри updateWeatherState
          const freshState = store.getState();
          
    // Получаем текущее состояние погоды из свежего состояния
    let currentWeatherState = freshState.weather || {};
    const currentLocation = freshState.world?.currentLocation || null;
    

    
    // Проверяем, нужно ли инициализировать прогноз погоды
    // НОВОЕ: Если прогноз отсутствует, принудительно инициализируем его
    if (!currentWeatherState.forecast || currentWeatherState.forecast.length === 0) {

      
      // Инициализируем прогноз, если есть инстанс weatherServiceInstance
      if (weatherServiceInstance) {
        try {
          // Инициализируем погоду с текущими данными из состояния
          const worldTime = freshState.world?.time;
          if (worldTime) {
            // Полная инициализация погоды с использованием worldTime
            const initializedWeather = weatherServiceInstance.initWeather(currentLocation, worldTime);
            
            // Обновляем текущее состояние, сохраняя текущую погоду если она уже существует
            currentWeatherState = {
              ...initializedWeather,
              // Сохраняем текущую погоду и интенсивность, если они уже установлены
              currentWeather: currentWeatherState.currentWeather || initializedWeather.currentWeather,
              weatherIntensity: currentWeatherState.weatherIntensity || initializedWeather.weatherIntensity
            };
            
            console.log('🌤️ Погода инициализирована с прогнозом:', initializedWeather.forecast);
            
            // Принудительное обновление погоды в состоянии
            dispatch(updateWeather(currentWeatherState));
          }
        } catch (error) {
          console.error('❌ Ошибка при инициализации прогноза погоды:', error);
        }
      } else {
        console.log('⏳ weatherServiceInstance еще не готов для инициализации прогноза, ожидаем следующего цикла обновления');
        
        // Загружаем weather-service при следующем обновлении
        import('../../services/weather-service').then(module => {
          console.log('✅ Модуль weather-service успешно импортирован для прогноза');
          const WeatherService = module.default;
          weatherServiceInstance = new WeatherService();
        }).catch(error => {
          console.error('❌ Ошибка при импорте weather-service для прогноза:', error);
        });
      }
    }
    
    // Проверяем формат состояния погоды и адаптируем его для weather-service
    // В Redux у нас хранится currentTime: 720 (12:00), но сервису нужны hour и minute
    if (currentWeatherState.currentTime !== undefined && 
        (currentWeatherState.hour === undefined || currentWeatherState.minute === undefined)) {
      // Конвертируем currentTime (в минутах) в hour и minute
      const totalMinutes = currentWeatherState.currentTime || 0;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      
      // Создаем новое состояние в нужном формате
      currentWeatherState = {
        ...currentWeatherState,
        hour: hour,
        minute: minute,
        dayCount: currentWeatherState.dayCount || 1,
        seasonDay: currentWeatherState.seasonDay || 1,
        currentSeason: currentWeatherState.currentSeason || 'spring',
        currentWeather: currentWeatherState.weatherType || 'clear',
        weatherIntensity: currentWeatherState.weatherIntensity || 1,
        isDayTime: hour >= 6 && hour < 20
      };
      
      console.log('🔄 Преобразованное состояние погоды:', {
        hour,
        minute,
        dayCount: currentWeatherState.dayCount,
        currentWeather: currentWeatherState.currentWeather
      });
    }
          
          console.log(`🔄 Вызов weatherServiceInstance.updateTime с worldTime и minutesToAdd=${minutesToAdd}`);
          
          // Проверяем, что экземпляр weatherServiceInstance существует
          if (!weatherServiceInstance) {
            console.error('❌ weatherServiceInstance не существует!');
            isUpdatingWeather = false;
            return;
          }
          
          // Проверяем, что метод updateTime существует
          if (typeof weatherServiceInstance.updateTime !== 'function') {
            console.error('❌ Метод updateTime не существует:', weatherServiceInstance);
            isUpdatingWeather = false;
            return;
          }
          
          // Получаем данные из world.time как единственный источник истины
          const worldTime = freshState.world?.time || {};
          
          // Улучшенное логирование перед обновлением времени
          console.log('📋 Детальное состояние перед обновлением:', {
            worldTime: {
              hour: worldTime.hour,
              minute: worldTime.minute,
              day: worldTime.day,
              season: worldTime.season
            },
            weatherState: {
              hour: currentWeatherState.hour,
              minute: currentWeatherState.minute,
              dayCount: currentWeatherState.dayCount,
              seasonDay: currentWeatherState.seasonDay,
              currentWeather: currentWeatherState.currentWeather
            },
            timeMultiplier: WeatherService.TIME_MULTIPLIER,
            gameMinutesToAdd: minutesToAdd * WeatherService.TIME_MULTIPLIER
          });
          
          // Обновляем время, передавая текущее worldTime и прошедшие минуты
          const updatedWeatherState = weatherServiceInstance.updateTime(
            currentWeatherState,
            currentLocation,
            {  // Передаем объект worldTime с данными из state.world.time
              hour: worldTime.hour,
              minute: worldTime.minute,
              day: worldTime.day,
              season: worldTime.season
            },
            minutesToAdd // Передаем реальные минуты для расчета погоды
          );
          
          console.log('✅ Обновленное состояние погоды:', {
            hour: updatedWeatherState.hour,
            minute: updatedWeatherState.minute,
            dayCount: updatedWeatherState.dayCount,
            seasonDay: updatedWeatherState.seasonDay,
            currentWeather: updatedWeatherState.currentWeather,
            totalGameMinutes: updatedWeatherState.hour * 60 + updatedWeatherState.minute
          });
          
          // РАДИКАЛЬНЫЙ ПОДХОД: state.world.time - единственный источник правды
          
          // 1. СНАЧАЛА обновляем worldTime НЕ из weather, а напрямую
          // Рассчитываем прошедшее время исходя из minutesToAdd и множителя
          const realMinutes = minutesToAdd;
          const gameMinutes = realMinutes * WeatherService.TIME_MULTIPLIER;
          
          // Извлекаем текущее worldTime
          const worldHour = freshState.world?.time?.hour || 0;
          const worldMinute = freshState.world?.time?.minute || 0;
          
          // Более точный расчет нового времени с учетом возможных переходов через полночь
          const totalOldMinutes = worldHour * 60 + worldMinute; // Общее количество минут текущего времени
          
          // Определяем, сколько минут добавилось
          const minutesToAddTotal = gameMinutes;
          
          // Вычисляем общее количество минут в новых сутках (0-1439)
          let newTotalMinutesOfDay = (totalOldMinutes + minutesToAddTotal) % (24 * 60);
          
          // Определяем количество полных суток, которое прошло
          // Учитываем особый случай перехода через полночь, когда новое время меньше старого
          let daysToAdd;
          
          // РАСШИРЕННАЯ ОТЛАДКА: проверяем все условия подробно
          console.log('🔍 ОТЛАДКА перехода через полночь:', {
            totalOldMinutes, // текущее время в минутах (например 23:50 = 1430)
            newTotalMinutesOfDay, // новое время в минутах (например 00:10 = 10)
            isTransition: newTotalMinutesOfDay < totalOldMinutes, // ключевое условие перехода
            minutesToAddTotal, // сколько минут добавляем
            oldTime: `${worldHour}:${worldMinute}`,
            newTime: `${Math.floor(newTotalMinutesOfDay/60)}:${newTotalMinutesOfDay%60}`,
            check1: (worldHour === 23 && Math.floor(newTotalMinutesOfDay/60) === 0), // еще одна проверка перехода
            check2: (totalOldMinutes > 1380 && newTotalMinutesOfDay < 60) // еще одна проверка (23:00+ → 00:xx)
          });
          
          // РАДИКАЛЬНО НОВЫЙ АЛГОРИТМ ОБНАРУЖЕНИЯ ПОЛУНОЧИ:
          // Если переход от позднего времени к раннему - это всегда переход через полночь
          const oldHour = worldHour;
          const newHour = Math.floor(newTotalMinutesOfDay/60);
          
          // Явно обрабатываем переход через полночь (даже без учета добавленных минут)
          // Например: 23:50 → 00:10 ВСЕГДА означает переход через полночь
          const isMidnightTransition = 
            (oldHour >= 23 && newHour < 1) || // Между 23:00-23:59 → 00:00-00:59 
            (totalOldMinutes > 1380 && newTotalMinutesOfDay < 60); // То же самое, в минутах
            
          // Дополнительная проверка на случай, если переход добавляет больше суток 
          // (например, +2000 минут от 23:00 может дать 09:40 через 1 день)
          const explicitFullDays = Math.floor(minutesToAddTotal / (24 * 60));
          
          if (isMidnightTransition) {
            // Обнаружен переход через полночь! 
            // ALWAYS прибавляем 1 день в этом случае + дополнительные полные сутки
            
            // Важно: не 1 + explicitFullDays, а прямой +1!
            // Это потому что сам переход через полночь уже означает +1 день
            daysToAdd = 1 + explicitFullDays;
            
            console.log('🌙🌙🌙🌙 ПЕРЕХОД ЧЕРЕЗ ПОЛНОЧЬ!', {
              oldTime: `${oldHour}:${worldMinute}`, 
              newTime: `${newHour}:${newTotalMinutesOfDay%60}`,
              criteriaMatched: 'Явный переход из позднего часа (23+) в ранний час (0-1)',
              explicitFullDays,
              totalDaysToAdd: daysToAdd
            });
          } else if (newTotalMinutesOfDay < totalOldMinutes) {
            // Если общее количество минут уменьшилось - это тоже переход через полночь
            // Например: 1430 минут (23:50) → 10 минут (00:10) означает -1420 минут и переход через полночь
            
            daysToAdd = 1 + explicitFullDays; // Аналогично, +1 день за переход через полночь
            
            console.log('🌙🌙🌙 ПЕРЕХОД ЧЕРЕЗ ПОЛНОЧЬ (уменьшение минут)!', {
              oldTime: `${oldHour}:${worldMinute}`,
              newTime: `${newHour}:${newTotalMinutesOfDay%60}`,
              oldTotalMinutes: totalOldMinutes,
              newTotalMinutes: newTotalMinutesOfDay,
              minutesDiff: newTotalMinutesOfDay - totalOldMinutes,
              explicitFullDays,
              totalDaysToAdd: daysToAdd
            });
          } else {
            // Стандартный случай - только полные сутки (если есть)
            daysToAdd = explicitFullDays;
            
            if (daysToAdd > 0) {
              console.log('📅 Добавлено дней:', daysToAdd, '(полных суток)');
            }
          }
          
          // РАДИКАЛЬНАЯ ПРОВЕРКА на граничные случаи перехода через полночь
          // Это критически важно для обнаружения всех возможных переходов
          if (oldHour === 23 && newHour === 0 && daysToAdd === 0) {
            console.log('⚠️⚠️⚠️ ВНИМАНИЕ! КРИТИЧЕСКАЯ СИТУАЦИЯ: переход 23:xx → 00:xx, но daysToAdd = 0!');
            console.log('🛠️ ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ: устанавливаем daysToAdd = 1');
            daysToAdd = 1;
          }
          // Дополнительный случай: позднее время + прибавление времени больше 60 минут -> раннее время 
          else if (oldHour >= 22 && newHour <= 5 && minutesToAddTotal >= 60 && daysToAdd === 0) {
            console.log('⚠️⚠️ ОБНАРУЖЕН СЛОЖНЫЙ ПЕРЕХОД ЧЕРЕЗ ПОЛНОЧЬ: позднее время + прибавление большого количества минут!');
            console.log('🛠️ ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ: устанавливаем daysToAdd = 1');
            daysToAdd = 1;
          }
          // Полночный граничный случай - если текущее время 23:30+ и новое время 00:30-
          else if ((oldHour * 60 + worldMinute >= 1410) && 
                  (newHour * 60 + (newTotalMinutesOfDay % 60) <= 30) && 
                  daysToAdd === 0) {
            console.log('⚠️⚠️ ОБНАРУЖЕН СПЕЦИАЛЬНЫЙ ГРАНИЧНЫЙ СЛУЧАЙ ПОЛУНОЧИ (23:30+ → 00:30-)');
            console.log('🛠️ ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ: устанавливаем daysToAdd = 1');
            daysToAdd = 1;
          }
          
          // Рассчитываем новый час и минуту из количества минут в текущих сутках
          let newWorldHour = Math.floor(newTotalMinutesOfDay / 60);
          let newWorldMinute = newTotalMinutesOfDay % 60;
          
          console.log('🕒 ВАЖНО! ПРЯМОЕ обновление worldTime:', {
            oldWorldTime: `${worldHour}:${worldMinute}`,
            newWorldTime: `${newWorldHour}:${newWorldMinute}`,
            totalOldMinutes,
            newTotalMinutesOfDay,
            minutesAdded: gameMinutes,
            minutesToAddTotal,
            daysToAdd
          });
          
          // Получаем текущее значение day из state.world.time - это ЕДИНСТВЕННЫЙ источник правды
          const currentWorldDay = freshState.world?.time?.day || 1;
          
          // Увеличиваем день на количество полных суток, которое прошло
          const newDay = currentWorldDay + daysToAdd;
          
          console.log('📅 ИСПРАВЛЕННОЕ определение переходов через полночь:', {
            oldTime: `${oldHour}:${worldMinute}`,
            newTime: `${newHour}:${newTotalMinutesOfDay%60}`,
            totalOldMinutes,
            newTotalMinutesOfDay,
            minutesToAddTotal,
            daysToAdd,
            currentWorldDay,
            newDay
          });
          
          console.log('🌙 Проверка перехода через полночь:', {
            oldTime: `${worldHour}:${worldMinute}`,
            newTime: `${newWorldHour}:${newWorldMinute}`,
            gameMinutes,
            daysToAdd,
            totalOldMinutes,
            newTotalMinutesOfDay,
            currentWorldDay,
            newDay
          });
          
          console.log('📅 Обновление дня:', {
            currentWorldDay,
            newDay,
            debug: {
              worldTimeDayType: typeof freshState.world?.time?.day
            }
          });
          
          // ЭКСТРЕМАЛЬНАЯ ОТЛАДКА: подробный лог данных перед dispatch
          console.log('🚀🚀 КРИТИЧЕСКИЙ ЛОГ - ДАННЫЕ ПЕРЕД ОТПРАВКОЙ ЭКШЕНА:', {
            hour: newWorldHour, 
            minute: newWorldMinute, 
            day: newDay, // Это новое значение дня, которое должно увеличиться при переходе через полночь
            currentWorldDay, // Предыдущее значение дня
            daysToAdd, // Сколько дней должно быть добавлено
            isMidnightCrossing: isMidnightTransition, // Был ли обнаружен переход через полночь
            time_values: {
              oldHour,
              newHour,
              oldMinutes: totalOldMinutes,
              newMinutes: newTotalMinutesOfDay
            },
            // Детализация действий системы
            actions_taken: {
              condition1: (oldHour >= 23 && newHour < 1),
              condition2: (newTotalMinutesOfDay < totalOldMinutes),
              explicit_days: explicitFullDays
            },
            state_world_time: freshState.world?.time || 'отсутствует'
          });
          
          console.log(`🔬 ОТЛАДКА ПРОБЛЕМЫ С ДНЕМ: текущий день=${currentWorldDay}, новый день=${newDay}, daysToAdd=${daysToAdd}`);
          
          // Обновляем state.world.time, который виден в TimeDebugPanel
          // Используем ТОЛЬКО значения, рассчитанные выше, НЕ из weatherService
          const updateTimeAction = {
            type: ACTION_TYPES.UPDATE_TIME,
            payload: {
              hour: newWorldHour,
              minute: newWorldMinute,
              day: newDay, // Используем рассчитанное значение дня
              season: updatedWeatherState.currentSeason || 'spring'
            }
          };
          
          console.log('🚀 ОТПРАВЛЯЕМ ЭКШЕН UPDATE_TIME:', updateTimeAction);
          
          // Важное дополнение: обеспечить гарантированное преобразование типов
          // перед отправкой для предотвращения проблем с обработкой дня
          const cleanedUpdateTimeAction = {
            type: ACTION_TYPES.UPDATE_TIME,
            payload: {
              hour: Number(newWorldHour),
              minute: Number(newWorldMinute),
              day: Number(newDay), // Гарантированно число
              season: updatedWeatherState.currentSeason || 'spring'
            }
          };
          
          console.log('🎯🎯 КРИТИЧЕСКОЕ ПРЕОБРАЗОВАНИЕ UPDATE_TIME:', {
            исходное_действие: updateTimeAction,
            итоговое_значение_дня: Number(newDay),
            тип_значения_дня: typeof Number(newDay),
            очищенное_действие: cleanedUpdateTimeAction
          });
          
          // Отправляем очищенное действие
          dispatch(cleanedUpdateTimeAction);
          
          // После диспатча - запрашиваем свежее состояние чтобы убедиться, что изменения применились
          setTimeout(() => {
            const afterDispatchState = store.getState();
            console.log('📊 СОСТОЯНИЕ ПОСЛЕ ДИСПАТЧА:', {
              world_time: afterDispatchState.world?.time,
              weather_dayCount: afterDispatchState.weather?.dayCount,
            });
          }, 0);
          
          // ВАЖНОЕ ИСПРАВЛЕНИЕ: Проверяем, стал ли nextWeatherChange равным 0 после обновления
          // Если да, немедленно инициируем смену погоды
          if (updatedWeatherState.nextWeatherChange === 0) {
            console.log('⚠️⚠️⚠️ ОБНАРУЖЕН НУЛЕВОЙ nextWeatherChange! Немедленно меняем погоду!');
            
            // Сначала обновляем текущее состояние
            dispatch(updateWeather({
              currentWeather: updatedWeatherState.currentWeather,
              weatherIntensity: updatedWeatherState.weatherIntensity,
              weatherEffects: updatedWeatherState.weatherEffects,
              dayCount: newDay, // Используем то же значение дня, что и в UPDATE_TIME для синхронизации
              currentSeason: worldTime.season || updatedWeatherState.currentSeason, // Приоритет season из worldTime
              nextWeatherChange: updatedWeatherState.nextWeatherChange, // ВАЖНОЕ ИСПРАВЛЕНИЕ: Передаем nextWeatherChange
              forecast: updatedWeatherState.forecast // Передаем обновленный прогноз погоды
            }));
            
            // Затем немедленно диспатчим FORCE_WEATHER_CHANGE для смены погоды
            setTimeout(() => {
              console.log('🌤️🌤️ Вызываем принудительную смену погоды из-за нулевого nextWeatherChange');
              dispatch({ type: FORCE_WEATHER_CHANGE });
            }, 100);
          } else {
            // Обычное обновление погоды
            dispatch(updateWeather({
              currentWeather: updatedWeatherState.currentWeather,
              weatherIntensity: updatedWeatherState.weatherIntensity,
              weatherEffects: updatedWeatherState.weatherEffects,
              dayCount: newDay, // Используем то же значение дня, что и в UPDATE_TIME для синхронизации
              currentSeason: worldTime.season || updatedWeatherState.currentSeason, // Приоритет season из worldTime
              nextWeatherChange: updatedWeatherState.nextWeatherChange, // ВАЖНОЕ ИСПРАВЛЕНИЕ: Передаем nextWeatherChange
              forecast: updatedWeatherState.forecast // Передаем обновленный прогноз погоды
            }));
          }

          // Подробное логирование nextWeatherChange для отладки
          console.log('⏳ Передано новое значение nextWeatherChange:', {
            получено_от_сервиса: updatedWeatherState.nextWeatherChange,
            предыдущее_значение: currentWeatherState.nextWeatherChange,
            изменение: updatedWeatherState.nextWeatherChange - (currentWeatherState.nextWeatherChange || 0)
          });
          
          // ЖЕСТКАЯ СИНХРОНИЗАЦИЯ: Принудительно устанавливаем все значения времени в weather из worldTime
          // Это необходимо для корректной работы TimedebugPanel
          const newHourInMinutes = newWorldHour * 60 + newWorldMinute;
          
          // РАДИКАЛЬНО УЛУЧШЕННАЯ синхронизация дня сезона 
          const currentSeasonDay = freshState.weather?.seasonDay || 1;
          
          // Всегда устанавливаем день сезона равным мировому дню для устранения рассинхронизации
          let seasonDay = newDay;
          
          if (currentSeasonDay !== newDay) {
            console.log(`📅 ПОЛНАЯ СИНХРОНИЗАЦИЯ ДНЯ СЕЗОНА с мировым днем: ${currentSeasonDay} → ${newDay}`, {
              причина: daysToAdd > 0 ? 'смена дня' : 'принудительная синхронизация',
              dayDiff: Math.abs(newDay - currentSeasonDay)
            });
          }
          
          // Используем тип, который гарантированно обрабатывается напрямую в редьюсере
          dispatch({
            type: 'DIRECT_UPDATE_WEATHER_TIME',
            payload: {
              currentTime: newHourInMinutes,
              formattedTime: `${String(newWorldHour).padStart(2, '0')}:${String(newWorldMinute).padStart(2, '0')}`,
              hour: newWorldHour,
              minute: newWorldMinute,
              dayCount: newDay,  // Явная синхронизация счетчика дня
              seasonDay: seasonDay, // ИСПРАВЛЕНИЕ: Явная синхронизация дня сезона
              currentSeason: worldTime.season || updatedWeatherState.currentSeason, // Приоритет season из worldTime
              // Определяем период суток для отображения в интерфейсе
              timeOfDay: 
                (newWorldHour >= 5 && newWorldHour < 7) ? 'рассвет' :
                (newWorldHour >= 7 && newWorldHour < 11) ? 'утро' :
                (newWorldHour >= 11 && newWorldHour < 14) ? 'полдень' :
                (newWorldHour >= 14 && newWorldHour < 17) ? 'день' :
                (newWorldHour >= 17 && newWorldHour < 20) ? 'вечер' :
                (newWorldHour >= 20 && newWorldHour < 23) ? 'ночь' : 'глубокая ночь',
              isDayTime: newWorldHour >= 6 && newWorldHour < 20
            }
          });
          
          // Принудительно проверяем, что синхронизация прошла успешно
          setTimeout(() => {
            const syncCheckState = store.getState();
            if (
              syncCheckState.weather?.hour !== newWorldHour || 
              syncCheckState.weather?.minute !== newWorldMinute || 
              syncCheckState.weather?.dayCount !== newDay
            ) {
              console.error('⚠️ ОШИБКА СИНХРОНИЗАЦИИ! Время в weather не соответствует world_time:', {
                worldTime: { hour: newWorldHour, minute: newWorldMinute, day: newDay },
                weather: { 
                  hour: syncCheckState.weather?.hour, 
                  minute: syncCheckState.weather?.minute, 
                  dayCount: syncCheckState.weather?.dayCount
                }
              });
            } else {
              console.log('✅ Синхронизация завершена успешно!');
            }
          }, 50);
          
          console.log('🔄 Синхронизированные данные времени:', {
            worldTime: { hour: newWorldHour, minute: newWorldMinute, day: newDay },
            weatherTime: { hour: newWorldHour, minute: newWorldMinute, dayCount: newDay, totalMinutes: newHourInMinutes }
          });
          
          console.log('✅ Время успешно обновлено в state.world.time И state.weather');
          
          // Только один лог результатов для ручных обновлений
          if (isManual) {
            const hoursBefore = currentWeatherState.hour || 0;
            const minutesBefore = currentWeatherState.minute || 0;
            const hoursAfter = updatedWeatherState.hour || 0;
            const minutesAfter = updatedWeatherState.minute || 0;
            
            const gameMinutesBefore = hoursBefore * 60 + minutesBefore;
            const gameMinutesAfter = hoursAfter * 60 + minutesAfter;
            const gameMinutesAdded = 
              (gameMinutesAfter >= gameMinutesBefore) 
                ? gameMinutesAfter - gameMinutesBefore 
                : (24 * 60 - gameMinutesBefore) + gameMinutesAfter;
            
            console.log(`✓ Результат: ${hoursBefore}:${minutesBefore.toString().padStart(2, '0')} → ${hoursAfter}:${minutesAfter.toString().padStart(2, '0')} (+${gameMinutesAdded} игр.мин)`);
          }
          
        } catch (error) {
          // Никаких логов ошибок, кроме критических
          isUpdatingWeather = false;
        } finally {
          // Всегда сбрасываем флаг обновления, даже при ошибке
          isUpdatingWeather = false;
        }
      }
    }, isManual ? 0 : 100); // Для ручных обновлений запускаем сразу, для автоматических - с небольшой задержкой
  }
  
  return result;
};
