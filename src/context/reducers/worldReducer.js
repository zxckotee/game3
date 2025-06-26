import ACTION_TYPES from '../actions/actionTypes';
import { 
  UPDATE_WEATHER, 
  SET_TIME_OF_DAY, 
  WEATHER_SPECIAL_EVENT,
  UPDATE_GAME_TIME,
  INITIALIZE_WEATHER
} from '../actions/weather-actions';

// Константы для управления сезонами
const SEASON_LENGTH = 30; // Длина сезона в днях
const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter']; // Порядок сезонов

/**
 * Вычисляет текущий день сезона на основе общего дня мира
 * @param {Number} worldDay - Общий день мира
 * @returns {Number} - День в рамках текущего сезона (1-30)
 */
const calculateSeasonDay = (worldDay) => {
  return ((worldDay - 1) % SEASON_LENGTH) + 1;
};

/**
 * Вычисляет текущий сезон на основе общего дня мира
 * @param {Number} worldDay - Общий день мира
 * @returns {String} - Ключ текущего сезона ('spring', 'summer', etc.)
 */
const calculateSeason = (worldDay) => {
  const seasonIndex = Math.floor((worldDay - 1) / SEASON_LENGTH) % SEASON_ORDER.length;
  return SEASON_ORDER[seasonIndex];
};

// Начальное состояние погоды
const initialWeatherState = {
  currentTime: 720, // 12:00
  timeOfDay: 'день',
  formattedTime: '12:00',
  weatherType: 'ясно', 
  weatherIntensity: 5,
  weatherEffects: {
    combat: {
      damageModifiers: {},
      hitChanceModifier: 1.0,
      dodgeChanceModifier: 1.0,
      critChanceModifier: 1.0,
      enemySpawnRateModifier: 1.0
    },
    cultivation: {
      elementModifiers: {},
      meditationEfficiencyModifier: 1.0,
      breakthroughChanceModifier: 1.0,
      bottleneckProgressModifier: 3.0
    },
    exploration: {
      movementEnergyCostModifier: 1.0,
      resourceFindRateModifier: 1.0,
      resourceQualityModifier: 1.0,
      hiddenLocationChanceModifier: 1.0,
      visibilityModifier: 1.0
    },
    crafting: {
      alchemySuccessRateModifier: 1.0,
      alchemyQualityModifier: 1.0,
      spiritEnergyConsumptionModifier: 1.0
    },
    system: {
      specialEncounterChance: 0.0,
      uniqueResourceSpawnChance: 0.0
    }
  },
  activeSpecialEvent: null
};

