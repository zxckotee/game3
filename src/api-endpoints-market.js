// API-эндпоинты для работы с рынком

// Импорт необходимых зависимостей
const MarketService = require('./services/market-service');
const { MarketItem, User } = require('./models/index');

/**
 * Добавляет API-эндпоинты для работы с рынком к приложению Express
 * @param {Object} app Экземпляр Express-приложения
 * @returns {Object} Модифицированное приложение с добавленными эндпоинтами
 */
function addMarketEndpoints(app) {
  // Получение всех товаров на рынке
  app.get('/api/market/items', async (req, res) => {
    try {
      const items = await MarketService.getAllItems();
      res.json(items);
    } catch (error) {
      console.error('Ошибка при получении товаров с рынка:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение конкретного товара по ID
  app.get('/api/market/items/:itemId', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const item = await MarketService.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Товар не найден' });
      }
      
      res.json(item);
    } catch (error) {
      console.error(`Ошибка при получении товара с ID ${req.params.itemId}:`, error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение товаров по типу
  app.get('/api/market/items/type/:type', async (req, res) => {
    try {
      const type = req.params.type;
      const items = await MarketService.getItemsByType(type);
      res.json(items);
    } catch (error) {
      console.error(`Ошибка при получении товаров типа ${req.params.type}:`, error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Поиск товаров по критериям
  app.get('/api/market/search', async (req, res) => {
    try {
      const criteria = {
        type: req.query.type,
        rarity: req.query.rarity,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
        sort: req.query.sort,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };
      
      // Удаляем undefined параметры, чтобы не засорять критерии поиска
      Object.keys(criteria).forEach(key => {
        if (criteria[key] === undefined) {
          delete criteria[key];
        }
      });
      
      const items = await MarketService.searchItems(criteria);
      res.json(items);
    } catch (error) {
      console.error('Ошибка при поиске товаров на рынке:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Покупка товара
  app.post('/api/market/items/:itemId/buy', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const { userId, quantity } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Необходимо указать ID пользователя' });
      }
      
      const result = await MarketService.buyItem(userId, itemId, quantity || 1);
      res.json(result);
    } catch (error) {
      console.error('Ошибка при покупке товара:', error);
      
      // Обработка специфических ошибок
      if (error.message === 'Товар не найден') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Недостаточное количество товара') {
        return res.status(400).json({ error: error.message });
      }
      
      if (error.message.includes('Недостаточно средств')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Продажа товара
  app.post('/api/market/sell', async (req, res) => {
    try {
      const { userId, itemData } = req.body;
      
      if (!userId || !itemData) {
        return res.status(400).json({ 
          error: 'Необходимо указать ID пользователя и данные о товаре' 
        });
      }
      
      // Проверка обязательных полей
      const requiredFields = ['name', 'type', 'price', 'quantity'];
      for (const field of requiredFields) {
        if (!itemData[field]) {
          return res.status(400).json({ 
            error: `Необходимо указать поле ${field}` 
          });
        }
      }
      
      const result = await MarketService.sellItem(userId, itemData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Ошибка при выставлении товара на продажу:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Отмена продажи товара
  app.delete('/api/market/items/:itemId/cancel', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Необходимо указать ID пользователя' });
      }
      
      const result = await MarketService.cancelListing(userId, itemId);
      res.json(result);
    } catch (error) {
      console.error('Ошибка при отмене продажи товара:', error);
      
      // Обработка специфических ошибок
      if (error.message === 'Товар не найден') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Вы не можете отменить продажу чужого товара') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение товаров пользователя, выставленных на продажу
  app.get('/api/users/:userId/market/listings', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const items = await MarketService.getUserListings(userId);
      res.json(items);
    } catch (error) {
      console.error(`Ошибка при получении товаров пользователя с ID ${req.params.userId}:`, error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение констант для рынка
  app.get('/api/market/constants', (req, res) => {
    try {
      const constants = {
        MARKET_ITEM_TYPES: MarketService.getItemTypes(),
        SORT_OPTIONS: MarketService.getSortOptions()
      };
      
      res.json(constants);
    } catch (error) {
      console.error('Ошибка при получении констант рынка:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  return app;
}

module.exports = addMarketEndpoints;