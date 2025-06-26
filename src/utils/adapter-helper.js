/**
 * Создает безопасный адаптер, предотвращающий проблемы с циклическими зависимостями
 * @param {Object} service - Сервис, для которого создается адаптер
 * @param {Object} defaultValues - Значения по умолчанию для свойств
 * @returns {Object} - Безопасный прокси-адаптер
 */
function createSafeAdapter(service, defaultValues = {}) {
  // Создаем объект с кэшированными значениями 
  // для предотвращения бесконечной рекурсии
  const cache = {};
  const adapter = {};
  
  // Добавляем промежуточные прокси-методы
  for (const key in service) {
    // Пропускаем унаследованные свойства
    if (!Object.prototype.hasOwnProperty.call(service, key)) continue;
    
    if (typeof service[key] === 'function') {
      // Для методов создаем обертки
      adapter[key] = function() {
        try {
          return service[key].apply(service, arguments);
        } catch (error) {
          console.warn(`Ошибка при вызове ${key}:`, error);
          // Возвращаем значение по умолчанию в зависимости от ожидаемого типа
          return Array.isArray(defaultValues[key]) ? [] : 
                 (defaultValues[key] || null);
        }
      };
    } else {
      // Для свойств используем кэширование при первом доступе
      Object.defineProperty(adapter, key, {
        get: function() {
          // Если значение уже в кэше, возвращаем его
          if (key in cache) {
            return cache[key];
          }
          
          try {
            // Пытаемся получить реальное значение
            const value = service[key];
            // Кэшируем результат для предотвращения повторного обращения
            cache[key] = value !== undefined ? value : (defaultValues[key] || null);
            return cache[key];
          } catch (error) {
            // В случае ошибки используем значение по умолчанию
            console.warn(`Ошибка при получении ${key}:`, error);
            cache[key] = defaultValues[key] || null;
            return cache[key];
          }
        },
        enumerable: true,
        configurable: true
      });
    }
  }
  
  return adapter;
}

module.exports = { createSafeAdapter };