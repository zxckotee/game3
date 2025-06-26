/**
 * Модель для истории PvP боев
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

class PvPHistory extends Model {
  static associate(models) {
    // Связь многие-к-одному с комнатами
    if (models.PvPRoom) {
      PvPHistory.belongsTo(models.PvPRoom, {
        foreignKey: 'room_id',
        as: 'pvpRoom'
      });
    } else {
      console.error('Модель PvPRoom не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с пользователями
    if (models.User) {
      PvPHistory.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    } else {
      console.error('Модель User не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с режимами
    if (models.PvPMode) {
      PvPHistory.belongsTo(models.PvPMode, {
        foreignKey: 'mode_id',
        as: 'pvpMode'
      });
    } else {
      console.error('Модель PvPMode не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPHistory.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'room_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    mode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'mode_id'
    },
    result: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    rating_change: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rating_change'
    },
    rewards: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    opponent_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'opponent_ids'
    },
    team_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'team_ids'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'PvPHistory',
    tableName: 'pvp_history',
    timestamps: false,
    underscored: true
  });
};

module.exports = PvPHistory;