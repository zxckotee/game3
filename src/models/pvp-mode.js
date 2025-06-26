/**
 * Модель для режимов PvP
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

class PvPMode extends Model {
  static associate(models) {
    // Связь один-ко-многим с комнатами
    if (models.PvPRoom) {
      PvPMode.hasMany(models.PvPRoom, {
        foreignKey: 'mode_id',
        as: 'pvpRooms',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPRoom не найдена при установке ассоциаций');
    }
    
    // Связь один-ко-многим с рейтингами
    if (models.PvPRating) {
      PvPMode.hasMany(models.PvPRating, {
        foreignKey: 'mode_id',
        as: 'pvpRatings',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPRating не найдена при установке ассоциаций');
    }

    // Связь один-ко-многим с историей
    if (models.PvPHistory) {
      PvPMode.hasMany(models.PvPHistory, {
        foreignKey: 'mode_id',
        as: 'pvpHistoryEntries',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPHistory не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPMode.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    player_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'player_count'
    },
    team_size: {
      type: DataTypes.VIRTUAL,
      get() {
        // Вычисляем размер команды как половину от общего числа игроков
        return Math.ceil(this.getDataValue('player_count') / 2);
      }
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    rewards_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'rewards_config'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'PvPMode',
    tableName: 'pvp_modes',
    timestamps: true,
    underscored: true
  });
};

module.exports = PvPMode;