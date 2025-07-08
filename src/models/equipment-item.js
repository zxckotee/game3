const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class EquipmentItem extends Model {
    async getAllEffects() {
      const EquipmentItemEffect = sequelize.models.EquipmentItemEffect;
      return await EquipmentItemEffect.findAll({ 
        where: { item_id: this.item_id },
        order: [['type', 'ASC'], ['target', 'ASC']]
      });
    }

    async getAllRequirements() {
      const EquipmentItemRequirement = sequelize.models.EquipmentItemRequirement;
      return await EquipmentItemRequirement.findAll({ 
        where: { item_id: this.item_id },
        order: [['type', 'ASC']]
      });
    }

    async getAllSpecialEffects() {
      const EquipmentItemSpecialEffect = sequelize.models.EquipmentItemSpecialEffect;
      return await EquipmentItemSpecialEffect.findAll({ 
        where: { item_id: this.item_id },
        order: [['name', 'ASC']]
      });
    }

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

    async applyEffects(character) {
      const effects = await this.getAllEffects();
      const updatedCharacter = { ...character };

      for (const effect of effects) {
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

        if (!updatedCharacter[category]) {
          updatedCharacter[category] = {};
        }

        if (updatedCharacter[category][target] === undefined) {
          updatedCharacter[category][target] = 0;
        }

        if (effect.operation === 'add') {
          updatedCharacter[category][target] += effect.value;
        } else if (effect.operation === 'multiply') {
          updatedCharacter[category][target] *= effect.value;
        } else if (effect.operation === 'percent') {
          updatedCharacter[category][target] *= (1 + effect.value / 100);
        } else {
          updatedCharacter[category][target] += effect.value;
        }
      }

      return updatedCharacter;
    }

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

    static async getByType(type) {
      return await EquipmentItem.findAll({
        where: { type },
        order: [['rarity', 'ASC'], ['name', 'ASC']]
      });
    }

    static async getByRarity(rarity) {
      return await EquipmentItem.findAll({
        where: { rarity },
        order: [['type', 'ASC'], ['name', 'ASC']]
      });
    }

    static async getBySet(setId) {
      return await EquipmentItem.findAll({
        where: { set_id: setId },
        order: [['type', 'ASC'], ['name', 'ASC']]
      });
    }

    static async getByItemId(itemId) {
      return await EquipmentItem.findOne({
        where: { item_id: itemId }
      });
    }
  }

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

  EquipmentItem.associate = (models) => {
    EquipmentItem.hasMany(models.EquipmentItemEffect, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'effects' });
    models.EquipmentItemEffect.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });

    EquipmentItem.hasMany(models.EquipmentItemRequirement, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'requirements' });
    models.EquipmentItemRequirement.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });

    EquipmentItem.hasMany(models.EquipmentItemSpecialEffect, { foreignKey: 'item_id', sourceKey: 'item_id', as: 'specialEffects' });
    models.EquipmentItemSpecialEffect.belongsTo(EquipmentItem, { foreignKey: 'item_id', targetKey: 'item_id' });
  };

  EquipmentItem.ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    TALISMAN: 'talisman',
    ACCESSORY: 'accessory'
  };

  EquipmentItem.RARITY_TYPES = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
  };

  EquipmentItem.ARMOR_TYPES = {
    BODY: 'body',
    HEAD: 'head',
    HANDS: 'hands',
    LEGS: 'legs'
  };

  EquipmentItem.EFFECT_TYPES = {
    STAT_BOOST: 'statBoost',
    COMBAT_BOOST: 'combatBoost',
    ELEMENTAL_BOOST: 'elementalBoost',
    CULTIVATION: 'cultivation'
  };

  EquipmentItem.EFFECT_OPERATIONS = {
    ADD: 'add',
    MULTIPLY: 'multiply',
    PERCENT: 'percent'
  };

  return EquipmentItem;
};