'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserItemCooldown = sequelize.define('UserItemCooldown', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: { // В snake_case
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Имя таблицы в snake_case
        key: 'id'
      }
    },
    item_id: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'alchemy_items', // Имя таблицы в snake_case
        key: 'id'
      }
    },
    cooldown_ends_at: { // В snake_case
      type: DataTypes.DATE, // Соответствует TIMESTAMP WITH TIME ZONE в PostgreSQL
      allowNull: false
    }
  }, {
    tableName: 'user_item_cooldowns',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  UserItemCooldown.associate = (models) => {
    UserItemCooldown.belongsTo(models.User, { // Предполагаем, что модель User существует и будет передана в models
      foreignKey: 'user_id',
      as: 'user'
    });
    UserItemCooldown.belongsTo(models.AlchemyItem, {
      foreignKey: 'item_id',
      as: 'alchemyItem'
    });
  };

  return UserItemCooldown;
};