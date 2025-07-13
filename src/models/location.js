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

class Location extends Model {
  static associate(models) {
    // Связь с enemy_spawns
    Location.hasMany(models.EnemySpawn, {
      foreignKey: 'location_id',
      as: 'spawns',
      constraints: true,
      onDelete: 'CASCADE'
    });
  }
}

Location.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    energyCost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'energy_cost'
    },
    backgroundImage: {
      type: DataTypes.STRING(200),
      field: 'background_image'
    },
    enemies: {
      type: DataTypes.JSON
    },
    coordinates: {
      type: DataTypes.JSON
    },
    effects: {
      type: DataTypes.JSON
    },
    requirements: {
      type: DataTypes.JSON
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: false,
    underscored: true
  });
};

module.exports = Location;
