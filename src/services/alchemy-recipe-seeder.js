const AlchemyRecipe = require('../models/alchemy-recipe');
const RecipeIngredient = require('../models/recipe-ingredient');
const AlchemyResult = require('../models/alchemy-result');
const { sequelize } = require('./database');
const { alchemyRecipes } = require('../data/alchemy-recipes');

class AlchemyRecipeSeeder {
  static async seedAlchemyRecipes() {
    const transaction = await sequelize.transaction();

    try {
      // Проверяем, есть ли уже рецепты в базе данных
      const recipeCount = await AlchemyRecipe.count({ transaction });
      
      if (recipeCount > 0) {
        console.log('Рецепты алхимии уже существуют в базе данных');
        await transaction.commit();
        return;
      }

      // Используем централизованный источник данных из файла alchemy-recipes.js
      const allRecipes = alchemyRecipes.all;

      // Создаем рецепты и их ингредиенты/результаты
      for (const recipeData of allRecipes) {
        const { ingredients, results, ...recipeInfo } = recipeData;
        
        // Создаем рецепт
        const recipe = await AlchemyRecipe.create(recipeInfo, { transaction });
        
        // Добавляем ингредиенты
        for (const ingredient of ingredients) {
          await RecipeIngredient.create({
            recipeId: recipe.id,
            ...ingredient
          }, { transaction });
        }
        
        // Добавляем результаты
        for (const result of results) {
          await AlchemyResult.create({
            recipeId: recipe.id,
            ...result
          }, { transaction });
        }
      }

      await transaction.commit();
      console.log('Рецепты алхимии успешно добавлены в базу данных');
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка при добавлении рецептов алхимии:', error);
      throw error;
    }
  }
}

module.exports = AlchemyRecipeSeeder;
