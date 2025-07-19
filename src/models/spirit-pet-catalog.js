const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

/**
 * Модель каталога духовных питомцев (типы питомцев)
 * Соответствует таблице spirit_pets в БД
 */
class SpiritPetCatalog extends Model {}

SpiritPetCatalog.init = async function() {
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
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    element: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'element_types',
        key: 'id'
      }
    },
    rarity: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: 'rarities',
        key: 'id'
      }
    },
    unlockCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'unlock_condition'
    },
    maxLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'max_level'
    },
    evolutionPath: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'evolution_path'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SpiritPetCatalog',
    tableName: 'spirit_pets',
    timestamps: false
  });
};

/**
 * Устанавливает ассоциации с другими моделями
 * ПРИМЕЧАНИЕ: Ассоциации управляются через init-spirit-pet-models.js
 */
SpiritPetCatalog.associate = function(models) {
  // Ассоциации устанавливаются в init-spirit-pet-models.js
  // чтобы избежать дублирования и циклических зависимостей
  console.log('SpiritPetCatalog.associate вызван, но ассоциации управляются централизованно');
};

// НЕ инициализируем модель здесь - это делается в init-spirit-pet-models.js
// (async () => {
//   try {
//     await SpiritPetCatalog.init();
//     console.log('Модель SpiritPetCatalog инициализирована');
//   } catch (error) {
//     console.error('Ошибка инициализации модели SpiritPetCatalog:', error);
//   }
// })();

module.exports = SpiritPetCatalog;