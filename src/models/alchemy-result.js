/**
 * Модель для результатов рецептов алхимии
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

class AlchemyResult extends Model {
  static associate(models) {
    // Связь с рецептом
    if (models.AlchemyRecipe) {
      AlchemyResult.belongsTo(models.AlchemyRecipe, {
        foreignKey: 'recipe_id',
        as: 'recipe',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель AlchemyRecipe не найдена при установке ассоциаций');
    }
    
    // Связь с предметом
    if (models.InventoryItem) {
      AlchemyResult.belongsTo(models.InventoryItem, {
        foreignKey: 'item_id',
        targetKey: 'itemId', // Связываем с полем itemId модели InventoryItem вместо id
        as: 'item',
        constraints: false // Используем строковое соответствие, без ограничения внешнего ключа
      });
    } else {
      console.error('Модель InventoryItem не найдена при установке ассоциаций');
    }
  }

  // Метод для получения информации о результате с данными о предмете
  static async getWithItemDetails(resultId) {
    const sequelize = await getSequelize();
    return await this.findByPk(resultId, {
      include: [
        { 
          model: sequelize.models.InventoryItem, 
          as: 'item'
        }
      ]
    });
  }
}

// Определяем инициализацию модели асинхронно
AlchemyResult.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recipe_id',
      references: {
        model: 'alchemy_recipes',
        key: 'id'
      }
    },
    item_id: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_id'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    chance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 100.0
    }
  }, {
    sequelize,
    modelName: 'AlchemyResult',
    tableName: 'alchemy_results',
    timestamps: true,
    underscored: true
  });
};

module.exports = AlchemyResult;
