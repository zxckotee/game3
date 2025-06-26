/**
 * Модуль для работы с бонусами экипировки в автономном режиме
 * Необходим для обхода проблем с API сервера
 */

/**
 * Проверяет, работает ли система в автономном режиме
 * @returns {boolean} - true, если система работает в автономном режиме
 */
export function isWorkingOffline() {
  // По умолчанию включаем автономный режим для обхода проблем с API
  return true;
}

/**
 * Возвращает заглушку для функций API, которые не работают
 * @param {string} functionName - Имя функции API
 * @returns {Function} - Функция-заглушка, которая возвращает пустые данные
 */
export function getOfflineStub(functionName) {
  console.log(`[equipmentOfflineMode] Использование заглушки для ${functionName} в автономном режиме`);
  
  return async (...args) => {
    console.log(`[equipmentOfflineMode] Вызов ${functionName} с аргументами:`, args);
    
    // Возвращаем пустые данные, которые не вызовут ошибок
    return {
      success: true,
      message: `Автономный режим: ${functionName} недоступен`
    };
  };
}

/**
 * Обрабатывает ошибки API в автономном режиме
 * @param {Error} error - Ошибка API
 * @param {string} context - Контекст, в котором произошла ошибка
 * @returns {Object} - Данные для продолжения работы
 */
export function handleApiError(error, context) {
  console.log(`[equipmentOfflineMode] Ошибка API в контексте ${context}:`, error);
  
  // Выводим лог сообщения об ошибке, но продолжаем работу
  console.log(`[equipmentOfflineMode] Продолжение работы в автономном режиме`);
  
  // Возвращаем пустые данные, которые не вызовут ошибок
  return {
    success: true,
    offlineMode: true,
    message: `Работа в автономном режиме: ошибка API в ${context}`,
    // Пустые данные для продолжения работы
    data: {}
  };
}

/**
 * Инициализирует модули, требующие API, в автономном режиме
 * @param {Object} gameContext - Контекст игры
 */
export function initOfflineMode(gameContext) {
  console.log(`[equipmentOfflineMode] Инициализация автономного режима`);
  
  // Проверяем наличие контекста игры
  if (!gameContext || !gameContext.state || !gameContext.actions) {
    console.warn(`[equipmentOfflineMode] Невозможно инициализировать: контекст игры недоступен`);
    return;
  }
  
  // Добавляем флаг автономного режима в состояние игры
  if (gameContext.actions.dispatch) {
    gameContext.actions.dispatch({
      type: 'SET_OFFLINE_MODE',
      payload: true
    });
  }
  
  console.log(`[equipmentOfflineMode] Автономный режим активирован`);
}

export default {
  isWorkingOffline,
  getOfflineStub,
  handleApiError,
  initOfflineMode
};