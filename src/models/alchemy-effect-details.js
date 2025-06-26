'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AlchemyEffectDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AlchemyEffectDetails.belongsTo(models.AlchemyItemEffect, {
        foreignKey: 'effect_id',
        as: 'effect',
        onDelete: 'CASCADE',
      });
    }
  }
  AlchemyEffectDetails.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    effect_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'alchemy_item_effects', // Имя таблицы, на которую ссылаемся
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    target_attribute: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    value_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'absolute'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'AlchemyEffectDetails',
    tableName: 'alchemy_effect_details',
    timestamps: true, // Sequelize будет управлять created_at и updated_at
    underscored: true, // Для использования snake_case в именах столбцов БД
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return AlchemyEffectDetails;
};