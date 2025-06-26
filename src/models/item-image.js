const { Model, DataTypes } = require('../services/database'); // Предполагаем, что Model импортируется отсюда
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

class ItemImage extends Model {
  static associate(models) {
    // Связь: Изображение Предмета принадлежит Каталогу Предметов
    ItemImage.belongsTo(models.ItemCatalog, {
      foreignKey: 'item_id',
      targetKey: 'item_id', // Явно указываем targetKey для связи
      as: 'itemCatalog', // Псевдоним для связи
    });
  }
}

// Определяем инициализацию модели асинхронно
ItemImage.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    item_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      field: 'item_id', // Явное указание имени поля в БД
      references: {
        model: 'item_catalog', // Имя таблицы, на которую ссылаемся
        key: 'item_id',
      },
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'image_url', // Явное указание имени поля в БД
    },
  }, {
    sequelize,
    modelName: 'ItemImage',
    tableName: 'item_images',
    timestamps: false, // В таблице item_images нет createdAt и updatedAt
    underscored: true, // Используем snake_case для имен полей, если они отличаются от camelCase в модели
  });
};

// Опционально: немедленная инициализация для проверки (можно убрать, если инициализация централизована)
/*
(async () => {
  try {
    await ItemImage.init();
    console.log('ItemImage модель инициализирована (классовый стиль)');
  } catch (error) {
    console.error('Ошибка инициализации модели ItemImage (классовый стиль):', error);
  }
})();
*/

module.exports = ItemImage;