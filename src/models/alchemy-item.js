'use strict';

/**
 * Модель для алхимических предметов
 */
module.exports = (sequelize, DataTypes) => {
  const AlchemyItem = sequelize.define('AlchemyItem', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
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
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
    // Поле imageUrl удалено, так как его нет в SQL-схеме таблицы alchemy_items
    // imageUrl: {
    //   type: DataTypes.STRING,
    //   allowNull: true
    // }
  }, {
    tableName: 'alchemy_items', // Обновлено на snake_case
    timestamps: true, // Включаем обратно timestamps
    underscored: true, // Для автоматического преобразования camelCase имен полей модели в snake_case имена столбцов
    createdAt: 'created_at', // Явно указываем имена столбцов
    updatedAt: 'updated_at', // Явно указываем имена столбцов
  });

  AlchemyItem.associate = (models) => {
    // Связь с эффектами предмета (новая модель)
    AlchemyItem.hasMany(models.AlchemyItemEffect, {
      foreignKey: 'item_id', // Обновлено на snake_case
      as: 'alchemyItemEffects', // Новый алиас для ясности
      onDelete: 'CASCADE'
    });

    // Связь со свойствами предмета
    AlchemyItem.hasMany(models.AlchemyItemProperty, {
      foreignKey: 'item_id', // Обновлено на snake_case
      as: 'alchemyItemProperties',
      onDelete: 'CASCADE'
    });

    // Связь со статистиками предмета
    AlchemyItem.hasMany(models.AlchemyItemStat, {
      foreignKey: 'item_id', // Обновлено на snake_case
      as: 'alchemyItemStats',
      onDelete: 'CASCADE'
    });

    // Алхимический предмет может быть ингредиентом в рецептах
    // Эти связи остаются, если модели RecipeIngredient и AlchemyResult существуют и используются
    if (models.RecipeIngredient) {
      AlchemyItem.hasMany(models.RecipeIngredient, {
        foreignKey: 'item_id', // Обновлено на snake_case
        as: 'usedInRecipes',
        constraints: false
      });
    }

    if (models.AlchemyResult) {
      AlchemyItem.hasMany(models.AlchemyResult, {
        foreignKey: 'item_id', // Обновлено на snake_case
        as: 'resultInRecipes',
        constraints: false
      });
    }

    // Связь с записями о cooldown
    AlchemyItem.hasMany(models.UserItemCooldown, {
        foreignKey: 'item_id', // Обновлено на snake_case
        as: 'userCooldowns'
    });

    // Связь с записями об активных эффектах, где этот предмет является источником
    AlchemyItem.hasMany(models.ActivePlayerEffect, {
        foreignKey: 'source_item_id', // Обновлено на snake_case
        as: 'activePlayerEffectsCaused'
    });
  };

  return AlchemyItem;
};