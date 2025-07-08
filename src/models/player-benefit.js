/**
 * Модель для таблицы player_benefits (бонусы пользователей)
 */
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * Класс модели PlayerBenefit
   * @class
   */
  class PlayerBenefit extends Model {}

  /**
   * Инициализация модели
   */
  PlayerBenefit.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'Уникальный идентификатор бонуса пользователя'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID пользователя'
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
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Источник бенефита (sect, equipment, etc.)'
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
    modelName: 'PlayerBenefit',
    tableName: 'player_benefits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: 'Бонусы пользователей из различных источников'
  });

  /**
   * Типы модификаторов (наследуем от Benefit)
   * @enum {string}
   */
  PlayerBenefit.MODIFIER_TYPES = {
    PERCENT: 'percent',
    FLAT: 'flat',
    CHANCE: 'chance'
  };

  /**
   * Типы бонусов (наследуем от Benefit)
   * @enum {string}
   */
  PlayerBenefit.BENEFIT_TYPES = {
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
   * Источники бонусов
   * @enum {string}
   */
  PlayerBenefit.SOURCE_TYPES = {
    SECT: 'sect',
    EQUIPMENT: 'equipment',
    WEATHER: 'weather',
    TECHNIQUE: 'technique',
    QUEST: 'quest',
    ITEM: 'item'
  };

  return PlayerBenefit;
};