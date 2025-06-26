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

class GroupInvitation extends Model {
  static associate(models) {
    GroupInvitation.belongsTo(models.Group, {
      foreignKey: 'group_id', // Используем snake_case
      as: 'group'
    });
    GroupInvitation.belongsTo(models.User, {
      foreignKey: 'invitee_id', // Используем snake_case
      as: 'invitee'
    });
    GroupInvitation.belongsTo(models.User, {
      foreignKey: 'inviter_id', // Используем snake_case
      as: 'inviter'
    });
  }
}

GroupInvitation.init = async function() {
  const sequelize = await getSequelize();
  
  return Model.init.call(this, {
    id: { // Соответствует id в миграции
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    groupId: { // Соответствует groupId в миграции
      type: DataTypes.UUID,
      allowNull: false,
      field: 'group_id', // Добавляем field для snake_case
      references: {
        model: 'groups', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    inviteeId: { // Соответствует inviteeId в миграции
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invitee_id', // Добавляем field для snake_case
      references: {
        model: 'users', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    inviterId: { // Соответствует inviterId в миграции
      type: DataTypes.UUID,
      allowNull: false,
      field: 'inviter_id', // Добавляем field для snake_case
      references: {
        model: 'users', // Имя таблицы в lowercase
        key: 'id'
      }
    },
    status: { // Соответствует status в миграции
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
      defaultValue: 'pending',
      allowNull: false
    },
    message: { // Соответствует message в миграции
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: { // Соответствует expiresAt в миграции
      type: DataTypes.DATE,
      allowNull: false // Исправлено allowNull
    },
    responseMessage: { // Добавлено поле responseMessage из миграции
      type: DataTypes.TEXT,
      allowNull: true
    },
    respondedAt: { // Добавлено поле respondedAt из миграции
      type: DataTypes.DATE,
      allowNull: true
    }
    // Sequelize автоматически добавит createdAt и updatedAt
  }, {
    sequelize,
    modelName: 'GroupInvitation',
    tableName: 'group_invitations', // Имя таблицы в lowercase
    timestamps: true,              // Явно указываем использование временных меток
    underscored: true,             // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
    indexes: [ // Индексы из старой модели
      {
        fields: ['invitee_id'] // Используем snake_case
      },
      {
        fields: ['group_id'] // Используем snake_case
      }
    ]
  });
};

// Инициализируем модель сразу для применения изменений
(async () => {
  try {
    await GroupInvitation.init();
    console.log('GroupInvitation модель инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации модели GroupInvitation:', error);
    console.error(error.stack);
  }
})();

module.exports = GroupInvitation;
