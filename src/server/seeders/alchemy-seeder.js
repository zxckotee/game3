/**
 * Сидер для заполнения алхимических таблиц данными
 * Использует статические данные из файлов для заполнения БД
 */

const { unifiedDatabase } = require('../../services/database-connection-manager-adapter');
const originalAlchemyItems = require('../../data/alchemy-items');
const originalAlchemyRecipes = require('../../data/alchemy-recipes');

/**
 * Заполнение таблицы алхимических предметов
 */
async function seedAlchemyItems() {
  try {
    console.log('Начинаем заполнение таблицы AlchemyItems...');
    
    // Получаем модели из Sequelize
    const AlchemyItem = await unifiedDatabase.getCollection('AlchemyItem');
    const ItemEffect = await unifiedDatabase.getCollection('ItemEffect');
    
    // Получаем статические данные из файла
    const items = originalAlchemyItems.getDefaultAlchemyItems();
    
    // Используем транзакцию для атомарной операции
    await unifiedDatabase.transaction(async (transaction) => {
      // Удаляем существующие данные (опционально)
      await AlchemyItem.destroy({ truncate: { cascade: true }, transaction });
      
      // Обрабатываем каждый предмет
      for (const item of items) {
        // Создаем запись предмета
        const createdItem = await AlchemyItem.create({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity,
          value: item.value || 0,
          imageUrl: item.imageUrl
        }, { transaction });
        
        // Добавляем эффекты предмета, если они есть
        if (item.effects && item.effects.length > 0) {
          for (const effect of item.effects) {
            await ItemEffect.create({
              itemId: createdItem.id,
              type: effect.type,
              value: effect.value,
              duration: effect.duration || 0
            }, { transaction });
          }
        }
      }
    });
    
    console.log(`Успешно добавлено ${items.length} алхимических предметов`);
    return true;
  } catch (error) {
    console.error('Ошибка при заполнении таблицы AlchemyItems:', error);
    return false;
  }
}

/**
 * Заполнение таблицы алхимических рецептов
 */
async function seedAlchemyRecipes() {
  try {
    console.log('Начинаем заполнение таблицы AlchemyRecipes...');
    
    // Получаем модели из Sequelize
    const AlchemyRecipe = await unifiedDatabase.getCollection('AlchemyRecipe');
    const RecipeIngredient = await unifiedDatabase.getCollection('RecipeIngredient');
    const AlchemyResult = await unifiedDatabase.getCollection('AlchemyResult');
    
    // Получаем статические данные из файла
    const recipes = originalAlchemyRecipes.getDefaultRecipes();
    
    // Используем транзакцию для атомарной операции
    await unifiedDatabase.transaction(async (transaction) => {
      // Удаляем существующие данные (опционально)
      await AlchemyRecipe.destroy({ truncate: { cascade: true }, transaction });
      
      // Обрабатываем каждый рецепт
      for (const recipe of recipes) {
        // Создаем запись рецепта
        const createdRecipe = await AlchemyRecipe.create({
          name: recipe.name,
          description: recipe.description,
          type: recipe.type,
          rarity: recipe.rarity,
          requiredLevel: recipe.requiredLevel,
          requiredStage: recipe.requiredStage,
          successRate: recipe.successRate
        }, { transaction });
        
        // Добавляем ингредиенты рецепта
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          for (const ingredient of recipe.ingredients) {
            await RecipeIngredient.create({
              recipeId: createdRecipe.id,
              itemId: ingredient.itemId,
              quantity: ingredient.quantity
            }, { transaction });
          }
        }
        
        // Добавляем результаты рецепта
        if (recipe.results && recipe.results.length > 0) {
          for (const result of recipe.results) {
            await AlchemyResult.create({
              recipeId: createdRecipe.id,
              itemId: result.itemId,
              quantity: result.quantity,
              chance: result.chance || 100.0
            }, { transaction });
          }
        }
      }
    });
    
    console.log(`Успешно добавлено ${recipes.length} алхимических рецептов`);
    return true;
  } catch (error) {
    console.error('Ошибка при заполнении таблицы AlchemyRecipes:', error);
    return false;
  }
}

/**
 * Запуск всех сидеров алхимии
 */
async function seedAllAlchemyData() {
  console.log('Запуск всех сидеров алхимии...');
  
  // Сначала заполняем предметы, так как они требуются для рецептов
  const itemsSuccess = await seedAlchemyItems();
  const recipesSuccess = await seedAlchemyRecipes();
  
  if (itemsSuccess && recipesSuccess) {
    console.log('Все данные алхимии успешно добавлены в БД!');
    return true;
  } else {
    console.error('Произошла ошибка при заполнении данных алхимии.');
    return false;
  }
}

module.exports = {
  seedAlchemyItems,
  seedAlchemyRecipes,
  seedAllAlchemyData
};