const { Model, DataTypes } = require('sequelize');
const modelRegistry = require('./registry');

class Combat extends Model {
  static associate(models) {
    Combat.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Combat.belongsTo(models.Enemy, {
      foreignKey: 'enemy_id',
      as: 'enemy'
    });
  }
}

module.exports = (sequelize) => {
  Combat.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    enemy_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    player_state: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    enemy_state: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    },
    turn: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'player'
    },
    winner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    log: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    rewards: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    last_updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: 'Combat',
    tableName: 'combats',
    timestamps: true,
    underscored: true
  });

  return Combat;
};