'use strict';

module.exports = (sequelize, DataTypes) => {
  const ActivePlayerEffect = sequelize.define('ActivePlayerEffect', {
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
    source_item_id: { // В snake_case
      type: DataTypes.STRING,
      allowNull: true, // Может быть NULL, если эффект не от предмета
      references: {
        model: 'alchemy_items', // Имя таблицы в snake_case
        key: 'id'
      }
    },
    effect_type: { // В snake_case
      type: DataTypes.STRING,
      allowNull: false
    },
    effect_details_json: { // В snake_case
      type: DataTypes.JSONB, // Используем JSONB для эффективности в PostgreSQL
      allowNull: false
    },
    applied_at: { // В snake_case
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    duration_seconds: { // В snake_case
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expires_at: { // В snake_case
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'active_player_effects',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ActivePlayerEffect.associate = (models) => {
    ActivePlayerEffect.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    ActivePlayerEffect.belongsTo(models.AlchemyItem, {
      foreignKey: 'source_item_id',
      as: 'sourceAlchemyItem', // Алиас, чтобы не конфликтовать с другими связями AlchemyItem
      allowNull: true
    });
  };

  return ActivePlayerEffect;
};