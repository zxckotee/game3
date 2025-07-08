import ACTION_TYPES from '../actions/actionTypes';

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

// Редуктор для обработки действий, связанных с игровым миром
export const worldReducer = (state, action) => {
  switch (action.type) {
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
      
      console.log('🕒 ОБНОВЛЕНИЕ ВРЕМЕНИ:', {
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
      
      // Формируем информацию о времени для логирования
      const gameTimeInfo = {
        hour: gameNewHour,
        minute: gameNewMinute,
        day: gameNewDay,
        season: gameCalculatedSeason,
        timeOfDay: gameTimeOfDayValue
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

