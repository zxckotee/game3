import ACTION_TYPES from './actionTypes';

const {
  WEATHER_INIT,
  WEATHER_UPDATE,
  WEATHER_CHANGE,
  SEASON_CHANGE,
  TIME_PERIOD_CHANGE,
  APPLY_WEATHER_EFFECTS
} = ACTION_TYPES;

/**
 * Инициализирует систему погоды и времени
 * @param {Object} location - Информация о текущей локации
 * @return {Object} Action-объект для редьюсера
 */
export const initWeather = (location) => ({
  type: WEATHER_INIT,
  payload: { location }
});

/**
 * Обновляет время и, возможно, погоду
 * @param {Object} currentState - Текущее состояние погоды и времени
 * @param {Object} location - Информация о текущей локации
 * @param {Number} minutesToAdd - Количество минут для добавления (по умолчанию 10)
 * @return {Object} Action-объект для редьюсера
 */
export const updateWeather = (currentState, location, minutesToAdd = 10) => ({
  type: WEATHER_UPDATE,
  payload: { currentState, location, minutesToAdd }
});

/**
 * Изменяет текущую погоду
 * @param {String} weatherType - Новый тип погоды
 * @param {Number} intensity - Интенсивность погоды (0-100)
 * @return {Object} Action-объект для редьюсера
 */
export const changeWeather = (weatherType, intensity = 50) => ({
  type: WEATHER_CHANGE,
  payload: { weatherType, intensity }
});

/**
 * Изменяет текущий сезон
 * @param {String} season - Новый сезон
 * @param {Number} day - День сезона (по умолчанию 1)
 * @return {Object} Action-объект для редьюсера
 */
export const changeSeason = (season, day = 1) => ({
  type: SEASON_CHANGE,
  payload: { season, day }
});

/**
 * Изменяет текущий период дня
 * @param {String} period - Новый период дня
 * @return {Object} Action-объект для редьюсера
 */
export const changeTimePeriod = (period) => ({
  type: TIME_PERIOD_CHANGE,
  payload: { period }
});

/**
 * Применяет эффекты погоды к игроку
 * @param {Object} player - Объект игрока
 * @param {Object} weatherState - Текущее состояние погоды
 * @return {Object} Action-объект для редьюсера
 */
export const applyWeatherEffects = (player, weatherState) => ({
  type: APPLY_WEATHER_EFFECTS,
  payload: { player, weatherState }
});

/**
 * Прямое обновление времени (для специальных событий или отладки)
 * @param {Object} timeData - Объект с информацией о времени
 * @return {Object} Action-объект для редьюсера
 */
export const updateTime = (timeData) => ({
  type: 'WORLD_UPDATE_TIME',
  payload: { time: timeData }
});
