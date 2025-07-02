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

class MerchantReputation extends Model {
  static associate(models) {
    // Связь с пользователем
    this.belongsTo(models.User, {
      foreignKey: 'userId', // Оставляем camelCase
      as: 'user'
    });
    
    // Связь с торговцем
    this.belongsTo(models.Merchant, {
      foreignKey: 'merchantId', // Оставляем camelCase
      as: 'merchant'
    });
  }

  /**
   * Увеличение уровня репутации
   * @param {number} amount - Количество единиц репутации для увеличения
   * @returns {Promise<MerchantReputation>} Обновленная репутация
   */
  async increaseReputation(amount) {
    this.reputation = Math.min(100, this.reputation + amount);
    this.discountRate = this.calculateDiscountRate();
    return this.save();
  }

  /**
   * Уменьшение уровня репутации
   * @param {number} amount - Количество единиц репутации для уменьшения
   * @returns {Promise<MerchantReputation>} Обновленная репутация
   */
  async decreaseReputation(amount) {
    this.reputation = Math.max(0, this.reputation - amount);
    this.discountRate = this.calculateDiscountRate();
    return this.save();
  }

  /**
   * Расчет скидки на основе уровня репутации
   * @returns {number} Скидка (от 0 до 1)
   * @private
   */
  calculateDiscountRate() {
    return Math.min(0.2, this.reputation * 0.002);
  }
}

MerchantReputation.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    // Идентификатор записи репутации
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Идентификатор пользователя
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id', // Добавляем field для snake_case
      references: {
        model: 'users', // Имя таблицы в lowercase
        key: 'id'
      }
    }, 
    // Идентификатор торговца
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'merchant_id', // Добавляем field для snake_case
      references: {
        model: 'merchants', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    // Уровень репутации (от 0 до 100)
    reputation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    // Скидка, зависящая от уровня репутации (от 0 до 1)
    discountRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: 'discount_rate', // Добавляем field для snake_case
      validate: {
        min: 0,
        max: 1
      }
    }
    // createdAt и updatedAt будут добавлены автоматически
  }, {
    sequelize,
    modelName: 'MerchantReputation',
    tableName: 'merchant_reputations', // Имя таблицы в snake_case
    timestamps: true,                 // Используем timestamps
    underscored: true                 // Используем snake_case для createdAt и updatedAt
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await MerchantReputation.init();
    console.log('MerchantReputation модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели MerchantReputation:', error);
    console.error(error.stack);
  }
})();

module.exports = MerchantReputation;
