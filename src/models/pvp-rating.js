/**
 * Модель для рейтингов PvP
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

class PvPRating extends Model {
  static associate(models) {
    // Связь многие-к-одному с режимами
    if (models.PvPMode) {
      PvPRating.belongsTo(models.PvPMode, {
        foreignKey: 'mode_id',
        as: 'pvpMode'
      });
    } else {
      console.error('Модель PvPMode не найдена при установке ассоциаций');
    }
    
    // Связь многие-к-одному с пользователями
    if (models.User) {
      PvPRating.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    } else {
      console.error('Модель User не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
PvPRating.init = async function() {
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
      field: 'user_id'
    },
    mode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'mode_id'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000
    },
    wins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    draws: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    season: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    league: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    modelName: 'PvPRating',
    tableName: 'pvp_ratings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'mode_id', 'season']
      }
    ]
  });
};

module.exports = PvPRating;