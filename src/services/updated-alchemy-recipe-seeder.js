const AlchemyRecipe = require('../models/alchemy-recipe');
const RecipeIngredient = require('../models/recipe-ingredient');
const AlchemyResult = require('../models/alchemy-result');
const { getResourceById, resources } = require('../data/resources');
const { alchemyRecipes } = require('../data/alchemy-recipes');
const { sequelize } = require('./database');

/**
 * Сидер для алхимических рецептов, использующий реальные ресурсы из базы данных
 */
class UpdatedAlchemyRecipeSeeder {
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

      // Используем рецепты из централизованного источника данных
      // Обратите внимание, что в updated-alchemy-recipe-seeder используется resourceId вместо itemId для ингредиентов,
      // поэтому нам нужно преобразовать формат ингредиентов
      
      // Создаем новый массив рецептов с правильным форматом ингредиентов
      const allRecipes = alchemyRecipes.all.map(recipe => {
        // Копируем базовую информацию о рецепте
        const newRecipe = {
          name: recipe.name,
          description: recipe.description,
          type: recipe.type,
          rarity: recipe.rarity,
          requiredLevel: recipe.requiredLevel,
          requiredStage: recipe.requiredStage,
          successRate: recipe.successRate,
          results: recipe.results // Результаты оставляем без изменений
        };
        
        // Преобразуем ингредиенты: меняем itemId на resourceId
        newRecipe.ingredients = recipe.ingredients.map(ingredient => ({
          resourceId: ingredient.itemId,
          quantity: ingredient.quantity
        }));
        
        return newRecipe;
      });

      // Создаем рецепты и их ингредиенты/результаты
      for (const recipeData of allRecipes) {
        const { ingredients, results, ...recipeInfo } = recipeData;
        
        // Создаем рецепт
        const recipe = await AlchemyRecipe.create(recipeInfo, { transaction });
        
        // Добавляем ингредиенты
        for (const ingredient of ingredients) {
          await RecipeIngredient.create({
            recipeId: recipe.id,
            resourceId: ingredient.resourceId,
            quantity: ingredient.quantity
          }, { transaction });
        }
        
        // Добавляем результаты
        for (const result of results) {
          await AlchemyResult.create({
            recipeId: recipe.id,
            itemId: result.itemId,
            quantity: result.quantity
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

module.exports = UpdatedAlchemyRecipeSeeder;
