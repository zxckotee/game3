/**
 * API-сервис для работы с инвентарем
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с инвентарем через API
 */
class InventoryServiceAPI {
  /**
   * Получение всех предметов инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив предметов инвентаря
   */
  static async getInventoryItems(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/inventory`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении предметов инвентаря');
      }

      const rawItems = await response.json();
      
      // Преобразуем полученные данные в формат для Redux, как на первом скриншоте
      const processedItems = rawItems.map(item => ({
        id: item.itemId || item.item_id,
        name: item.name || (item.stats && item.stats.name) || 'Неизвестный предмет',
        type: item.type || item.item_type || (item.stats && item.stats.type) || 'misc',
        quality: item.rarity || (item.stats && (item.stats.quality || item.stats.rarity)) || 'common',
        rarity: item.rarity || (item.stats && (item.stats.quality || item.stats.rarity)) || 'common', // для совместимости
        description: item.description || (item.stats && item.stats.description) || '',
        quantity: item.quantity || 1,
        equipped: item.equipped || false,
        image_url: item.image_url,
        // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
        ...(item.stats ? Object.fromEntries(
          Object.entries(item.stats).filter(([key]) =>
            !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
          )
        ) : {})
      }));

      console.log('Преобразованные данные инвентаря:', processedItems);
      return processedItems;
    } catch (error) {
      console.error('Ошибка при получении предметов инвентаря:', error);
      throw error;
    }
  }

  /**
   * Добавление предмета в инвентарь
   * @param {number} userId - ID пользователя
   * @param {Object} item - Данные о предмете
   * @returns {Promise<Object>} - Добавленный предмет
   */
  static async addInventoryItem(userId, item) {
    try {
      // Формируем данные для отправки, выделяя основные поля в корень запроса
      const itemData = {
        itemId: item.id,
        name: item.name || 'Неизвестный предмет', // Имя в корне запроса
        description: item.description || '', // Описание в корне запроса
        type: item.type || '', // Тип в корне запроса (в формате Redux) - не используем 'misc' по умолчанию
        rarity: item.rarity || item.quality || 'common', // Используем и rarity, и quality для совместимости
        quantity: item.quantity || 1,
        equipped: item.equipped || false,
        // Остальные данные в stats для сохранения полной информации о предмете
        stats: {
          // Сохраняем те же поля и в stats для обратной совместимости
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity || item.quality,
          quality: item.quality || item.rarity, // Дублируем поле для совместимости с Redux
          effects: item.effects,
          requirements: item.requirements,
          value: item.value,
          ...item // Включаем все остальные поля
        }
      };

      console.log('Отправка предмета на сервер:', itemData);

      const response = await fetch(`${API_URL}/users/${userId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при добавлении предмета в инвентарь');
      }

      const newItem = await response.json();
      
      // Преобразуем в формат Redux (как на первом скриншоте)
      const processedItem = {
        id: newItem.itemId || newItem.item_id,
        name: newItem.name || (newItem.stats && newItem.stats.name) || 'Неизвестный предмет',
        type: newItem.type || newItem.item_type || (newItem.stats && newItem.stats.type) || '',
        quality: newItem.rarity || (newItem.stats && (newItem.stats.quality || newItem.stats.rarity)) || 'common',
        rarity: newItem.rarity || (newItem.stats && (newItem.stats.quality || newItem.stats.rarity)) || 'common', // для совместимости
        description: newItem.description || (newItem.stats && newItem.stats.description) || '',
        quantity: newItem.quantity || 1,
        equipped: newItem.equipped || false,
        // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
        ...(newItem.stats ? Object.fromEntries(
          Object.entries(newItem.stats).filter(([key]) =>
            !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
          )
        ) : {})
      };
      
      console.log('Обработанный предмет после добавления:', processedItem);
      
      return processedItem;
    } catch (error) {
      console.error('Ошибка при добавлении предмета в инвентарь:', error);
      throw error;
    }
  }

  /**
   * Удаление предмета из инвентаря
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @param {number} quantity - Количество предметов для удаления (по умолчанию 1)
   * @returns {Promise<boolean>} - Результат удаления
   */
  static async removeInventoryItem(userId, itemId, quantity = 1) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/inventory/${itemId}?quantity=${quantity}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении предмета из инвентаря');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Ошибка при удалении предмета из инвентаря:', error);
      throw error;
    }
  }

  /**
   * Экипировка/снятие предмета
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @param {boolean} equipped - Флаг экипировки
   * @returns {Promise<Object>} - Обновленный предмет
   */
  static async toggleEquipItem(userId, itemId, equipped) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/inventory/${itemId}/equip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ equipped }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при экипировке/снятии предмета');
      }

      const updatedItem = await response.json();
      
      // Преобразуем в формат Redux (как на первом скриншоте)
      const processedItem = {
        id: updatedItem.itemId || updatedItem.item_id,
        name: updatedItem.name || (updatedItem.stats && updatedItem.stats.name) || 'Неизвестный предмет',
        type: updatedItem.type || updatedItem.item_type || (updatedItem.stats && updatedItem.stats.type) || '',
        quality: updatedItem.rarity || (updatedItem.stats && (updatedItem.stats.quality || updatedItem.stats.rarity)) || 'common',
        rarity: updatedItem.rarity || (updatedItem.stats && (updatedItem.stats.quality || updatedItem.stats.rarity)) || 'common', // для совместимости
        description: updatedItem.description || (updatedItem.stats && updatedItem.stats.description) || '',
        quantity: updatedItem.quantity || 1,
        equipped: updatedItem.equipped,
        // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
        ...(updatedItem.stats ? Object.fromEntries(
          Object.entries(updatedItem.stats).filter(([key]) =>
            !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
          )
        ) : {})
      };
      
      console.log('Обработанный предмет после обновления экипировки:', processedItem);
      
      return processedItem;
    } catch (error) {
      console.error('Ошибка при экипировке/снятии предмета:', error);
      throw error;
    }
  }

  /**
   * Сохранение всего инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @param {Array} items - Массив предметов инвентаря
   * @returns {Promise<Array>} - Обновленные предметы инвентаря
   */
}

// Экспортируем класс через CommonJS
module.exports = InventoryServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getInventoryItems = InventoryServiceAPI.getInventoryItems;
module.exports.addInventoryItem = InventoryServiceAPI.addInventoryItem;
module.exports.removeInventoryItem = InventoryServiceAPI.removeInventoryItem;
module.exports.toggleEquipItem = InventoryServiceAPI.toggleEquipItem;