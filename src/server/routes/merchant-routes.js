const express = require('express');
const router = express.Router();
const merchantService = require('../../services/merchant-service');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');

// API маршруты для работы с торговцами
router.get('/api/merchants', async (req, res) => {
  try {
    // Получаем идентификатор пользователя из запроса
    const userId = req.query.userId || 1; // По умолчанию берем пользователя с ID 1
    
    console.log(`Запрос торговцев для пользователя ${userId}`);
    
    // Получаем всех торговцев через сервис
    const merchants = await merchantService.getAllMerchants();
    
    if (!merchants || merchants.length === 0) {
      console.log('Торговцы не найдены в базе данных');
      return res.json([]); // Возвращаем пустой массив, если торговцев нет
    }
    
    // Для каждого торговца получаем его инвентарь для данного пользователя
    const formattedMerchants = [];
    
    for (const merchant of merchants) {
      // Получаем инвентарь через сервис
      const inventory = await merchantService.getMerchantInventory(merchant.id, userId);
      
      // Создаем объект торговца с инвентарем
      const formattedMerchant = {
        ...merchant,
        items: inventory
      };
      
      formattedMerchants.push(formattedMerchant);
    }
    
    console.log(`Отправка ${formattedMerchants.length} торговцев с инвентарем и репутацией`);
    res.json(formattedMerchants);
  } catch (error) {
    console.error('Ошибка при получении торговцев:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API-эндпоинт для получения инвентаря конкретного торговца
router.get('/api/merchants/:id/inventory', async (req, res) => {
  try {
    const merchantId = req.params.id;
    const userId = req.query.userId || 1;
    
    // Получаем инвентарь торговца через сервис
    const inventory = await merchantService.getMerchantInventory(merchantId, userId);
    res.json(inventory);
  } catch (error) {
    console.error(`Ошибка при получении инвентаря торговца ${req.params.id}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// API маршрут для обновления количества предметов у торговца
router.put('/api/merchants/:id/update-inventory', async (req, res) => {
  try {
    const merchantId = parseInt(req.params.id, 10);
    const { itemId, quantity, userId, action } = req.body;
    
    console.log(`Обновление инвентаря торговца: merchantId=${merchantId}, itemId=${itemId}, action=${action}, quantity=${quantity}, userId=${userId}`);
    
    if (!itemId || quantity === undefined || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать ID предмета, ID пользователя и количество'
      });
    }
    
    // Обновляем инвентарь через сервис
    const result = await merchantService.updateMerchantInventory(merchantId, itemId, userId, quantity, action);
    
    return res.json(result);
  } catch (error) {
    console.error('Внешняя ошибка при обработке запроса:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
});

// API маршрут для покупки товара у торговца
router.post('/api/merchants/:merchantId/buy', async (req, res) => {
  try {
    const merchantId = parseInt(req.params.merchantId);
    const { userId, itemId, quantity = 1 } = req.body;
    
    console.log(`Покупка товара у торговца: merchantId=${merchantId}, itemId=${itemId}, userId=${userId}, quantity=${quantity}`);
    
    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать userId и itemId'
      });
    }
    
    // Вызываем метод покупки предмета через сервис
    const result = await merchantService.buyItemFromMerchant(merchantId, itemId, userId, quantity);
    res.json(result);
  } catch (error) {
    console.error(`Ошибка при покупке предмета у торговца ${req.params.merchantId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при покупке предмета',
      error: error.message
    });
  }
});

// API маршрут для продажи товара торговцу
router.post('/api/merchants/:merchantId/sell', async (req, res) => {
  try {
    const merchantId = parseInt(req.params.merchantId);
    const { userId, itemData, quantity = 1 } = req.body;
    
    console.log(`Продажа товара торговцу: merchantId=${merchantId}, userId=${userId}, quantity=${quantity}`);
    
    if (!userId || !itemData) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать userId и данные о товаре'
      });
    }
    
    // Вызываем метод продажи предмета через сервис
    const result = await merchantService.sellItemToMerchant(merchantId, itemData, userId, quantity);
    res.json(result);
  } catch (error) {
    console.error(`Ошибка при продаже предмета торговцу ${req.params.merchantId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при продаже предмета',
      error: error.message
    });
  }
});

// API маршрут для пополнения инвентаря торговца
router.post('/api/merchants/:merchantId/restock', async (req, res) => {
  try {
    const merchantId = parseInt(req.params.merchantId);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать userId'
      });
    }
    
    // Вызываем метод пополнения инвентаря через сервис
    const result = await merchantService.restockMerchantItems(merchantId, userId);
    
    if (result) {
      res.json({
        success: true,
        message: 'Инвентарь торговца успешно пополнен'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Не удалось пополнить инвентарь торговца'
      });
    }
  } catch (error) {
    console.error(`Ошибка при пополнении инвентаря торговца ${req.params.merchantId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при пополнении инвентаря',
      error: error.message
    });
  }
});

module.exports = router;