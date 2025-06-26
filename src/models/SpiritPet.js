const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SpiritPet extends Model {
    static associate(models) {
      // Связь с пользовательскими питомцами
      this.hasMany(models.UserSpiritPet, {
        foreignKey: 'pet_id',
        as: 'userPets'
      });
    }
  }

  SpiritPet.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['elemental', 'beast', 'mythical', 'celestial', 'demonic', 'spectral']]
      }
    },
    element: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['fire', 'water', 'earth', 'wind', 'lightning', 'ice', 'light', 'dark', 'void', 'none']]
      }
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine']]
      }
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
    evolution_stage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'baby'
    },
    abilities: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    damage_base: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    damage_multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    combat_abilities: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
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
    modelName: 'SpiritPet',
    tableName: 'spirit_pets',
    timestamps: true,
    underscored: true
  });

  return SpiritPet;
};