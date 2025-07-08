/**
 * Модель для предметов экипировки
 * Включает основную модель EquipmentItem и связанные модели для эффектов, требований и специальных эффектов
 */
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * Основная модель EquipmentItem
   * @class
   */
  class EquipmentItem extends Model {
  /**
   * Получение всех эффектов предмета
   * @returns {Promise<Array>} Массив эффектов предмета
   */
  async getAllEffects() {
    return await EquipmentItemEffect.findAll({ 
      where: { item_id: this.item_id },
      order: [['type', 'ASC'], ['target', 'ASC']]
    });
  }

  /**
   * Получение всех требований предмета
   * @returns {Promise<Array>} Массив требований предмета
   */
  async getAllRequirements() {
    return await EquipmentItemRequirement.findAll({ 
      where: { item_id: this.item_id },
      order: [['type', 'ASC']]
    });
  }

  /**
   * Получение всех специальных эффектов предмета
   * @returns {Promise<Array>} Массив специальных эффектов предмета
   */
  async getAllSpecialEffects() {
    return await EquipmentItemSpecialEffect.findAll({ 
      where: { item_id: this.item_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Проверка, соответствует ли персонаж требованиям предмета
   * @param {Object} character Объект с характеристиками персонажа
   * @returns {Promise<Object>} Результат проверки { meetsRequirements: boolean, failedRequirements: Array }
   */
  async checkRequirements(character) {
    const requirements = await this.getAllRequirements();
    const failedRequirements = [];

    for (const req of requirements) {
      const characterValue = character[req.type] || 0;
      if (characterValue < req.value) {
        failedRequirements.push({
          type: req.type,
          required: req.value,
          current: characterValue
        });
      }
    }

    return {
      meetsRequirements: failedRequirements.length === 0,
      failedRequirements
    };
  }

  /**
   * Применение эффектов предмета к персонажу
   * @param {Object} character Объект с характеристиками персонажа
   * @returns {Promise<Object>} Обновленный объект персонажа с примененными эффектами
   */
  async applyEffects(character) {
    const effects = await this.getAllEffects();
    const updatedCharacter = { ...character };

    for (const effect of effects) {
      // Определяем категорию эффекта
      let category;
      let target = effect.target;

      switch (effect.type) {
        case 'statBoost':
          category = 'stats';
          break;
        case 'combatBoost':
          category = 'combat';
          break;
        case 'elementalBoost':
          category = 'elemental';
          break;
        case 'cultivation':
          category = 'cultivation';
          break;
        default:
          console.warn(`Неизвестный тип эффекта: ${effect.type}`);
          continue;
      }

      // Инициализируем категорию, если она не существует
      if (!updatedCharacter[category]) {
        updatedCharacter[category] = {};
      }

      // Инициализируем значение, если оно не существует
      if (updatedCharacter[category][target] === undefined) {
        updatedCharacter[category][target] = 0;
      }

      // Применяем эффект в зависимости от операции
      if (effect.operation === 'add') {
        // Простое сложение
        updatedCharacter[category][target] += effect.value;
      } else if (effect.operation === 'multiply') {
        // Умножение
        updatedCharacter[category][target] *= effect.value;
      } else if (effect.operation === 'percent') {
        // Процентное увеличение
        updatedCharacter[category][target] *= (1 + effect.value / 100);
      } else {
        // По умолчанию просто добавляем значение
        updatedCharacter[category][target] += effect.value;
      }
    }

    return updatedCharacter;
  }

  /**
   * Получение полной информации о предмете, включая эффекты, требования и специальные эффекты
   * @returns {Promise<Object>} Полная информация о предмете
   */
  async getFullInfo() {
    const [effects, requirements, specialEffects] = await Promise.all([
      this.getAllEffects(),
      this.getAllRequirements(),
      this.getAllSpecialEffects()
    ]);

    return {
      ...this.toJSON(),
      effects,
      requirements,
      specialEffects
    };
  }

  /**
   * Получение предметов по типу
   * @param {string} type Тип предмета
   * @returns {Promise<Array>} Массив предметов указанного типа
   */
  static async getByType(type) {
    return await EquipmentItem.findAll({
      where: { type },
      order: [['rarity', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Получение предметов по редкости
   * @param {string} rarity Редкость предмета
   * @returns {Promise<Array>} Массив предметов указанной редкости
   */
  static async getByRarity(rarity) {
    return await EquipmentItem.findAll({
      where: { rarity },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Получение предметов по набору (сету)
   * @param {string} setId ID набора
   * @returns {Promise<Array>} Массив предметов из указанного набора
   */
  static async getBySet(setId) {
    return await EquipmentItem.findAll({
      where: { set_id: setId },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Получение предмета по item_id
   * @param {string} itemId ID предмета
   * @returns {Promise<EquipmentItem|null>} Найденный предмет или null
   */
  static async getByItemId(itemId) {
    return await EquipmentItem.findOne({
      where: { item_id: itemId }
    });
  }
  }

  /**
   * Инициализация модели EquipmentItem
   */
  EquipmentItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  rarity: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  base_price: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  armor_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  set_id: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
  }, {
    sequelize,
    modelName: 'EquipmentItem',
    tableName: 'equipment_items',
    timestamps: false
  });

  /**
   * Модель для эффектов предметов экипировки
   * @class
   */
  class EquipmentItemEffect extends Model {}

  /**
   * Инициализация модели EquipmentItemEffect
   */
  EquipmentItemEffect.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: EquipmentItem,
      key: 'item_id'
    }
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  target: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 5),
    allowNull: false
  },
  operation: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
  }, {
    sequelize,
    modelName: 'EquipmentItemEffect',
    tableName: 'equipment_item_effects',
    timestamps: false
  });

  /**
   * Модель для требований предметов экипировки
   * @class
   */
  class EquipmentItemRequirement extends Model {}

  /**
   * Инициализация модели EquipmentItemRequirement
   */
  EquipmentItemRequirement.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: EquipmentItem,
      key: 'item_id'
    }
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
  }, {
    sequelize,
    modelName: 'EquipmentItemRequirement',
    tableName: 'equipment_item_requirements',
    timestamps: false
  });

  /**
   * Модель для специальных эффектов предметов экипировки
   * @class
   */
  class EquipmentItemSpecialEffect extends Model {}

  /**
   * Инициализация модели EquipmentItemSpecialEffect
   */
  EquipmentItemSpecialEffect.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: EquipmentItem,
      key: 'item_id'
    }
  },
  effect_id: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
  }, {
    sequelize,
    modelName: 'EquipmentItemSpecialEffect',
    tableName: 'equipment_item_special_effects',
    timestamps: false
  });

  // Установка связей между моделями
  EquipmentItem.hasMany(EquipmentItemEffect, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'effects' });
  EquipmentItemEffect.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });

  EquipmentItem.hasMany(EquipmentItemRequirement, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'requirements' });
  EquipmentItemRequirement.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });

  EquipmentItem.hasMany(EquipmentItemSpecialEffect, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'specialEffects' });
  EquipmentItemSpecialEffect.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });

  // Константы для типов предметов экипировки
  EquipmentItem.ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    TALISMAN: 'talisman',
    ACCESSORY: 'accessory'
  };

  // Константы для редкости предметов
  EquipmentItem.RARITY_TYPES = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
  };

  // Константы для типов брони
  EquipmentItem.ARMOR_TYPES = {
    BODY: 'body',
    HEAD: 'head',
    HANDS: 'hands',
    LEGS: 'legs'
  };

  // Константы для типов эффектов
  EquipmentItem.EFFECT_TYPES = {
    STAT_BOOST: 'statBoost',
    COMBAT_BOOST: 'combatBoost',
    ELEMENTAL_BOOST: 'elementalBoost',
    CULTIVATION: 'cultivation'
  };

  // Константы для операций эффектов
  EquipmentItem.EFFECT_OPERATIONS = {
    ADD: 'add',
    MULTIPLY: 'multiply',
    PERCENT: 'percent'
  };

  // Возвращаем объект с моделями
  return {
    EquipmentItem,
    EquipmentItemEffect,
    EquipmentItemRequirement,
    EquipmentItemSpecialEffect
  };
};