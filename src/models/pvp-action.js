/**
 * Модель для действий в PvP боях
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

class PvPAction extends Model {
  static associate(models) { 
    // Связь многие-к-одному с комнатами
    if (models.PvPRoom) {
      PvPAction.belongsTo(models.PvPRoom, {
        foreignKey: 'room_id',
        as: 'pvpRoom'
      });
    } else {
      console.error('Модель PvPRoom не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с участниками (исполнитель)
    if (models.PvPParticipant) {
      PvPAction.belongsTo(models.PvPParticipant, {
        foreignKey: 'participant_id',
        as: 'actor'
      });
    } else {
      console.error('Модель PvPParticipant не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с участниками (цель)
    if (models.PvPParticipant) {
      PvPAction.belongsTo(models.PvPParticipant, {
        foreignKey: 'target_id',
        as: 'target'
      });
    } else {
      console.error('Модель PvPParticipant не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPAction.init = async function() {
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
    participant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'participant_id'
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'action_type'
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_id'
    },
    technique_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'technique_id'
    },
    damage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    healing: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    effects: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'PvPAction',
    tableName: 'pvp_actions',
    timestamps: false,
    underscored: true
  });
};

module.exports = PvPAction;