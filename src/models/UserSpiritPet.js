const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSpiritPet extends Model {
    static associate(models) {
      // Связь с пользователем
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Связь с базовым питомцем
      this.belongsTo(models.SpiritPet, {
        foreignKey: 'pet_id',
        as: 'pet'
      });
    }
  }

  UserSpiritPet.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'spirit_pets',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hunger: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100
      }
    },
    loyalty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100
      }
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
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
    last_fed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_trained: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_combat_used: {
      type: DataTypes.DATE,
      allowNull: true
    },
    combat_uses_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    combat_flee_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    combat_damage_dealt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UserSpiritPet',
    tableName: 'user_spirit_pets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'pet_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['pet_id']
      },
      {
        fields: ['user_id', 'is_active']
      }
    ]
  });

  return UserSpiritPet;
};