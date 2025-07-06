/**
 * Скрипт миграции прогресса квестов из JSONB в нормализованную таблицу
 * Переносит данные из quest_progress.progress в quest_objective_progress
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Подключение к базе данных
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost:5432/game3', {
  dialect: 'postgres',
  logging: console.log,
  define: {
    timestamps: false,
    freezeTableName: true
  }
});

// Определяем модели для миграции
const QuestProgress = sequelize.define('quest_progress', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  questId: { type: Sequelize.INTEGER, allowNull: false },
  status: { type: Sequelize.STRING, defaultValue: 'active' },
  progress: { type: Sequelize.JSONB, defaultValue: {} },
  completed_objectives: { type: Sequelize.JSONB, defaultValue: [] },
  startedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  completedAt: { type: Sequelize.DATE }
});

const QuestObjective = sequelize.define('quest_objective', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  quest_id: { type: Sequelize.INTEGER, allowNull: false },
  type: { type: Sequelize.STRING, allowNull: false },
  description: { type: Sequelize.TEXT, allowNull: false },
  requiredProgress: { type: Sequelize.INTEGER, defaultValue: 1 },
  metadata: { type: Sequelize.JSONB, defaultValue: {} }
});

const QuestObjectiveProgress = sequelize.define('quest_objective_progress', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  objectiveId: { type: Sequelize.INTEGER, allowNull: false },
  currentProgress: { type: Sequelize.INTEGER, defaultValue: 0 },
  requiredProgress: { type: Sequelize.INTEGER, allowNull: false },
  completed: { type: Sequelize.BOOLEAN, defaultValue: false },
  completedAt: { type: Sequelize.DATE },
  metadata: { type: Sequelize.JSONB, defaultValue: {} }
});

async function migrateQuestProgress() {
  try {
    console.log('🚀 Начинаем миграцию прогресса квестов...');

    // Проверяем подключение к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Получаем все записи прогресса квестов с данными в JSONB
    const questProgresses = await QuestProgress.findAll({
      where: {
        progress: {
          [Sequelize.Op.ne]: {}
        }
      },
      include: [{
        model: QuestObjective,
        as: 'objectives',
        through: { attributes: [] }
      }]
    });

    console.log(`📊 Найдено ${questProgresses.length} записей для миграции`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const questProgress of questProgresses) {
      try {
        console.log(`\n🔄 Обрабатываем квест ${questProgress.questId} пользователя ${questProgress.userId}`);

        // Получаем цели квеста
        const objectives = await QuestObjective.findAll({
          where: { quest_id: questProgress.questId }
        });

        if (objectives.length === 0) {
          console.log(`⚠️  Цели для квеста ${questProgress.questId} не найдены, пропускаем`);
          skippedCount++;
          continue;
        }

        // Обрабатываем каждую цель
        for (const objective of objectives) {
          const objectiveId = objective.id;
          const currentProgress = questProgress.progress[objectiveId] || 0;
          const isCompleted = questProgress.completed_objectives.includes(objectiveId);

          // Проверяем, существует ли уже запись в новой таблице
          const existingProgress = await QuestObjectiveProgress.findOne({
            where: {
              userId: questProgress.userId,
              objectiveId: objectiveId
            }
          });

          if (existingProgress) {
            console.log(`⏭️  Прогресс цели ${objectiveId} уже существует, пропускаем`);
            continue;
          }

          // Создаем новую запись
          await QuestObjectiveProgress.create({
            userId: questProgress.userId,
            objectiveId: objectiveId,
            currentProgress: currentProgress,
            requiredProgress: objective.requiredProgress,
            completed: isCompleted,
            completedAt: isCompleted ? questProgress.completedAt : null,
            metadata: {
              migratedFrom: 'jsonb',
              migratedAt: new Date().toISOString(),
              originalProgress: currentProgress
            }
          });

          console.log(`✅ Создана запись прогресса: цель ${objectiveId}, прогресс ${currentProgress}/${objective.requiredProgress}, завершена: ${isCompleted}`);
        }

        migratedCount++;

      } catch (error) {
        console.error(`❌ Ошибка при обработке квеста ${questProgress.questId}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Миграция завершена!`);
    console.log(`✅ Успешно обработано: ${migratedCount} квестов`);
    console.log(`⚠️  Пропущено: ${skippedCount} квестов`);

    // Проверяем результаты миграции
    const totalObjectiveProgress = await QuestObjectiveProgress.count();
    console.log(`📈 Общее количество записей в quest_objective_progress: ${totalObjectiveProgress}`);

  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

// Функция для отката миграции (удаления мигрированных данных)
async function rollbackMigration() {
  try {
    console.log('🔄 Начинаем откат миграции...');

    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Удаляем все записи, которые были созданы миграцией
    const deletedCount = await QuestObjectiveProgress.destroy({
      where: {
        metadata: {
          migratedFrom: 'jsonb'
        }
      }
    });

    console.log(`🗑️  Удалено ${deletedCount} мигрированных записей`);
    console.log('✅ Откат миграции завершен');

  } catch (error) {
    console.error('❌ Ошибка отката миграции:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Запуск скрипта
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback') {
    rollbackMigration().catch(console.error);
  } else {
    migrateQuestProgress().catch(console.error);
  }
}

module.exports = {
  migrateQuestProgress,
  rollbackMigration
};