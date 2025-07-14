const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const { calculateETag } = require('../../utils/etag-utils');


const { unifiedDatabase, initializeDatabaseConnection } = require('../../services/database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');

const InventoryService = require('../../services/inventory-service');

async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  } 
  return sequelize;
}
 
// API маршруты для работы с инвентарем
router.get('/api/users/:userId/inventory', async (req, res) => {
  try {
    console.log(`GET - запрос на получение инвентаря от userId: ${req.params.userId}`);
    const items = await InventoryService.getInventoryItems(req.params.userId);
    res.json(items);
  } catch (error) {
    console.error('Ошибка при получении инвентаря:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/api/items/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    console.log(`[API] Запрос информации о предмете с ID: ${itemId}`);
    
    // Проверяем наличие заголовка If-None-Match для проверки ETag
    const ifNoneMatch = req.headers['if-none-match'];
    console.log(`[API] If-None-Match: ${ifNoneMatch || 'отсутствует'}`);
    
    // Используем сервис для получения данных предмета
    const result = await InventoryService.getItemDetails(itemId);
    
    if (!result.success) {
      // Если предмет не найден или произошла ошибка
      return res.status(result.message === 'Предмет не найден' ? 404 : 500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
    
    // Получаем данные предмета и ETag
    const { item, etag } = result;
    
    // Если клиент прислал If-None-Match, который совпадает с ETag, возвращаем 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      console.log(`[API] Полные данные предмета не изменились, возвращаем 304 Not Modified`);
      
      // Устанавливаем заголовки кеширования и возвращаем 304
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, max-age=3600'); // кеш на 1 час
      return res.status(304).end();
    }
    
    // Устанавливаем заголовки кеширования
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // кеш на 1 час
    
    // Возвращаем данные предмета
    res.json({
      success: true,
      item: item
    });
  } catch (error) {
    console.error(`[API] ========== ОШИБКА ОБРАБОТКИ ЗАПРОСА ==========`);
    console.error(`[API] Ошибка при получении информации о предмете ${req.params.itemId}:`, error);
    console.error(`[API] Стек ошибки:`, error.stack);
    
    // Возвращаем ошибку с информацией для отладки
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message,
      // В продакшене следует убрать передачу деталей ошибки клиенту
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/*// Новый маршрут для получения URL изображения предмета
router.get('/api/items/:itemId/image', async (req, res) => {
  try {
    const { itemId } = req.params;
    // Получаем экземпляр Sequelize и модель ItemImage
    const sequelize = await getSequelizeInstance();
    const ItemImage = sequelize.models.ItemImage;

    if (!ItemImage) {
      console.error('Модель ItemImage не найдена. Убедитесь, что она правильно инициализирована.');
      return res.status(500).json({ success: false, message: 'Ошибка сервера: модель не найдена' });
    }

    const itemImage = await ItemImage.findOne({ where: { item_id: itemId } });

    if (itemImage && itemImage.image_url) {
      res.json({ success: true, imageUrl: itemImage.image_url });
    } else {
      res.status(404).json({ success: false, message: 'Изображение для предмета не найдено' });
    }
  } catch (error) {
    console.error(`Ошибка при получении изображения для предмета ${req.params.itemId}:`, error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});*/

router.post('/api/users/:userId/inventory', async (req, res) => {
  try {
    // Логируем входные данные для отладки
    console.log('Предмет для добавления в инвентарь:'); // убрали req.body в логировании для консоли
    
    // Проверяем обязательные поля
    if (!req.body.name && !req.body.id && !req.body.itemId) {
      return res.status(400).json({
        error: 'Отсутствуют обязательные поля для предмета инвентаря'
      });
    }
    
    const newItem = await InventoryService.addInventoryItem(req.params.userId, req.body);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Ошибка при добавлении предмета в инвентарь:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Удаление предмета из инвентаря
router.delete('/api/users/:userId/inventory/:itemId', async (req, res) => {
 try {
   const userId = req.params.userId;
   const itemId = req.params.itemId;
   const quantity = req.query.quantity ? parseInt(req.query.quantity) : 1;
   
   const success = await InventoryService.removeInventoryItem(userId, itemId, quantity);
   
   if (!success) {
     return res.status(404).json({ error: 'Предмет не найден в инвентаре' });
   }
   
   res.json({ success: true });
 } catch (error) {
   console.error('Ошибка при удалении предмета из инвентаря:', error);
   res.status(500).json({ error: 'Внутренняя ошибка сервера' });
 }
});

// Экипировка/снятие предмета
router.put('/api/users/:userId/inventory/:itemId/equip', async (req, res) => {
 try {
   const userId = req.params.userId;
   const itemId = req.params.itemId;
   const { equipped } = req.body;
   
   if (equipped === undefined) {
     return res.status(400).json({ error: 'Необходимо указать параметр "equipped"' });
   }
   
   const result = await InventoryService.toggleEquipItem(userId, itemId, equipped);
   
   if (!result.success) {
     return res.status(404).json({ error: result.message || 'Предмет не найден в инвентаре' });
   }
   
   res.json(result);
 } catch (error) {
   console.error('Ошибка при экипировке/снятии предмета:', error);
   res.status(500).json({ error: 'Внутренняя ошибка сервера' });
 }
});

// PUT - Сохранение всего инвентаря пользователя
// ДАННЫЙ МАРШРУТ УДАЛЕН В ХОДЕ РЕФАКТОРИНГА, ЧТОБЫ ИЗБЕЖАТЬ ПЕРЕЗАПИСИ ДАННЫХ С КЛИЕНТА
/*
router.put('/api/users/:userId/inventory', async (req, res) => {
  try {
    const userId = req.params.userId;
    const items = req.body.items || [];
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Ожидается массив предметов'
      });
    }
    
    // Проверяем наличие ID у всех предметов
    for (const item of items) {
      if (!item.id && !item.itemId) {
        return res.status(400).json({
          error: 'Каждый предмет должен иметь ID'
        });
      }
    }
    
    const updatedItems = await InventoryService.saveInventory(userId, items);
    
    console.log(`Инвентарь пользователя ${userId} успешно сохранен: ${updatedItems.length} предметов`);
    res.json(updatedItems);
  } catch (error) {
    console.error('Ошибка при обновлении инвентаря:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});
*/

// Новый маршрут для экипировки предмета с проверкой требований --> пока не нужен, через сервис лучше
/*router.post('/api/equipment/equip', async (req, res) => {
  console.log('[API] POST - запрос на экипировку');
  try {
    const { userId, itemId } = req.body;
    
    // Проверка входных данных
    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствуют обязательные параметры userId или itemId'
      });
    }
    
    console.log(`[API] Запрос на экипировку предмета: userId=${userId}, itemId=${itemId}`);
    
    // Получаем экземпляр sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // 1. Получаем данные предмета из инвентаря
      const inventoryItems = await sequelizeDb.query(
        `SELECT * FROM inventory_items WHERE item_id = :itemId AND user_id = :userId LIMIT 1`,
        {
          replacements: { itemId, userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!inventoryItems || inventoryItems.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Предмет не найден в инвентаре'
        });
      }
      
      const inventoryItem = inventoryItems[0];
      const baseItemId = inventoryItem.item_id;
      
      console.log(`[API] Найден предмет в инвентаре: ${inventoryItem.name} (ID: ${baseItemId})`);
      
      // 2. Получаем требования предмета
      const requirements = await sequelizeDb.query(
        `SELECT type, value
         FROM equipment_item_requirements
         WHERE item_id = :baseItemId`,
        {
          replacements: { baseItemId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      console.log(`[API] Получены требования предмета (${requirements.length}):`);
      console.log(requirements);
      
      // 3. Получаем характеристики персонажа
      const characterStats = await sequelizeDb.query(
        `SELECT * FROM character_stats WHERE user_id = :userId LIMIT 1`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!characterStats || characterStats.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Не найдены характеристики персонажа'
        });
      }
      
      const playerStats = characterStats[0];
      console.log(`[API] Получены характеристики персонажа:`, playerStats);
      
      // 4. Получаем прогресс персонажа (для уровня)
      const characterProfile = await sequelizeDb.query(
        `SELECT level FROM character_profile WHERE user_id = :userId LIMIT 1`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      const playerLevel = characterProfile.length > 0 ? characterProfile[0].level : 1;
      console.log(`[API] Уровень персонажа: ${playerLevel}`);
      
      // 5. Проверяем соответствие требованиям
      const failedRequirements = [];
      
      for (const req of requirements) {
        if (req.type === 'level') {
          if (playerLevel < req.value) {
            failedRequirements.push(`Требуемый уровень: ${req.value}`);
            console.log(`[API] Не соответствует требованию по уровню: ${playerLevel} < ${req.value}`);
          }
        } else {
          // Для других требований (сила, интеллект и т.д.)
          const statValue = playerStats[req.type];
          if (!statValue || statValue < req.value) {
            failedRequirements.push(`Требуемый ${req.type}: ${req.value}`);
            console.log(`[API] Не соответствует требованию по ${req.type}: ${statValue || 0} < ${req.value}`);
          }
        }
      }
      
      if (failedRequirements.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Не соответствует требованиям',
          failedRequirements
        });
      }
      
      // 6. Снимаем экипировку с предметов того же типа
      await sequelizeDb.query(
        `UPDATE inventory_items
         SET equipped = FALSE, updated_at = NOW()
         WHERE user_id = :userId AND item_type = :itemType AND equipped = TRUE`,
        {
          replacements: {
            userId,
            itemType: inventoryItem.item_type
          },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // 7. Экипируем предмет
      await sequelizeDb.query(
        `UPDATE inventory_items
         SET equipped = TRUE, updated_at = NOW()
         WHERE item_id = :itemId AND user_id = :userId`,
        {
          replacements: { itemId, userId },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // 8. Получаем обновленные данные
      const updatedItems = await sequelizeDb.query(
        `SELECT * FROM inventory_items WHERE item_id = :itemId AND user_id = :userId LIMIT 1`,
        {
          replacements: { itemId, userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      // Завершаем транзакцию
      await transaction.commit();
      
      console.log(`[API] Предмет успешно экипирован: ${inventoryItem.name}`);
      
      return res.json({
        success: true,
        message: 'Предмет успешно экипирован',
        item: updatedItems[0]
      });
    } catch (error) {
      // В случае ошибки откатываем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('[API] Ошибка при экипировке предмета:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
});*/

// API-эндпоинты для работы с инвентарем

// Получение всех предметов инвентаря пользователя

// Массовое добавление предметов (новая функциональность)
router.post('/api/users/:userId/inventory/batch', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать массив предметов' });
    }
    
    const results = [];
    for (const item of items) {
      try {
        const newItem = await InventoryService.addInventoryItem(userId, item);
        results.push({ success: true, item: newItem });
      } catch (itemError) {
        results.push({ success: false, error: itemError.message, item });
      }
    }
    
    res.status(201).json({
      totalProcessed: items.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Ошибка при массовом добавлении предметов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Фильтрация предметов (новая функциональность)
router.post('/api/users/:userId/inventory/filter', async (req, res) => {
  try {
    const userId = req.params.userId;
    const filters = req.body;
    
    // Получаем все предметы
    const allItems = await InventoryService.getInventoryItems(userId);
    
    // Применяем фильтры
    let filteredItems = [...allItems];
    
    if (filters.type) {
      filteredItems = filteredItems.filter(item => item.type === filters.type);
    }
    
    if (filters.rarity) {
      filteredItems = filteredItems.filter(item => item.rarity === filters.rarity);
    }
    
    if (filters.equipped !== undefined) {
      filteredItems = filteredItems.filter(item => item.equipped === filters.equipped);
    }
    
    if (filters.minValue !== undefined) {
      filteredItems = filteredItems.filter(item => (item.value || 0) >= filters.minValue);
    }
    
    if (filters.maxValue !== undefined) {
      filteredItems = filteredItems.filter(item => (item.value || 0) <= filters.maxValue);
    }
    
    res.json(filteredItems);
  } catch (error) {
    console.error('Ошибка при фильтрации предметов инвентаря:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;