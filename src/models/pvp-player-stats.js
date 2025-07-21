/**
 * Модель для хранения характеристик игрока в PvP
 */
const { Model, DataTypes } = require('../services/database');
const { unifiedDatabase } = require('../services/database-connection-manager');

// Получаем экземпляр Sequelize асинхронно
let sequelizeInstance = null;
async function getSequelize() {
  if (!sequelizeInstance) {
    const result = await unifiedDatabase.getSequelizeInstance();
    sequelizeInstance = result.db;
  }
  return sequelizeInstance;
}

class PvPPlayerStats extends Model {
  static associate(models) {
    // Определение связей с другими моделями
    PvPPlayerStats.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    PvPPlayerStats.belongsTo(models.PvPRoom, {
      foreignKey: 'room_id',
      as: 'room'
    });
  }
}

// Определяем инициализацию модели асинхронно
PvPPlayerStats.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pvp_rooms',
        key: 'id'
      }
    },
    physical_attack: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    physical_defense: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    spiritual_attack: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    spiritual_defense: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PvPPlayerStats',
    tableName: 'pvp_player_stats',
    timestamps: true,
    underscored: true
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = PvPPlayerStats;