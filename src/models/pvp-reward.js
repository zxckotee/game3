/**
 * Модель для наград PvP
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

class PvPReward extends Model {
  static associate(models) {
    // Связь с предметом в каталоге (закомментировано до создания модели ItemCatalog)
    /*
    if (models.ItemCatalog) {
      PvPReward.belongsTo(models.ItemCatalog, {
        foreignKey: 'item_id',
        targetKey: 'item_id',
        as: 'item'
      });
    } else {
      console.error('Модель ItemCatalog не найдена при установке ассоциаций');
    }
    */
  }
}

// Определяем инициализацию модели асинхронно
PvPReward.init = async function() {
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
    item_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'item_id'
    },
    min_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'min_rating'
    },
    season: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_unique: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_unique'
    },
    rarity: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    stats: {
      type: DataTypes.JSONB,
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
    modelName: 'PvPReward',
    tableName: 'pvp_rewards',
    timestamps: true,
    underscored: true
  });
};

module.exports = PvPReward;