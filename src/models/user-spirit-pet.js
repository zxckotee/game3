const { Model, DataTypes } = require('../services/database');
const connectionProvider = require('../utils/connection-provider');

/**
 * Модель духовного питомца пользователя
 * Соответствует таблице user_spirit_pets в БД
 */
class UserSpiritPet extends Model {}

UserSpiritPet.init = async function() {
  const sequelize = await connectionProvider.getSequelizeInstance().then(result => result.db);
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    petId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'pet_id',
      references: {
        model: 'spirit_pets',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_active'
    },
    customName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'custom_name'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    hunger: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    loyalty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    strength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    intelligence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    agility: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    vitality: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    spirit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    lastFed: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_fed'
    },
    lastTrained: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_trained'
    },
    combatUsesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'combat_uses_count'
    },
    combatFleeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'combat_flee_count'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'UserSpiritPet',
    tableName: 'user_spirit_pets',
    timestamps: true,
    underscored: true
  });
};

/**
 * Устанавливает ассоциации с другими моделями
 * ПРИМЕЧАНИЕ: Ассоциации управляются через init-spirit-pet-models.js
 */
UserSpiritPet.associate = function(models) {
  // Ассоциации устанавливаются в init-spirit-pet-models.js
  // чтобы избежать дублирования и циклических зависимостей
  console.log('UserSpiritPet.associate вызван, но ассоциации управляются централизованно');
};

// НЕ инициализируем модель здесь - это делается в init-spirit-pet-models.js
// (async () => {
//   try {
//     await UserSpiritPet.init();
//     console.log('Модель UserSpiritPet инициализирована');
//   } catch (error) {
//     console.error('Ошибка инициализации модели UserSpiritPet:', error);
//   }
// })();

module.exports = UserSpiritPet;