// Редуктор для обработки действий, связанных с игровым миром
export const worldReducer = (state, action) => {
  switch (action.type) {
    // Обработчик для полной инициализации погоды с прогнозом
    case INITIALIZE_WEATHER:
      console.log('🔍🔍 worldReducer: Получен INITIALIZE_WEATHER');
      // В случае обработки через middleware, это действие не должно менять состояние здесь
      // Middleware сам вызовет updateWeather с нужными данными
      return state;
      
    case ACTION_TYPES.UPDATE_TIME:
      console.log('🔎🔎🔎 КРИТИЧЕСКАЯ ОТЛАДКА - ПОЛУЧЕН UPDATE_TIME:', {
        raw_payload: action.payload, // Сырые данные из действия
        raw_day_value: action.payload.day, // Необработанное значение дня
        raw_day_type: typeof action.payload.day, // Тип значения дня
        raw_state_day: state.world?.time?.day, // Текущее значение дня в состоянии
        raw_state_day_type: typeof state.world?.time?.day, // Тип текущего значения дня 
      });
      
      // world.time является основным источником правды о времени
      // Получаем и преобразуем все временные значения для надежности
      const newDay = action.payload.day !== undefined ? Number(action.payload.day) : (state.world?.time?.day || 1);
      const newHour = action.payload.hour !== undefined ? Number(action.payload.hour) : (state.world?.time?.hour || 0);
      const newMinute = action.payload.minute !== undefined ? Number(action.payload.minute) : (state.world?.time?.minute || 0);
      // Используем let вместо const, так как значение может измениться при расчете сезона
      let newSeason = action.payload.season || state.world?.time?.season || 'spring';
      
      // Текущий день для логов
      const currentDay = state.world?.time?.day !== undefined ? Number(state.world.time.day) : 1;
      
      console.log('🕒 UPDATE_TIME в редьюсере - ПОСЛЕ ПРЕОБРАЗОВАНИЯ:', {
        currentDay,
        newDay,
        parsedNewDay: Number(action.payload.day), // Явное преобразование
        newHour,
        newMinute,
        newSeason,
        diff: newDay - currentDay,
        actionPayload: action.payload,
        currentValues: state.world?.time || 'time отсутствует',
        conversion_details: {
          raw: action.payload.day,
          after_number: Number(action.payload.day),
          after_parse_int: parseInt(action.payload.day),
          after_force_num_check: parseFloat(String(action.payload.day).replace(/[^0-9.-]+/g, ''))
        }
      });
      
      // Расширенная проверка на смену дня с подробной информацией
      let dayChangedFlag = false;
      if (newDay > currentDay) {
        console.log('📅📅📅 ДЕНЬ ИЗМЕНИЛСЯ: ' + currentDay + ' -> ' + newDay);
        dayChangedFlag = true;
      } else if (action.payload.day !== undefined && Number(action.payload.day) <= currentDay) {
        console.log('⚠️ ВНИМАНИЕ: день не изменился или уменьшился:', {
          currentDay, 
          newDay: Number(action.payload.day)
        });
      }
      
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Синхронизируем все значения, не только dayCount
      const newHourInMinutes = newHour * 60 + newMinute;
      const formattedTimeValue = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
      const timeOfDayValue = 
        (newHour >= 5 && newHour < 7) ? 'рассвет' :
        (newHour >= 7 && newHour < 11) ? 'утро' :
        (newHour >= 11 && newHour < 14) ? 'полдень' :
        (newHour >= 14 && newHour < 17) ? 'день' :
        (newHour >= 17 && newHour < 20) ? 'вечер' :
        (newHour >= 20 && newHour < 23) ? 'ночь' : 'глубокая ночь';
      
      console.log('🕒 ЖЕСТКАЯ СИНХРОНИЗАЦИЯ В UPDATE_TIME: world.time → weather', {
        hour: newHour,
        minute: newMinute,
        day: newDay,
        season: newSeason
      });
      
      // УЛУЧШЕННАЯ СИНХРОНИЗАЦИЯ СЕЗОННОГО ДНЯ С УЧЕТОМ ПЕРЕХОДА ЧЕРЕЗ МАКСИМАЛЬНУЮ ДЛИНУ СЕЗОНА
      
      // Вычисляем правильный день сезона и сезон на основе мирового дня
      let calculatedSeasonDay, calculatedSeason;
      
      // Проверяем, превышает ли день длину сезона
      if (newDay > SEASON_LENGTH) {
        calculatedSeasonDay = calculateSeasonDay(newDay);
        calculatedSeason = calculateSeason(newDay);
        
        console.log('🌈 РАСЧЕТ СЕЗОНА ПРИ ПЕРЕХОДЕ ЧЕРЕЗ МАКСИМАЛЬНУЮ ДЛИНУ:', {
          мировой_день: newDay,
          вычисленный_день_сезона: calculatedSeasonDay,
          текущий_сезон: newSeason,
          вычисленный_сезон: calculatedSeason,
          длина_сезона: SEASON_LENGTH
        });
        
        // Если день сезона вычислен корректно, используем его
        if (calculatedSeasonDay) {
          // Используем вычисленный сезон, если он отличается от текущего
          if (calculatedSeason !== newSeason) {
            console.log(`🌈🌈 СМЕНА СЕЗОНА: ${newSeason} -> ${calculatedSeason} (день сезона: ${calculatedSeasonDay})`);
            newSeason = calculatedSeason;
          }
        } else {
          // Если что-то пошло не так, предохранитель - используем день сезона = 1
          calculatedSeasonDay = 1;
          console.warn('⚠️ Невозможно вычислить день сезона, используем значение по умолчанию = 1');
        }
      } else {
        // Если день в пределах длины сезона, день сезона = мировому дню
        calculatedSeasonDay = newDay;
      }
      
      console.log('📅 ИТОГОВЫЕ ЗНАЧЕНИЯ ПОСЛЕ СИНХРОНИЗАЦИИ СЕЗОНА:', {
        мировой_день: newDay,
        день_сезона: calculatedSeasonDay,
        сезон: newSeason
      });
      
      // УЛУЧШЕНИЕ: Пересчет времени до смены погоды на основе weatherChangeAt
      let updatedNextWeatherChange = state.weather?.nextWeatherChange;
      const weatherChangeAt = state.weather?.weatherChangeAt;
      
      // Пересчитываем nextWeatherChange, если weatherChangeAt доступен
      if (weatherChangeAt !== undefined) {
        // Получаем текущее абсолютное время в минутах
        const currentAbsoluteMinutes = newHour * 60 + newMinute;
        
        // Вычисляем разницу между временем смены погоды и текущим временем
        const remainingMinutes = weatherChangeAt - currentAbsoluteMinutes;
        
        // Обновляем nextWeatherChange с учетом нового времени
        updatedNextWeatherChange = Math.max(0, remainingMinutes);
        
        console.log('⏱️ UPDATE_TIME: Пересчет nextWeatherChange:', {
          weatherChangeAt,
          currentAbsoluteMinutes,
          разница: remainingMinutes,
          новое_значение: updatedNextWeatherChange
        });
        
        // Если время до смены равно 0, но погода не менялась, записываем в лог
        if (updatedNextWeatherChange === 0) {
          console.log('⚠️ UPDATE_TIME: Время до смены погоды равно 0, необходимо сменить погоду');
        }
      } else {
        console.log('⚠️ UPDATE_TIME: weatherChangeAt отсутствует, nextWeatherChange не обновлен');
      }
      
      // Обновленный weather с ПОЛНОЙ синхронизацией всех временных значений и обновленным nextWeatherChange
      const updatedWeather = {
        ...state.weather,
        currentTime: newHourInMinutes,
        formattedTime: formattedTimeValue,
        hour: newHour,
        minute: newMinute,
        dayCount: newDay,
        seasonDay: calculatedSeasonDay, // Используем вычисленный день сезона
        currentSeason: newSeason, // Используем вычисленный сезон
        timeOfDay: timeOfDayValue,
        isDayTime: newHour >= 6 && newHour < 20,
        nextWeatherChange: updatedNextWeatherChange // Обновляем время до смены погоды
      };
      
      // Возвращаем обновленное состояние с синхронизированными значениями
      return {
        ...state,
        world: {
          ...state.world,
          time: {
            ...state.world.time,
            ...action.payload,
            hour: newHour, // Гарантируем, что все значения имеют правильный тип
            minute: newMinute,
            day: newDay,
            season: newSeason
          },
        },
        weather: updatedWeather // Полностью синхронизированный weather
      };
      
    // Обработка старого типа действия для обновления погоды
    case ACTION_TYPES.UPDATE_WEATHER:
      return {
        ...state,
        world: {
          ...state.world,
          weather: action.payload,
        },
      };
      
    // Обработка нового типа действия для нашей расширенной системы погоды
    case UPDATE_WEATHER:
      // Логгируем получаемые значения для отладки
      console.log('🌤️ UPDATE_WEATHER в редьюсере получил:', {
        текущая_погода: action.payload.currentWeather,
        интенсивность: action.payload.weatherIntensity,
        время_до_смены: action.payload.nextWeatherChange,
        есть_прогноз: Boolean(action.payload.forecast)
      });
      
      // Гарантируем, что nextWeatherChange будет числом
      let cleanedNextWeatherChange = action.payload.nextWeatherChange;
      
      // Проверяем, что nextWeatherChange существует и является числом
      if (action.payload.nextWeatherChange !== undefined && 
          (typeof action.payload.nextWeatherChange !== 'number' || isNaN(action.payload.nextWeatherChange))) {
        console.warn('⚠️ nextWeatherChange не является числом:', action.payload.nextWeatherChange);
        // Конвертируем в число или устанавливаем значение по умолчанию
        cleanedNextWeatherChange = parseInt(action.payload.nextWeatherChange, 10);
        if (isNaN(cleanedNextWeatherChange)) {
          cleanedNextWeatherChange = 60; // Значение по умолчанию, если не удалось преобразовать
        }
      }
      
      // НОВОЕ: Синхронизируем день сезона с мировым днем
      let correctSeasonDay = state.weather?.seasonDay || 1;
      const worldDay = state.world?.time?.day;
      
      // Проверяем, есть ли world.time.day и нужно ли обновить день сезона
      if (worldDay !== undefined) {
        if (worldDay > SEASON_LENGTH) {
          // Если мировой день превышает длину сезона, вычисляем день сезона по формуле
          correctSeasonDay = ((worldDay - 1) % SEASON_LENGTH) + 1;
          console.log('🌈 UPDATE_WEATHER: Синхронизация дня сезона при длине > SEASON_LENGTH:', {
            worldDay,
            correctSeasonDay,
            формула: `((${worldDay} - 1) % ${SEASON_LENGTH}) + 1`
          });
        } else {
          // Иначе день сезона равен мировому дню
          correctSeasonDay = worldDay;
          console.log('🌈 UPDATE_WEATHER: Синхронизация дня сезона в пределах сезона:', {
            worldDay,
            correctSeasonDay
          });
        }
      }
      
      // ВАЖНОЕ ИСПРАВЛЕНИЕ: Гарантируем, что день сезона никогда не будет равен 0
      if (correctSeasonDay <= 0) {
        console.log('⚠️ UPDATE_WEATHER: Обнаружен нулевой или отрицательный день сезона, исправляем на 1');
        correctSeasonDay = 1;
      }
      
      return {
        ...state,
        weather: {
          ...state.weather,
          ...action.payload,
          // Явно устанавливаем nextWeatherChange как число
          nextWeatherChange: cleanedNextWeatherChange,
          // Устанавливаем корректный день сезона
          seasonDay: correctSeasonDay
        }
      };
      
    case SET_TIME_OF_DAY:
      return {
        ...state,
        weather: {
          ...state.weather,
          timeOfDay: action.payload.timeOfDay
        }
      };
      
    case WEATHER_SPECIAL_EVENT:
      return {
        ...state,
        weather: {
          ...state.weather,
          activeSpecialEvent: {
            type: action.payload.eventType,
            data: action.payload.eventData
          }
        }
      };
      
    case UPDATE_GAME_TIME:
      // Этот кейс обрабатывается через middleware, который вызывает сервис погоды
      return state;
    
    // Обработчик для прямого обновления времени в weather (синхронизация с worldTime)
    case 'DIRECT_UPDATE_WEATHER_TIME':
      console.log('⚡ Редьюсер обрабатывает DIRECT_UPDATE_WEATHER_TIME:', {
        ...action.payload,
        dayCountType: typeof action.payload.dayCount,
        currentDayType: typeof state.weather?.dayCount
      });
      
      // Убедимся, что dayCount всегда является числом
      const dayCount = action.payload.dayCount !== undefined 
        ? Number(action.payload.dayCount) 
        : (state.weather?.dayCount || 1);
      
      // Явно обрабатываем сезон, важно для полной синхронизации
      const providedSeason = action.payload.currentSeason || state.weather?.currentSeason || 'spring';
      
      // Вычисляем правильный день сезона и сезон на основе мирового дня
      let directUpdateSeasonDay, directUpdateSeason = providedSeason;
      
      // Проверяем, превышает ли день длину сезона
      if (dayCount > SEASON_LENGTH) {
        directUpdateSeasonDay = calculateSeasonDay(dayCount);
        directUpdateSeason = calculateSeason(dayCount);
        
        console.log('🌈 DIRECT_UPDATE_WEATHER_TIME: РАСЧЕТ СЕЗОНА:', {
          мировой_день: dayCount,
          вычисленный_день_сезона: directUpdateSeasonDay,
          текущий_сезон: providedSeason,
          вычисленный_сезон: directUpdateSeason
        });
        
        // Если вычисленный сезон отличается от переданного, логируем изменение
        if (directUpdateSeason !== providedSeason) {
          console.log(`🌈🌈 DIRECT_UPDATE_WEATHER_TIME: КОРРЕКЦИЯ СЕЗОНА: ${providedSeason} -> ${directUpdateSeason}`);
        }
      } else {
        // Если день в пределах длины сезона
        directUpdateSeasonDay = dayCount;
      }
      
      console.log('🔄 DIRECT_UPDATE_WEATHER_TIME - Полная синхронизация weather с worldTime:', {
        hour: action.payload.hour,
        minute: action.payload.minute,
        dayCount,
        seasonDay: directUpdateSeasonDay,
        season: directUpdateSeason
      });
      
      // Обновляем и world.time.season, если сезон был изменен
      if (directUpdateSeason !== providedSeason && state.world?.time) {
        console.log(`🌈 DIRECT_UPDATE_WEATHER_TIME: Обновляем сезон в world.time: ${providedSeason} -> ${directUpdateSeason}`);
        
        return {
          ...state,
          world: {
            ...state.world,
            time: {
              ...state.world.time,
              season: directUpdateSeason // Синхронизируем сезон в world.time
            }
          },
          weather: {
            ...state.weather,
            currentTime: action.payload.currentTime,
            formattedTime: action.payload.formattedTime,
            hour: action.payload.hour, // Важно гарантировать, что это число
            minute: action.payload.minute, // Важно гарантировать, что это число
            dayCount: dayCount, // Явно устанавливаем dayCount как число
            seasonDay: directUpdateSeasonDay, // Используем вычисленный день сезона
            currentSeason: directUpdateSeason, // Используем вычисленный сезон
            // Определяем период суток на основе часа
            timeOfDay: 
              (action.payload.hour >= 5 && action.payload.hour < 7) ? 'рассвет' :
              (action.payload.hour >= 7 && action.payload.hour < 11) ? 'утро' :
              (action.payload.hour >= 11 && action.payload.hour < 14) ? 'полдень' :
              (action.payload.hour >= 14 && action.payload.hour < 17) ? 'день' :
              (action.payload.hour >= 17 && action.payload.hour < 20) ? 'вечер' :
              (action.payload.hour >= 20 && action.payload.hour < 23) ? 'ночь' : 'глубокая ночь',
            // Обновляем флаг дневного времени
            isDayTime: action.payload.hour >= 6 && action.payload.hour < 20
          }
        };
      } else {
        // Если сезон не изменился, обновляем только weather
        return {
          ...state,
          weather: {
            ...state.weather,
            currentTime: action.payload.currentTime,
            formattedTime: action.payload.formattedTime,
            hour: action.payload.hour, // Важно гарантировать, что это число
            minute: action.payload.minute, // Важно гарантировать, что это число
            dayCount: dayCount, // Явно устанавливаем dayCount как число
            seasonDay: directUpdateSeasonDay, // Используем вычисленный день сезона
            currentSeason: directUpdateSeason, // Используем вычисленный сезон
            // Определяем период суток на основе часа
            timeOfDay: 
              (action.payload.hour >= 5 && action.payload.hour < 7) ? 'рассвет' :
              (action.payload.hour >= 7 && action.payload.hour < 11) ? 'утро' :
              (action.payload.hour >= 11 && action.payload.hour < 14) ? 'полдень' :
              (action.payload.hour >= 14 && action.payload.hour < 17) ? 'день' :
              (action.payload.hour >= 17 && action.payload.hour < 20) ? 'вечер' :
              (action.payload.hour >= 20 && action.payload.hour < 23) ? 'ночь' : 'глубокая ночь',
            // Обновляем флаг дневного времени
            isDayTime: action.payload.hour >= 6 && action.payload.hour < 20
          }
        };
      }
      
    // Принудительная синхронизация времени из world.time в weather
    case 'DIRECT_FORCE_SYNC_WEATHER_TIME':
      // Только если оба объекта существуют
      if (!state.world?.time || !state.weather) {
        console.log('⚠️ Невозможно выполнить DIRECT_FORCE_SYNC_WEATHER_TIME: отсутствуют world.time или weather');
        return state;
      }
      
      console.log('🔄🔄 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ weather ⟸ world.time');
      
      // Получаем значения из worldTime с приведением типов для надежности
      const worldTimeHour = Number(state.world.time.hour);
      const worldTimeMinute = Number(state.world.time.minute);
      const worldTimeDay = Number(state.world.time.day);
      const worldTimeSeason = state.world.time.season;
      
      // Вычисляем значения на основе этих данных
      const syncTotalMinutes = worldTimeHour * 60 + worldTimeMinute;
      const syncFormattedTime = `${String(worldTimeHour).padStart(2, '0')}:${String(worldTimeMinute).padStart(2, '0')}`;
      
      // Определяем период суток
      const syncTimeOfDay = 
        (worldTimeHour >= 5 && worldTimeHour < 7) ? 'рассвет' :
        (worldTimeHour >= 7 && worldTimeHour < 11) ? 'утро' :
        (worldTimeHour >= 11 && worldTimeHour < 14) ? 'полдень' :
        (worldTimeHour >= 14 && worldTimeHour < 17) ? 'день' :
        (worldTimeHour >= 17 && worldTimeHour < 20) ? 'вечер' :
        (worldTimeHour >= 20 && worldTimeHour < 23) ? 'ночь' : 'глубокая ночь';
      
      // Используем вычисления как в UPDATE_TIME для корректной обработки переходов сезона
      
      // Вычисляем правильный день сезона и сезон
      let syncSeasonDay, syncSeason = worldTimeSeason;
      
      // Проверяем, превышает ли день длину сезона
      if (worldTimeDay > SEASON_LENGTH) {
        syncSeasonDay = calculateSeasonDay(worldTimeDay);
        syncSeason = calculateSeason(worldTimeDay);
        
        console.log('🌈 FORCE_SYNC: РАСЧЕТ СЕЗОНА ПРИ ПЕРЕХОДЕ ЧЕРЕЗ МАКСИМАЛЬНУЮ ДЛИНУ:', {
          мировой_день: worldTimeDay,
          вычисленный_день_сезона: syncSeasonDay,
          текущий_сезон: worldTimeSeason,
          вычисленный_сезон: syncSeason,
          длина_сезона: SEASON_LENGTH
        });
        
        // Если сезон вычислен и отличается от переданного, обновляем
        if (syncSeason && syncSeason !== worldTimeSeason) {
          console.log(`🌈🌈 FORCE_SYNC: ОБНАРУЖЕНО НЕСООТВЕТСТВИЕ СЕЗОНА: ${worldTimeSeason} -> ${syncSeason}`);
          
          // Здесь мы НЕ обновляем worldTimeSeason, так как это влияет на world.time,
          // вместо этого просто отмечаем, что будем использовать syncSeason
        }
      } else {
        // Если день в пределах длины сезона
        syncSeasonDay = worldTimeDay;
      }
      
      console.log('🔄 FORCE_SYNC: Синхронизация данных:', {
        from: {
          hour: worldTimeHour,
          minute: worldTimeMinute,
          day: worldTimeDay,
          season: worldTimeSeason
        },
        to: {
          currentTime: syncTotalMinutes,
          formattedTime: syncFormattedTime,
          hour: worldTimeHour,
          minute: worldTimeMinute,
          dayCount: worldTimeDay,
          seasonDay: syncSeasonDay,
          timeOfDay: syncTimeOfDay,
          isDayTime: worldTimeHour >= 6 && worldTimeHour < 20,
          currentSeason: syncSeason
        }
      });
      
      // Возвращаем новое состояние с синхронизированными значениями и обновлением world.time
      return {
        ...state,
        world: {
          ...state.world,
          time: {
            ...state.world.time,
            season: syncSeason // Обновляем сезон на основе вычислений
          }
        },
        weather: {
          ...state.weather,
          currentTime: syncTotalMinutes,
          formattedTime: syncFormattedTime,
          hour: worldTimeHour,
          minute: worldTimeMinute,
          dayCount: worldTimeDay,
          seasonDay: syncSeasonDay, // Используем вычисленный день сезона
          timeOfDay: syncTimeOfDay,
          isDayTime: worldTimeHour >= 6 && worldTimeHour < 20,
          currentSeason: syncSeason // Используем вычисленный сезон
        }
      };
      
    // ОБРАБОТЧИК: Правильная синхронизация дня сезона с мировым днем
    case 'SYNC_SEASON_DAY':
      // Только если оба объекта существуют
      if (!state.world?.time || !state.weather) {
        console.log('⚠️ Невозможно выполнить SYNC_SEASON_DAY: отсутствуют world.time или weather');
        return state;
      }
      
      const worldDaySync = Number(state.world.time.day);
      const currentSeasonDaySync = state.weather.seasonDay || 1;
      
      // Важное исправление: вычисляем правильный день сезона, если мировой день превышает длину сезона
      let calculatedSeasonDaySync;
      
      if (worldDaySync > SEASON_LENGTH) {
        // Используем ту же формулу, что и в calculateSeasonDay
        calculatedSeasonDaySync = ((worldDaySync - 1) % SEASON_LENGTH) + 1;
        
        console.log('🔄 SYNC_SEASON_DAY: Корректировка дня сезона для дня > SEASON_LENGTH:', {
          worldDay: worldDaySync,
          currentSeasonDay: currentSeasonDaySync,
          вычисленныйДеньСезона: calculatedSeasonDaySync,
          формула: `((${worldDaySync} - 1) % ${SEASON_LENGTH}) + 1 = ${calculatedSeasonDaySync}`
        });
      } else {
        // Если день в пределах длины сезона, день сезона = мировому дню
        calculatedSeasonDaySync = worldDaySync;
        
        console.log('🔄 SYNC_SEASON_DAY: День в пределах сезона:', {
          worldDay: worldDaySync,
          currentSeasonDay: currentSeasonDaySync
        });
      }
      
      // Возвращаем новое состояние с правильно вычисленным днем сезона
      return {
        ...state,
        weather: {
          ...state.weather,
          seasonDay: calculatedSeasonDaySync // Используем вычисленный день сезона
        }
      };
    
    // Обработчик для принудительной смены погоды
    case 'FORCE_WEATHER_CHANGE':
      console.log('🌤️ Reducer: получен FORCE_WEATHER_CHANGE');
      
      // Проверяем, что погода существует
      if (!state.weather) {
        console.error('❌ FORCE_WEATHER_CHANGE: state.weather отсутствует');
        return state;
      }
      
      try {
        // Используем адаптер сервиса погоды вместо прямого импорта
        const WeatherService = require('../../services/weather-service-adapter');
        
        // Получаем текущее время из world.time для правильного расчета weatherChangeAt
        const currentHour = state.world?.time?.hour || state.weather.hour || 0;
        const currentMinute = state.world?.time?.minute || state.weather.minute || 0;
        const currentAbsoluteMinutes = currentHour * 60 + currentMinute;
        
        // Вызываем статический метод для принудительной смены погоды
        const updatedWeather = WeatherService.forceWeatherChange(state.weather, state.world?.currentLocation);
        
        // УЛУЧШЕНИЕ: Проверяем и логируем weatherChangeAt и nextWeatherChange
        if (updatedWeather.weatherChangeAt === undefined && updatedWeather.nextWeatherChange !== undefined) {
          // Если weatherChangeAt отсутствует, но есть nextWeatherChange, вычисляем weatherChangeAt
          updatedWeather.weatherChangeAt = currentAbsoluteMinutes + updatedWeather.nextWeatherChange;
          console.log('⚠️ FORCE_WEATHER_CHANGE: weatherChangeAt отсутствует, вычисляем:', {
            currentAbsoluteMinutes,
            nextWeatherChange: updatedWeather.nextWeatherChange,
            weatherChangeAt: updatedWeather.weatherChangeAt
          });
        } else if (updatedWeather.weatherChangeAt !== undefined && updatedWeather.nextWeatherChange === undefined) {
          // Если weatherChangeAt есть, но nextWeatherChange отсутствует, вычисляем nextWeatherChange
          updatedWeather.nextWeatherChange = Math.max(0, updatedWeather.weatherChangeAt - currentAbsoluteMinutes);
          console.log('⚠️ FORCE_WEATHER_CHANGE: nextWeatherChange отсутствует, вычисляем:', {
            currentAbsoluteMinutes,
            weatherChangeAt: updatedWeather.weatherChangeAt,
            nextWeatherChange: updatedWeather.nextWeatherChange
          });
        }
        
        // Проверяем корректность значений
        const validNextWeatherChange = typeof updatedWeather.nextWeatherChange === 'number' && 
                                    !isNaN(updatedWeather.nextWeatherChange);
        const validWeatherChangeAt = typeof updatedWeather.weatherChangeAt === 'number' && 
                                   !isNaN(updatedWeather.weatherChangeAt);
        
        if (!validNextWeatherChange || !validWeatherChangeAt) {
          console.error('⚠️ FORCE_WEATHER_CHANGE: Некорректные значения счетчиков погоды:', {
            nextWeatherChange: updatedWeather.nextWeatherChange,
            weatherChangeAt: updatedWeather.weatherChangeAt
          });
          
          // Устанавливаем безопасные значения по умолчанию
          if (!validNextWeatherChange) updatedWeather.nextWeatherChange = 60;
          if (!validWeatherChangeAt) updatedWeather.weatherChangeAt = currentAbsoluteMinutes + 60;
        }
        
        console.log('✅ FORCE_WEATHER_CHANGE: погода успешно обновлена', {
          новая_погода: updatedWeather.currentWeather,
          интенсивность: updatedWeather.weatherIntensity,
          время_до_следующей_смены: updatedWeather.nextWeatherChange,
          абсолютное_время_смены: updatedWeather.weatherChangeAt
        });
        
        // Возвращаем обновленное состояние
        return {
          ...state,
          weather: updatedWeather
        };
      } catch (error) {
        console.error('❌ FORCE_WEATHER_CHANGE: ошибка при обновлении погоды', error);
        return state;
      }
      
    // Специальный обработчик для исправления ТОЛЬКО минут
    // Обработчик для обновления множителя времени
    case 'UPDATE_TIME_MULTIPLIER':
      console.log('⏱️ Reducer: получен UPDATE_TIME_MULTIPLIER с multiplier =', action.payload?.multiplier);
      
      // Обновляем только UI, не меняя состояние
      // Это просто сигнал, что множитель изменился, и нужно обновить интерфейс
      
      return state;
      
    case 'FIX_WEATHER_MINUTES':
      // Проверяем, есть ли необходимые данные
      if (!state.weather || action.payload?.minute === undefined) {
        console.log('⚠️ FIX_WEATHER_MINUTES: невозможно обновить минуты, отсутствуют данные');
        return state;
      }
      
      console.log('🔧 Выполняется FIX_WEATHER_MINUTES: исправление минут', {
        currentMinute: state.weather.minute,
        newMinute: action.payload.minute,
        minuteType: typeof action.payload.minute
      });
      
      // Конвертируем минуту в число для надежности
      const fixedMinute = parseInt(action.payload.minute, 10);
      
      if (isNaN(fixedMinute)) {
        console.error('⚠️ FIX_WEATHER_MINUTES: невозможно преобразовать minute в число', action.payload.minute);
        return state;
      }
      
      // Пересчитываем значение currentTime с учетом обновленных минут
      const hour = state.weather.hour !== undefined ? parseInt(state.weather.hour, 10) : 0;
      const newTotalMinutes = hour * 60 + fixedMinute;
      
      // Форматированное время тоже обновляем
      const newFormattedTime = `${String(hour).padStart(2, '0')}:${String(fixedMinute).padStart(2, '0')}`;
      
      console.log('✅ FIX_WEATHER_MINUTES: успешно обновляем минуты', {
        hour,
        newMinute: fixedMinute,
        newTotalMinutes,
        newFormattedTime
      });
      
      // Возвращаем обновленное состояние
      return {
        ...state,
        weather: {
          ...state.weather,
          minute: fixedMinute, // Обновляем минуту напрямую
          currentTime: newTotalMinutes, // Также обновляем общее время в минутах
          formattedTime: newFormattedTime // И форматированное время
        }
      };
      
    // Прямое добавление игровых часов
    case 'DIRECT_ADD_GAME_HOURS':
      // Проверяем, что world.time существует
      if (!state.world?.time) {
        console.error('❌ DIRECT_ADD_GAME_HOURS: state.world.time отсутствует');
        return state;
      }
      
      console.log(`🕒 DIRECT_ADD_GAME_HOURS: Добавление ${action.payload.hours} игровых часов`);
      
      // Получаем текущие значения времени с приведением типов
      const gameCurrentHour = Number(state.world.time.hour);
      const gameCurrentMinute = Number(state.world.time.minute);
      const gameCurrentDay = Number(state.world.time.day);
      const gameCurrentSeason = state.world.time.season;
      
      // Рассчитываем новое время
      let gameNewHour = gameCurrentHour + action.payload.hours;
      let gameNewMinute = gameCurrentMinute;
      let gameNewDay = gameCurrentDay;
      
      // Обрабатываем переход на новый день
      while (gameNewHour >= 24) {
        gameNewHour -= 24;
        gameNewDay += 1;
      }
      
      // Обновляем время
      const gameNewHourInMinutes = gameNewHour * 60 + gameNewMinute;
      const gameFormattedTimeValue = `${String(gameNewHour).padStart(2, '0')}:${String(gameNewMinute).padStart(2, '0')}`;
      const gameTimeOfDayValue = 
        (gameNewHour >= 5 && gameNewHour < 7) ? 'рассвет' :
        (gameNewHour >= 7 && gameNewHour < 11) ? 'утро' :
        (gameNewHour >= 11 && gameNewHour < 14) ? 'полдень' :
        (gameNewHour >= 14 && gameNewHour < 17) ? 'день' :
        (gameNewHour >= 17 && gameNewHour < 20) ? 'вечер' :
        (gameNewHour >= 20 && gameNewHour < 23) ? 'ночь' : 'глубокая ночь';
      
      // Логируем изменение дня, если произошло
      if (gameNewDay > gameCurrentDay) {
        console.log(`📅📅📅 ДЕНЬ ИЗМЕНИЛСЯ при добавлении часов: ${gameCurrentDay} -> ${gameNewDay}`);
      }
      
      // Вычисляем правильный день сезона и сезон при добавлении часов
      let gameCalculatedSeasonDay, gameCalculatedSeason = gameCurrentSeason;
      
      // Проверяем, превышает ли новый день длину сезона
      if (gameNewDay > SEASON_LENGTH) {
        gameCalculatedSeasonDay = calculateSeasonDay(gameNewDay);
        gameCalculatedSeason = calculateSeason(gameNewDay);
        
        console.log('🌈 DIRECT_ADD_GAME_HOURS: РАСЧЕТ СЕЗОНА ПРИ ПЕРЕХОДЕ ЧЕРЕЗ МАКСИМАЛЬНУЮ ДЛИНУ:', {
          мировой_день: gameNewDay,
          вычисленный_день_сезона: gameCalculatedSeasonDay,
          текущий_сезон: gameCurrentSeason,
          вычисленный_сезон: gameCalculatedSeason,
          длина_сезона: SEASON_LENGTH
        });
        
        // Если вычисленный сезон отличается от текущего, логируем изменение
        if (gameCalculatedSeason !== gameCurrentSeason) {
          console.log(`🌈🌈 DIRECT_ADD_GAME_HOURS: СМЕНА СЕЗОНА: ${gameCurrentSeason} -> ${gameCalculatedSeason}`);
        }
      } else {
        // Если день в пределах длины сезона
        gameCalculatedSeasonDay = gameNewDay;
      }
      
      // Обновляем weather синхронно с учетом вычисленных значений сезона
      const gameUpdatedWeather = {
        ...state.weather,
        currentTime: gameNewHourInMinutes,
        formattedTime: gameFormattedTimeValue,
        hour: gameNewHour,
        minute: gameNewMinute,
        dayCount: gameNewDay,
        seasonDay: gameCalculatedSeasonDay, // Используем вычисленный день сезона
        currentSeason: gameCalculatedSeason, // Используем вычисленный сезон
        timeOfDay: gameTimeOfDayValue,
        isDayTime: gameNewHour >= 6 && gameNewHour < 20
      };
      
      console.log('✅ DIRECT_ADD_GAME_HOURS: Новые значения времени:', {
        час: gameNewHour,
        минута: gameNewMinute,
        день: gameNewDay,
        сезон: gameCalculatedSeason, // Используем вычисленный сезон для логов
        период_суток: gameTimeOfDayValue
      });
      
      // Возвращаем обновленное состояние
      return {
        ...state,
        world: {
          ...state.world,
          time: {
            ...state.world.time,
            hour: gameNewHour,
            minute: gameNewMinute,
            day: gameNewDay,
            season: gameCalculatedSeason // Обновляем сезон и в world.time тоже!
          },
        },
        weather: gameUpdatedWeather
      };
      
    case ACTION_TYPES.ADD_EVENT:
      return {
        ...state,
        world: {
          ...state.world,
          events: [...state.world.events, action.payload],
        },
      };
      
    case ACTION_TYPES.REMOVE_EVENT:
      return {
        ...state,
        world: {
          ...state.world,
          events: state.world.events.filter(event => event.id !== action.payload),
        },
      };
    
    case ACTION_TYPES.CACHE_GENERATED_ENEMY:
      const { areaId, enemyId, enemy } = action.payload;
      const key = `${areaId}_${enemyId}`;
      
      console.log(`🎮 Кэширование противника: ${key}`, {
        уровень: enemy.level,
        requiredLevel: enemy.requiredLevel
      });
      
      return {
        ...state,
        world: {
          ...state.world,
          generatedEnemies: {
            ...(state.world.generatedEnemies || {}),
            [key]: enemy
          }
        }
      };
      
    default:
      return state;
  }
};

