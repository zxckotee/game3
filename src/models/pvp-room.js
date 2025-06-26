/**
 * Модель для комнат PvP
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

class PvPRoom extends Model {
  static associate(models) {
    // Связь многие-к-одному с режимами
    if (models.PvPMode) {
      PvPRoom.belongsTo(models.PvPMode, {
        foreignKey: 'mode_id',
        as: 'pvpMode'
      });
    } else {
      console.error('Модель PvPMode не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с пользователями (лидером)
    if (models.User) {
      PvPRoom.belongsTo(models.User, {
        foreignKey: 'leader_id',
        as: 'leader'
      });
    } else {
      console.error('Модель User не найдена при установке ассоциаций');
    }
    
    // Связь один-ко-многим с участниками
    if (models.PvPParticipant) {
      PvPRoom.hasMany(models.PvPParticipant, {
        foreignKey: 'room_id',
        as: 'participants',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPParticipant не найдена при установке ассоциаций');
    }
    
    // Связь один-ко-многим с действиями
    if (models.PvPAction) {
      PvPRoom.hasMany(models.PvPAction, {
        foreignKey: 'room_id',
        as: 'actions',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPAction не найдена при установке ассоциаций');
    }

    // Связь один-ко-многим с историей
    if (models.PvPHistory) {
      PvPRoom.hasMany(models.PvPHistory, {
        foreignKey: 'room_id',
        as: 'history_entries',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPHistory не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPRoom.init = async function() {
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
    mode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'mode_id'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'waiting'
    },
    min_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'min_level'
    },
    max_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_level'
    },
    leader_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'leader_id'
    },
    winner_team: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'winner_team'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
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
    modelName: 'PvPRoom',
    tableName: 'pvp_rooms',
    timestamps: true,
    underscored: true
  });
};

module.exports = PvPRoom;