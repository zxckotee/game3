const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

/**
 * Модель еды для духовных питомцев
 * Соответствует таблице spirit_pet_food_items в БД
 */
class SpiritPetFood extends Model {}

SpiritPetFood.init = async function() {
  const sequelize = await connectionProvider.getSequelizeInstance().then(result => result.db);
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rarity: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'rarities',
        key: 'id'
      }
    },
    nutritionValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      field: 'nutrition_value'
    },
    loyaltyBonus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'loyalty_bonus'
    },
    statBonusType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      field: 'stat_bonus_type'
    },
    statBonusValue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'stat_bonus_value'
    },
    price: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    shopCategories: {
      type: DataTypes.JSONB,
      defaultValue: ['pet_supplies'],
      field: 'shop_categories'
    }
  }, {
    sequelize,
    modelName: 'SpiritPetFood',
    tableName: 'spirit_pet_food_items',
    timestamps: false
  });
};

// Инициализируем модель
(async () => {
  try {
    await SpiritPetFood.init();
    console.log('Модель SpiritPetFood инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели SpiritPetFood:', error);
  }
})();

module.exports = SpiritPetFood;