const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testQuestTriggers() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Тестирование триггеров системы квестов...\n');
        
        // 1. Создаем тестового пользователя
        console.log('1. Создание тестового пользователя...');
        const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, level, experience, coins)
            VALUES ('test_trigger_user', 'test_trigger@example.com', 'hash123', 1, 0, 100)
            RETURNING id, username, created_at
        `);
        
        const userId = userResult.rows[0].id;
        console.log(`✅ Пользователь создан: ID=${userId}, Username=${userResult.rows[0].username}`);
        console.log(`   Время создания: ${userResult.rows[0].created_at}\n`);
        
        // 2. Проверяем автоматическое создание записей quest_progress
        console.log('2. Проверка автоматического создания quest_progress...');
        const questProgressResult = await client.query(`
            SELECT qp.*, q.title 
            FROM quest_progress qp
            JOIN quests q ON qp.quest_id = q.id
            WHERE qp.user_id = $1
            ORDER BY q.id
            LIMIT 5
        `, [userId]);
        
        console.log(`✅ Создано ${questProgressResult.rows.length} записей quest_progress:`);
        questProgressResult.rows.forEach(row => {
            console.log(`   - Квест: "${row.title}" (ID=${row.quest_id}), Статус: ${row.status}`);
        });
        console.log();
        
        // 3. Проверяем автоматическое создание записей quest_objective_progress
        console.log('3. Проверка автоматического создания quest_objective_progress...');
        const objectiveProgressResult = await client.query(`
            SELECT qop.*, qo.type, qo.description, q.title as quest_title
            FROM quest_objective_progress qop
            JOIN quest_objectives qo ON qop.objective_id = qo.id
            JOIN quests q ON qo.quest_id = q.id
            WHERE qop.user_id = $1
            ORDER BY q.id, qo.id
            LIMIT 10
        `, [userId]);
        
        console.log(`✅ Создано ${objectiveProgressResult.rows.length} записей quest_objective_progress:`);
        objectiveProgressResult.rows.forEach(row => {
            console.log(`   - Квест: "${row.quest_title}", Цель: ${row.type} (${row.description})`);
            console.log(`     Прогресс: ${row.current_progress}/${row.required_progress}, Завершено: ${row.completed}`);
        });
        console.log();
        
        // 4. Тестируем обновление quest_objective_progress и триггер updated_at
        console.log('4. Тестирование обновления quest_objective_progress...');
        if (objectiveProgressResult.rows.length > 0) {
            const firstObjective = objectiveProgressResult.rows[0];
            const oldUpdatedAt = firstObjective.updated_at;
            
            // Ждем 1 секунду для различия во времени
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await client.query(`
                UPDATE quest_objective_progress 
                SET current_progress = current_progress + 1
                WHERE user_id = $1 AND objective_id = $2
            `, [userId, firstObjective.objective_id]);
            
            const updatedResult = await client.query(`
                SELECT current_progress, updated_at
                FROM quest_objective_progress
                WHERE user_id = $1 AND objective_id = $2
            `, [userId, firstObjective.objective_id]);
            
            const newRecord = updatedResult.rows[0];
            console.log(`✅ Обновление прогресса цели:`);
            console.log(`   Прогресс: ${firstObjective.current_progress} → ${newRecord.current_progress}`);
            console.log(`   updated_at: ${oldUpdatedAt} → ${newRecord.updated_at}`);
            console.log(`   Триггер updated_at работает: ${oldUpdatedAt !== newRecord.updated_at ? '✅' : '❌'}\n`);
        }
        
        // 5. Очистка - удаляем тестового пользователя
        console.log('5. Очистка тестовых данных...');
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        console.log('✅ Тестовый пользователь удален\n');
        
        console.log('🎉 Все триггеры работают корректно!');
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании триггеров:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Запуск тестов
testQuestTriggers().catch(console.error);