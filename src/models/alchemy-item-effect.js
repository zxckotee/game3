'use strict';

module.exports = (sequelize, DataTypes) => {
  const AlchemyItemEffect = sequelize.define('AlchemyItemEffect', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    item_id: { // В snake_case для соответствия столбцу БД
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'alchemy_items', // Имя таблицы в snake_case
        key: 'id'
      }
    },
    effect_type: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false // Предполагаем, что описание всегда есть и содержит данные для парсинга
    }
  }, {
    tableName: 'alchemy_item_effects',
    timestamps: true, // Включаем обратно timestamps
    underscored: true, // Для автоматического преобразования camelCase имен полей модели в snake_case имена столбцов
    createdAt: 'created_at', // Явно указываем имена столбцов
    updatedAt: 'updated_at', // Явно указываем имена столбцов
  });

  AlchemyItemEffect.associate = (models) => {
    AlchemyItemEffect.belongsTo(models.AlchemyItem, {
      foreignKey: 'item_id', // Указываем внешний ключ в snake_case
      as: 'alchemyItem' // Алиас для связи
    });

    // Связь с деталями эффекта
    AlchemyItemEffect.hasMany(models.AlchemyEffectDetails, {
      foreignKey: 'effect_id',
      as: 'details', // Алиас для доступа к связанным деталям
      onDelete: 'CASCADE' // Если эффект удаляется, удаляются и его детали
    });
  };

  return AlchemyItemEffect;
};