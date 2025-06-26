// Экшены для погодной системы
import ACTION_TYPES from './actionTypes';

// Экспортируем константы для экшенов погоды
export const UPDATE_WEATHER = 'UPDATE_WEATHER';
export const SET_TIME_OF_DAY = 'SET_TIME_OF_DAY';
export const WEATHER_SPECIAL_EVENT = 'WEATHER_SPECIAL_EVENT';
export const UPDATE_GAME_TIME = 'UPDATE_GAME_TIME';
export const FORCE_WEATHER_CHANGE = 'FORCE_WEATHER_CHANGE';
export const INITIALIZE_WEATHER = ACTION_TYPES.INITIALIZE_WEATHER;

/**
 * Обновление состояния погоды
 * @param {Object} weatherData - Новые данные о погоде
 * @returns {Object} - Объект действия Redux
 */
export const updateWeather = (weatherData) => {
  console.log('🌦️ Создание экшена updateWeather с данными:', weatherData);
  return {
    type: UPDATE_WEATHER,
    payload: weatherData
  };
};

// Установка времени суток
export const setTimeOfDay = (timeOfDay) => ({
  type: SET_TIME_OF_DAY,
  payload: {
    timeOfDay
  }
});

// Особое погодное событие
export const triggerWeatherEvent = (eventType, eventData) => ({
  type: WEATHER_SPECIAL_EVENT,
  payload: {
    eventType,
    eventData
  }
});

// Обновление игрового времени (вызывается по таймеру)
/**
 * Создает действие для обновления игрового времени
 * @param {number} minutesToAdd - Количество реальных минут, прошедших с последнего обновления
 * @param {boolean} isManual - Флаг, указывающий на ручное обновление (кнопками)
 * @returns {Object} - Объект действия Redux
 */
export const updateGameTime = (minutesToAdd = 1, isManual = false) => {
  // Убедимся, что minutesToAdd - число
  const minutes = typeof minutesToAdd === 'number' ? minutesToAdd : 1;
  
  console.log(`🕒 Создание экшена updateGameTime с ${minutes} минутами (ручное: ${isManual ? 'да' : 'нет'})`);
  
  // Возвращаем правильно сформированный экшен
  return {
    type: UPDATE_GAME_TIME,
    payload: {
      minutesToAdd: minutes, // Количество реальных минут, которые нужно добавить
      isManual: isManual,    // Флаг ручного обновления
      timestamp: Date.now()  // Добавляем временную метку для более точного отслеживания
    }
  };
};

/**
 * Принудительно меняет текущую погоду на новую случайную
 * @returns {Object} - Объект действия Redux
 */
export const forceWeatherChange = () => {
  console.log('🌦️ Принудительная смена погоды (вызвано через отладочную панель)');
  return {
    type: FORCE_WEATHER_CHANGE,
    payload: {
      timestamp: Date.now()  // Временная метка для отслеживания
    }
  };
};

/**
 * Инициализирует погоду с прогнозом
 * @returns {Object} - Объект действия Redux
 */
export const initializeWeather = () => {
  console.log('🌦️ Запуск полной инициализации погоды с прогнозом');
  return {
    type: INITIALIZE_WEATHER,
    payload: {
      timestamp: Date.now()  // Временная метка для отслеживания
    }
  };
};

// Middleware вынесен в отдельный файл src/context/middleware/weatherMiddleware.js