// Инициализация начального состояния погоды
export const initializeWeatherState = (state) => {
  // Если weather полностью отсутствует
  if (!state.weather) {
    console.log('🔄 initializeWeatherState: state.weather отсутствует, создаем новый объект');
    return {
      ...state,
      weather: initialWeatherState
    };
  }
  
  // Если weather существует, но нужно синхронизировать данные с world.time
  if (state.weather && state.world && state.world.time) {
    // Создаем обновленный объект weather с синхронизированными данными
    let updatedWeather = {...state.weather};
    let wasUpdated = false;
    
    // Синхронизируем время, если есть hour и minute в world.time
    if (typeof state.world.time.hour === 'number' && typeof state.world.time.minute === 'number') {
      const hour = state.world.time.hour;
      const minute = state.world.time.minute;
      const currentTime = hour * 60 + minute;
      
      // Обновляем все поля, связанные со временем
      updatedWeather = {
        ...updatedWeather,
        currentTime,
        hour,
        minute,
        formattedTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        timeOfDay: 
          (hour >= 5 && hour < 7) ? 'рассвет' :
          (hour >= 7 && hour < 11) ? 'утро' :
          (hour >= 11 && hour < 14) ? 'полдень' :
          (hour >= 14 && hour < 17) ? 'день' :
          (hour >= 17 && hour < 20) ? 'вечер' :
          (hour >= 20 && hour < 23) ? 'ночь' : 'глубокая ночь',
        isDayTime: hour >= 6 && hour < 20
      };
      
      wasUpdated = true;
      console.log(`🔄 initializeWeatherState: Синхронизируем время: ${hour}:${minute} -> ${currentTime}`);
    }
    
    // Синхронизируем день и сезон, если он есть в world.time
    if (typeof state.world.time.day === 'number') {
      const worldDay = state.world.time.day;
      let seasonDay, calculatedSeason;
      
      updatedWeather.dayCount = worldDay;
      
      // Проверяем, превышает ли день длину сезона
      if (worldDay > SEASON_LENGTH) {
        // Вычисляем день сезона и сезон по формуле
        seasonDay = calculateSeasonDay(worldDay);
        calculatedSeason = calculateSeason(worldDay);
        
        console.log('🌈 initializeWeatherState: РАСЧЕТ СЕЗОНА ПРИ ИНИЦИАЛИЗАЦИИ:', {
          мировой_день: worldDay,
          вычисленный_день_сезона: seasonDay,
          вычисленный_сезон: calculatedSeason
        });
        
        // Если сезон в state.world.time отличается от вычисленного, используем вычисленный
        if (state.world.time.season && calculatedSeason !== state.world.time.season) {
          console.log(`🌈🌈 initializeWeatherState: КОРРЕКЦИЯ СЕЗОНА: ${state.world.time.season} -> ${calculatedSeason}`);
        }
        
        // Устанавливаем вычисленные значения
        updatedWeather.seasonDay = seasonDay;
        updatedWeather.currentSeason = calculatedSeason;
      } else {
        // Если день в пределах длины сезона
        updatedWeather.seasonDay = worldDay;
        
        // Если сезон задан, используем его, иначе рассчитываем
        if (state.world.time.season) {
          updatedWeather.currentSeason = state.world.time.season;
        } else {
          // Если сезон не задан, вычисляем его
          updatedWeather.currentSeason = 'spring'; // По умолчанию весна
        }
      }
      
      wasUpdated = true;
      console.log(`🔄 initializeWeatherState: Синхронизируем день и сезон:`, {
        мировой_день: worldDay,
        день_сезона: updatedWeather.seasonDay,
        сезон: updatedWeather.currentSeason
      });
    }
    
    // Возвращаем обновленное состояние, если были изменения
    if (wasUpdated) {
      // Обновляем также world.time.season, если день превышает длину сезона
      // и вычисленный сезон отличается от текущего сезона в world.time
      if (typeof state.world.time.day === 'number' && 
          state.world.time.day > SEASON_LENGTH && 
          state.world.time.season && 
          updatedWeather.currentSeason !== state.world.time.season) {
        
        console.log(`🌈 initializeWeatherState: СИНХРОНИЗАЦИЯ СЕЗОНА В WORLD.TIME:`, {
          текущий_сезон_world_time: state.world.time.season,
          вычисленный_сезон: updatedWeather.currentSeason,
          день: state.world.time.day
        });
        
        return {
          ...state,
          world: {
            ...state.world,
            time: {
              ...state.world.time,
              season: updatedWeather.currentSeason // Обновляем сезон в world.time
            }
          },
          weather: updatedWeather
        };
      }
      
      // Если не нужно обновлять world.time.season, просто обновляем weather
      return {
        ...state,
        weather: updatedWeather
      };
    }
  }
  
  return state;
};
