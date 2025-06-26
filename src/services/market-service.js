const MarketItem = require('../models/market-item');
const InventoryService = require('./inventory-service');

class MarketService {
  async getMarketItems() {
    return MarketItem.findAll();
  }

  async createMarketItem(itemId, itemType, quantity, price, sellerId) {
    return MarketItem.create({
      itemId,
      itemType,
      quantity,
      price,
      sellerId
    });
  }

  async buyMarketItem(itemId, buyerId, quantity) {
    const marketItem = await MarketItem.findByPk(itemId);

    if (!marketItem) {
      throw new Error('Предмет не найден на рынке');
    }

    if (marketItem.quantity < quantity) {
      throw new Error('Недостаточно предметов в наличии');
    }

    // TODO: Проверка наличия денег у покупателя

    // TODO: Списание денег у покупателя

    // TODO: Добавление предмета в инвентарь покупателя

    // TODO: Увеличение денег у продавца

    marketItem.quantity -= quantity;

    if (marketItem.quantity === 0) {
      await marketItem.destroy();
    } else {
      await marketItem.save();
    }

    return marketItem;
  }

  async removeMarketItem(itemId, sellerId) {
    const marketItem = await MarketItem.findByPk(itemId);

    if (!marketItem) {
      throw new Error('Предмет не найден на рынке');
    }

    if (marketItem.sellerId !== sellerId) {
      throw new Error('Вы не являетесь владельцем этого предмета');
    }

    await marketItem.destroy();
  }
}

module.exports = new MarketService();
