/**
 * Модель для алхимических рецептов
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

class AlchemyRecipe extends Model {
  static associate(models) {
    // Связь один-ко-многим с ингредиентами рецепта
    if (models.RecipeIngredient) {
      AlchemyRecipe.hasMany(models.RecipeIngredient, {
        foreignKey: 'recipe_id', // Используем snake_case для соответствия БД
        as: 'ingredients',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель RecipeIngredient не найдена при установке ассоциаций');
    }

    // Связь один-ко-многим с результатами рецепта
    if (models.AlchemyResult) {
      AlchemyRecipe.hasMany(models.AlchemyResult, {
        foreignKey: 'recipe_id', // Используем snake_case для соответствия БД
        as: 'results',
        onDelete: 'CASCADE'
      });
    } else {
      console.error('Модель AlchemyResult не найдена при установке ассоциаций');
    }
  }
}

// Определяем инициализацию модели асинхронно
AlchemyRecipe.init = async function() {
  const sequelize = await getSequelize();
  
  // Вызываем метод init стандартным образом
  return Model.init.call(this, {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    requiredLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'required_level' // Правильное соотношение между camelCase и snake_case
    },
    requiredStage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'required_stage'
    },
    successRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 50.0,
      field: 'success_rate'
    }
  }, {
    sequelize,
    modelName: 'AlchemyRecipe',
    tableName: 'alchemy_recipes', // Используем snake_case для имени таблицы
    timestamps: true,
    underscored: true // Автоматическое преобразование camelCase в snake_case для timestamps полей
  });
};

// Больше не используем самоинициализацию через IIFE
// Инициализация будет происходить централизованно через src/models/initializeModels.js

module.exports = AlchemyRecipe;