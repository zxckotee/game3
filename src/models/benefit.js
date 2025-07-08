/**
 * Модель для таблицы benefits (справочник бонусов)
 */
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * Класс модели Benefit
   * @class
   */
  class Benefit extends Model {}

  /**
   * Инициализация модели
   */
  Benefit.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Уникальный идентификатор бонуса'
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Тип бонуса (cultivation_speed, physical_defense и т.д.)'
  },
  modifier: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Значение модификатора (может быть отрицательным)'
  },
  modifier_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['percent', 'flat', 'chance']]
    },
    comment: 'Тип модификатора (процент, абсолютное значение, шанс)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Описание бонуса'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Время создания записи'
  },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Время последнего обновления записи'
    }
  }, {
    sequelize,
    modelName: 'Benefit',
    tableName: 'benefits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: 'Справочник бонусов для различных игровых механик и характеристик'
  });

  /**
   * Типы модификаторов
   * @enum {string}
   */
  Benefit.MODIFIER_TYPES = {
    PERCENT: 'percent',
    FLAT: 'flat',
    CHANCE: 'chance'
  };

  /**
   * Типы бонусов
   * @enum {string}
   */
  Benefit.BENEFIT_TYPES = {
    // Бонусы игровых механик
    CULTIVATION_SPEED: 'cultivation_speed',
    RESOURCE_GATHERING: 'resource_gathering',
    TECHNIQUE_DISCOUNT: 'technique_discount',
    
    // Бонусы характеристик персонажа
    PHYSICAL_DEFENSE: 'physical_defense',
    SPIRITUAL_DEFENSE: 'spiritual_defense',
    ATTACK_SPEED: 'attack_speed',
    CRITICAL_CHANCE: 'critical_chance',
    MOVEMENT_SPEED: 'movement_speed',
    LUCK: 'luck'
  };

  /**
   * Получение всех типов бонусов
   * @returns {Array<string>} Массив всех типов бонусов
   */
  Benefit.getAllTypes = function() {
    return Object.values(Benefit.BENEFIT_TYPES);
  };

  /**
   * Получение всех типов модификаторов
   * @returns {Array<string>} Массив всех типов модификаторов
   */
  Benefit.getAllModifierTypes = function() {
    return Object.values(Benefit.MODIFIER_TYPES);
  };

  /**
   * Проверка, является ли тип бонуса процентным
   * @param {string} type Тип бонуса
   * @returns {boolean} true, если тип бонуса процентный
   */
  Benefit.isPercentType = function(type) {
    const percentTypes = [
      Benefit.BENEFIT_TYPES.CULTIVATION_SPEED,
      Benefit.BENEFIT_TYPES.RESOURCE_GATHERING,
      Benefit.BENEFIT_TYPES.TECHNIQUE_DISCOUNT
    ];
    return percentTypes.includes(type);
  };

  /**
   * Проверка, является ли тип бонуса абсолютным
   * @param {string} type Тип бонуса
   * @returns {boolean} true, если тип бонуса абсолютный
   */
  Benefit.isFlatType = function(type) {
    const flatTypes = [
      Benefit.BENEFIT_TYPES.PHYSICAL_DEFENSE,
      Benefit.BENEFIT_TYPES.SPIRITUAL_DEFENSE,
      Benefit.BENEFIT_TYPES.ATTACK_SPEED
    ];
    return flatTypes.includes(type);
  };

  /**
   * Проверка, является ли тип бонуса шансовым
   * @param {string} type Тип бонуса
   * @returns {boolean} true, если тип бонуса шансовый
   */
  Benefit.isChanceType = function(type) {
    const chanceTypes = [
      Benefit.BENEFIT_TYPES.CRITICAL_CHANCE,
      Benefit.BENEFIT_TYPES.MOVEMENT_SPEED,
      Benefit.BENEFIT_TYPES.LUCK
    ];
    return chanceTypes.includes(type);
  };

  return Benefit;
};