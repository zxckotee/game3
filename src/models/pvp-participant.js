/**
 * Модель для участников PvP
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

class PvPParticipant extends Model {
  static associate(models) {
    // Связь многие-к-одному с комнатами
    if (models.PvPRoom) {
      PvPParticipant.belongsTo(models.PvPRoom, {
        foreignKey: 'room_id',
        as: 'pvpRoom'
      });
    } else {
      console.error('Модель PvPRoom не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с пользователями
    if (models.User) {
      PvPParticipant.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    } else {
      console.error('Модель User не найдена при установке ассоциаций');
    }
    
    // Связь один-ко-многим с действиями (как исполнитель)
    if (models.PvPAction) {
      PvPParticipant.hasMany(models.PvPAction, {
        foreignKey: 'participant_id',
        as: 'actions',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPAction не найдена при установке ассоциаций');
    }
    
    // Связь один-ко-многим с действиями (как цель)
    if (models.PvPAction) {
      PvPParticipant.hasMany(models.PvPAction, {
        foreignKey: 'target_id',
        as: 'receivedActions',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель PvPAction не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPParticipant.init = async function() {
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
    team: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    },
    current_hp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'current_hp'
    },
    max_hp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_hp'
    },
    current_energy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'current_energy'
    },
    max_energy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_energy'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    last_action_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_action_time'
    },
    effects: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'effects'
    },
    cooldowns: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'cooldowns'
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
    modelName: 'PvPParticipant',
    tableName: 'pvp_participants',
    timestamps: true,
    underscored: true
  });
};

module.exports = PvPParticipant;