'use strict';

const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class Merchant extends Model {
  static associate(models) {
    // Связь с инвентарем торговца
    this.hasMany(models.MerchantInventory, {
      foreignKey: 'merchantId', // Оставляем camelCase
      as: 'inventory'
    });

    // Связь с репутацией торговца
    this.hasMany(models.MerchantReputation, {
      foreignKey: 'merchantId', // Оставляем camelCase
      as: 'reputations'
    });
  }

  /**
   * Получение скидки для указанного пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<number>} Скидка (от 0 до 1)
   */
  async getDiscountForUser(userId) {
    // Используем this.sequelize, который должен быть доступен после инициализации
    if (!this.sequelize || !this.sequelize.models || !this.sequelize.models.MerchantReputation) {
        console.error("Модель MerchantReputation не найдена в sequelize.models");
        return this.defaultDiscount;
    }
    const reputation = await this.sequelize.models.MerchantReputation.findOne({
      where: {
        merchantId: this.id,
        userId
      }
    });

    if (!reputation) {
      return this.defaultDiscount;
    }
    return reputation.discountRate;
  }
}

Merchant.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    // Идентификатор торговца
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Имя торговца
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Описание торговца
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Локация торговца
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Специализация торговца
    specialization: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Путь к изображению торговца
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Базовая скидка у торговца
    defaultDiscount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: 'default_discount' // Добавляем field для snake_case
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'Merchant',
    tableName: 'merchants', // Имя таблицы в lowercase
    timestamps: true,      // Используем timestamps
    underscored: true      // Используем snake_case для createdAt и updatedAt
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = Merchant;
