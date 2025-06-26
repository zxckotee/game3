const express = require('express');
const router = express.Router();
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const { calculateETag } = require('../../utils/etag-utils');

const { unifiedDatabase, initializeDatabaseConnection } = require('../../services/database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');


async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}
 
// API-эндпоинты для работы с сектами

// Специальный обработчик для ошибочного URL с параметром 'available'
router.get('/api/sects/available', async (req, res) => {
  try {
    console.log('Обнаружен запрос к /api/sects/available');
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Уходим от прямого запроса и используем вложенные запросы
    // для избежания любого упоминания слова "rank"
    
    // Шаг 1: Получаем базовую информацию о сектах
    const sectsQuery = `
      SELECT
        s.id,
        s.name,
        s.level,
        s.type as sect_type,
        s.influence,
        s.description,
        COUNT(sm.user_id) as member_count
      FROM sects as s
      LEFT JOIN sect_memberships as sm ON s.id = sm.sect_id
      GROUP BY s.id, s.name, s.level, s.type, s.influence, s.description
      ORDER BY s.level DESC, COUNT(sm.user_id) DESC
    `;
    
    // Выполняем запрос
    const sects = await sequelizeDb.query(sectsQuery, {
      type: sequelizeDb.QueryTypes.SELECT
    });
    
    // Преобразуем данные для ответа
    const availableSects = await Promise.all(sects.map(async (sect) => {
      // Получаем всех членов секты с другим подходом к сортировке
      // Используем более простой подход без подзапросов и лишних сортировок
      const membersQuery = `
        SELECT
          sm.user_id as id,
          u.username as name,
          sm."rank" as user_role,
          sm.joined_at as joinedAt
        FROM
          sect_memberships as sm
        JOIN
          users as u ON sm.user_id = u.id
        WHERE
          sm.sect_id = :sectId
      `;
        
      const members = await sequelizeDb.query(membersQuery,
        {
          replacements: { sectId: sect.id },
          type: sequelizeDb.QueryTypes.SELECT
        }
      );
      
      // Сортируем членов секты на стороне JavaScript
      const sortedMembers = members.sort((a, b) => {
        const roleOrder = {
          'глава': 1,
          'старейшина': 2,
          'старший ученик': 3,
          'внутренний ученик': 4,
          'ученик': 5
        };
        
        const roleA = roleOrder[a.user_role.toLowerCase()] || 99;
        const roleB = roleOrder[b.user_role.toLowerCase()] || 99;
        return roleA - roleB;
      });
      
      return {
        id: sect.id,
        name: sect.name,
        level: sect.level || 1,
        // Возвращаем оба поля для обратной совместимости
        tier: sect.sect_type || 'Начальная',
        rank: sect.sect_type || 'Начальная',
        influence: sect.influence || 0,
        description: sect.description,
        members: sortedMembers,
        memberCount: sect.member_count
      };
    }));
    
    res.json(availableSects);
  } catch (error) {
    console.error('Ошибка при получении доступных сект (обработчик available):', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Получение списка доступных сект для вступления
router.get('/api/sects', async (req, res) => {
  try {
    //console.log('Обрабатываем запрос к /api/sects');
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Уходим от прямого запроса и используем вложенные запросы
    // для избежания любого упоминания слова "rank"
    
    // Шаг 1: Получаем базовую информацию о сектах
    const sectsQuery = `
      SELECT
        s.id,
        s.name,
        s.level,
        s.type as sect_type,
        s.influence,
        s.description,
        COUNT(sm.user_id) as member_count
      FROM sects as s
      LEFT JOIN sect_memberships as sm ON s.id = sm.sect_id
      GROUP BY s.id, s.name, s.level, s.type, s.influence, s.description
      ORDER BY s.level DESC, COUNT(sm.user_id) DESC
    `;
    
    // Выполняем запрос
    const sects = await sequelizeDb.query(sectsQuery, {
      type: sequelizeDb.QueryTypes.SELECT
    });
    
    // Преобразуем данные для ответа
    const availableSects = await Promise.all(sects.map(async (sect) => {
      // Используем более простой подход без подзапросов и лишних сортировок
      const membersQuery = `
        SELECT
          sm.user_id as id,
          u.username as name,
          sm."rank" as user_role,
          sm.joined_at as joinedAt
        FROM
          sect_memberships as sm
        JOIN
          users as u ON sm.user_id = u.id
        WHERE
          sm.sect_id = :sectId
      `;
        
      const members = await sequelizeDb.query(membersQuery, {
        replacements: { sectId: sect.id },
        type: sequelizeDb.QueryTypes.SELECT
      });
      
      // Сортируем членов секты на стороне JavaScript
      const sortedMembers = members.sort((a, b) => {
        const roleOrder = {
          'глава': 1,
          'старейшина': 2,
          'старший ученик': 3,
          'внутренний ученик': 4,
          'ученик': 5
        };
        
        const roleA = roleOrder[a.user_role.toLowerCase()] || 99;
        const roleB = roleOrder[b.user_role.toLowerCase()] || 99;
        return roleA - roleB;
      });
      
      return {
        id: sect.id,
        name: sect.name,
        level: sect.level || 1,
        // Возвращаем оба поля для обратной совместимости
        tier: sect.sect_type || 'Начальная',
        rank: sect.sect_type || 'Начальная',
        influence: sect.influence || 0,
        description: sect.description,
        members: sortedMembers,
        memberCount: sect.member_count
      };
    }));
    
    res.json(availableSects);
  } catch (error) {
    console.error('Ошибка при получении доступных сект:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Получение секты по ID
router.get('/api/sects/:sectId', async (req, res) => {
  try {
    const sectId = req.params.sectId;
  
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Получаем секту по ID
    const sects = await sequelizeDb.query(
      // Избегаем использования * для предотвращения проблем с SQL
      `SELECT
        id,
        name,
        description,
        type,
        level,
        reputation,
        experience,
        required_experience,
        influence,
        created_at,
        updated_at
       FROM sects
       WHERE id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!sects || sects.length === 0) {
      return res.status(404).json({ error: `Секта с ID ${sectId} не найдена` });
    }
    
    const sect = sects[0];
    
    // Получаем членов секты
    const members = await sequelizeDb.query(
      `SELECT sm.*, u.username as name, cp.experience as experience ,u.cultivation_level as cultivationLevel
       FROM sect_memberships sm
       JOIN users u ON sm.user_id = u.id
       JOIN cultivation_progresses cp ON sm.user_id = cp.user_id
       WHERE sm.sect_id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Получаем бонусы секты
    const benefits = await sequelizeDb.query(
      `SELECT * FROM sect_benefits WHERE sect_id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Формируем ответ с форматированием, совместимым с sectService
    const formattedSect = {
      id: sect.id,
      name: sect.name,
      description: sect.description,
      type: sect.type,
      level: sect.level,
      rank: sect.level >= 10 ? 'Высшая' : (sect.level >= 5 ? 'Средняя' : 'Начальная'),
      experience: sect.experience,
      requiredExperience: sect.required_experience,
      influence: sect.influence,
      resources: sect.resources || 0,
      territories: sect.territories || 1,
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        role: member.rank,
        cultivationLevel: member.cultivationLevel,
        level: member.level || 1,
        experience: member.experience || 0,
        requiredExperience: member.required_experience || 100
      })),
      benefits: benefits.map(benefit => ({
        type: benefit.type,
        modifier: benefit.modifier
      }))
    };
    
    res.json(formattedSect);
  } catch (error) {
    console.error(`Ошибка при получении секты с ID ${req.params.sectId}:`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Получение секты пользователя
router.get('/api/users/:userId/sect', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Пользователь с id ${userId} отправил запрос на получение секты`);
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Находим членство пользователя в секте вместе с данными о секте
    const sectMembers = await sequelizeDb.query(
      `SELECT sm.*, s.*
       FROM sect_memberships sm
       JOIN sects s ON sm.sect_id = s.id
       WHERE sm.user_id = :userId
       LIMIT 1`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Если пользователь не состоит в секте, возвращаем 404
    if (!sectMembers || sectMembers.length === 0) {
      // В режиме браузера, можем вернуть демо-секту (как делал SectService)
      if (typeof window !== 'undefined') {
        const savedSectData = localStorage.getItem(`sect_1`); // фиксированный ID 1 для демо-секты
        let level = 1;
        let experience = 0;
        let rank = 'Начальная';
        let requiredExperience = 100;
        
        // Если есть сохраненные данные, используем их
        if (savedSectData) {
          try {
            const parsedData = JSON.parse(savedSectData);
            level = parsedData.level || 1;
            experience = parsedData.experience || 0;
            rank = parsedData.rank || 'Начальная';
            requiredExperience = parsedData.requiredExperience || 100;
          } catch (e) {
            console.error('Ошибка при чтении данных секты из localStorage:', e);
          }
        }
        
        // Создаем демо-секту, подобную defaultSect
        const demoSect = {
          id: 1,
          name: 'Секта Восходящего Облака',
          rank: rank,
          level: level,
          experience: experience,
          requiredExperience: requiredExperience,
          influence: 100,
          resources: 50,
          territories: 1,
          benefits: [
            {type: 'cultivation_speed', modifier: 5},
            {type: 'resource_gathering', modifier: 3},
            {type: 'energy_regen', modifier: 1},
            {type: 'technique_discount', modifier: 2},
            {type: 'max_energy', modifier: 10}
          ],
          members: [
            { id: 1, name: 'Мастер Ли', role: 'Глава секты', cultivationLevel: 30, level: 8, experience: 200, requiredExperience: 300 },
            { id: 2, name: 'Старейшина Чжан', role: 'Старейшина', cultivationLevel: 25, level: 6, experience: 150, requiredExperience: 250 },
            { id: 3, name: 'Ученик Ван', role: 'Внутренний ученик', cultivationLevel: 15, level: 4, experience: 80, requiredExperience: 150 },
            { id: 4, name: 'Ученица Мэй', role: 'Внутренний ученик', cultivationLevel: 12, level: 3, experience: 50, requiredExperience: 120 },
            { id: 5, name: 'Ученик Чен', role: 'Внешний ученик', cultivationLevel: 8, level: 2, experience: 30, requiredExperience: 100 }
          ]
        };
        
        return res.json(demoSect);
      }
      
      return res.status(404).json({ error: 'Пользователь не состоит в секте' });
    }
    
    const sectMember = sectMembers[0];
    const sectId = sectMember.sect_id;
    
    // Получаем всех членов секты
    const members = await sequelizeDb.query(
      `SELECT sm.*, u.username as name, cp.experience as experience ,u.cultivation_level as cultivation_level
       FROM sect_memberships sm
       JOIN users u ON sm.user_id = u.id
       JOIN cultivation_progresses cp ON sm.user_id = cp.user_id
       WHERE sm.sect_id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Получаем бонусы секты
    const benefits = await sequelizeDb.query(
      `SELECT * FROM sect_benefits WHERE sect_id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Формируем ответ с форматированием, совместимым с sectService
    const sect = {
      id: sectId,
      name: sectMember.name,
      description: sectMember.description,
      type: sectMember.type,
      level: sectMember.level,
      rank: sectMember.level >= 10 ? 'Высшая' : (sectMember.level >= 5 ? 'Средняя' : 'Начальная'),
      experience: sectMember.experience,
      requiredExperience: sectMember.required_experience,
      influence: sectMember.influence,
      resources: sectMember.resources || 0,
      territories: sectMember.territories || 1,
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        userId: member.user_id, // для совместимости
        user_id: member.user_id, 
        role: member.rank,
        level: member.cultivation_level || 1, // это уровень культивизации 
        joinedAt: member.joined_at,
        cultivationLevel: member.cultivation_level || 1, // для совместимости 
        contribution: member.contribution || 0,
        experience: member.experience || 0,
        requiredExperience: member.required_experience || 100
      })),
      benefits: benefits.map(benefit => ({
        type: benefit.type,
        modifier: benefit.modifier
      }))
    };
    
    res.json(sect);
  } catch (error) {
    console.error('Ошибка при получении секты пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Создание новой секты
router.post('/api/sects', async (req, res) => {
  try {
    const { userId, name } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'Необходимо указать ID пользователя и название секты' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Проверяем, состоит ли пользователь уже в секте
    const existingMemberships = await sequelizeDb.query(
      `SELECT * FROM sect_memberships WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existingMemberships && existingMemberships.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже состоит в секте' });
    }
    
    // Проверяем существование пользователя
    const users = await sequelizeDb.query(
      `SELECT * FROM users WHERE id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = users[0];
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Создаем новую секту
      const result = await sequelizeDb.query(
        `INSERT INTO sects (name, description, type, level, experience, required_experience,
         influence, created_at, updated_at)
         VALUES (:name, 'Новая секта культиваторов', 'нейтральная', 1, 0, 100,
         0, NOW(), NOW())
         RETURNING *`,
        {
          replacements: { name },
          type: Sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      
      const newSect = result[0][0];
      
      // Добавляем пользователя как главу секты
      await sequelizeDb.query(
        `INSERT INTO sect_memberships (user_id, sect_id, rank, contribution, joined_at, created_at, updated_at)
         VALUES (:userId, :sectId, 'глава', 0, NOW(), NOW(), NOW())`,
        {
          replacements: {
            userId,
            sectId: newSect.id
          },
          type: Sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      
      // Создаем базовые бонусы для секты
      const defaultBenefits = [
        { type: 'cultivation_speed', modifier: 5 },
        { type: 'resource_gathering', modifier: 3 },
        { type: 'energy_regen', modifier: 1 },
        { type: 'technique_discount', modifier: 2 },
        { type: 'max_energy', modifier: 10 }
      ];
      
      for (const benefit of defaultBenefits) {
        await sequelizeDb.query(
          `INSERT INTO sect_benefits (sect_id, type, modifier, created_at, updated_at)
           VALUES (:sectId, :type, :modifier, NOW(), NOW())`,
          {
            replacements: {
              sectId: newSect.id,
              type: benefit.type,
              modifier: benefit.modifier
            },
            type: Sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Получаем членов секты
      const members = await sequelizeDb.query(
        `SELECT sm.*, u.username as name, u.cultivation_level as cultivationLevel
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.sect_id = :sectId`,
        {
          replacements: { sectId: newSect.id },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      // Получаем бонусы секты
      const benefits = await sequelizeDb.query(
        `SELECT * FROM sect_benefits WHERE sect_id = :sectId`,
        {
          replacements: { sectId: newSect.id },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      // Формируем ответ
      const sect = {
        id: newSect.id,
        name: newSect.name,
        description: newSect.description,
        type: newSect.type,
        level: newSect.level,
        rank: 'Начальная',
        experience: newSect.experience,
        requiredExperience: newSect.required_experience,
        influence: newSect.influence,
        members: members.map(member => ({
          id: member.id,
          name: member.name,
          role: member.rank,
          cultivationLevel: member.cultivationLevel || 1,
          level: member.level || 1,
          experience: member.experience || 0,
          requiredExperience: member.required_experience || 100
        })),
        benefits: benefits.map(benefit => ({
          type: benefit.type,
          modifier: benefit.modifier
        }))
      };
      
      res.json(sect);
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при создании секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Присоединение к секте
router.post('/api/sects/:sectId/members', async (req, res) => {
  try {
    const sectId = req.params.sectId;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Необходимо указать ID пользователя' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Проверяем, состоит ли пользователь уже в секте
    const existingMemberships = await sequelizeDb.query(
      `SELECT * FROM sect_memberships WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existingMemberships && existingMemberships.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже состоит в секте' });
    }
    
    // Проверяем существование пользователя
    const users = await sequelizeDb.query(
      `SELECT * FROM users WHERE id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем существование секты
    const sects = await sequelizeDb.query(
      `SELECT * FROM sects WHERE id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!sects || sects.length === 0) {
      return res.status(404).json({ error: 'Секта не найдена' });
    }
    
    // Добавляем пользователя в секту
    const result = await sequelizeDb.query(
      `INSERT INTO sect_memberships (user_id, sect_id, rank, contribution, joined_at, created_at, updated_at)
       VALUES (:userId, :sectId, 'ученик', 0, NOW(), NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          userId,
          sectId
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );
    
    const sectMember = result[0][0];
    
    // Получаем имя пользователя для форматирования ответа
    const userInfo = await sequelizeDb.query(
      `SELECT username, cultivation_level FROM users WHERE id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Форматируем ответ
    const formattedMember = {
      id: sectMember.id,
      name: userInfo[0].username,
      userId: userId,
      sectId: sectId,
      role: sectMember.rank,
      cultivationLevel: userInfo[0].cultivation_level || 1,
      level: 1,
      experience: 0,
      requiredExperience: 100,
      joinedAt: sectMember.joined_at
    };
    
    res.json(formattedMember);
  } catch (error) {
    console.error('Ошибка при присоединении к секте:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Внесение вклада в секту
router.post('/api/sects/:sectId/contribute', async (req, res) => {
  try {
    const sectId = req.params.sectId;
    const { userId, energyAmount } = req.body;
    
    if (!userId || !energyAmount) {
      return res.status(400).json({ error: 'Необходимо указать ID пользователя и количество энергии для вклада' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Получаем секту по ID
      const sects = await sequelizeDb.query(
        `SELECT * FROM sects WHERE id = :sectId`,
        {
          replacements: { sectId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!sects || sects.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Секта не найдена' });
      }
      
      const sect = sects[0];
      
      // Проверяем, является ли пользователь членом секты
      const sectMembers = await sequelizeDb.query(
        `SELECT * FROM sect_memberships WHERE user_id = :userId AND sect_id = :sectId`,
        {
          replacements: { userId, sectId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!sectMembers || sectMembers.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Пользователь не является членом этой секты' });
      }
      
      // Получаем данные о культивации пользователя
      const cultivations = await sequelizeDb.query(
        `SELECT * FROM cultivation_progresses WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!cultivations || cultivations.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Данные культивации не найдены' });
      }
      
      const cultivation = cultivations[0];
      
      // Проверяем, достаточно ли энергии у пользователя
      if (cultivation.energy < energyAmount) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Недостаточно энергии' });
      }
      
      // Вычитаем энергию у пользователя
      await sequelizeDb.query(
        `UPDATE cultivation_progresses
         SET energy = energy - :energyAmount, updated_at = NOW()
         WHERE user_id = :userId`,
        {
          replacements: { userId, energyAmount },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Добавляем опыт и влияние секте
      let rand_min = 3;  let rand_max = 4;
      const contributionXP = energyAmount * Math.floor(Math.random() * (rand_max - rand_min + 1)) + rand_min; // 1 единица энергии = 3-4 единиц опыта секты
      const influenceGain = Math.floor(energyAmount / 2); // 1 единица энергии = 0.5 единиц влияния
      
      // Обновляем опыт и влияние секты
      await sequelizeDb.query(
        `UPDATE sects
         SET experience = experience + :contributionXP,
             influence = influence + :influenceGain,
             updated_at = NOW()
         WHERE id = :sectId`,
        {
          replacements: { sectId, contributionXP, influenceGain },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Проверяем возможность повышения уровня
      const oldLevel = sect.level;
      let newLevel = oldLevel;
      let newExperience = sect.experience + contributionXP;
      let newRequiredExperience = sect.required_experience;
      let leveledUp = false;
      
      // Форсированно увеличиваем уровень секты, если уровень всё еще 1 или 2
      if (oldLevel <= 2) {
        newLevel = oldLevel + 1;
        newExperience = 0;
        newRequiredExperience = Math.floor(100 * Math.pow(1.2, newLevel - 1));
        leveledUp = true;
      } else {
        // Обычный процесс повышения уровня для более высоких уровней
        while (newExperience >= newRequiredExperience) {
          newLevel += 1;
          newExperience -= newRequiredExperience;
          newRequiredExperience = Math.floor(100 * Math.pow(1.2, newLevel - 1));
          leveledUp = true;
        }
      }
      
      // Определяем новый ранг на основе уровня
      const newRank = newLevel >= 10 ? 'Высшая' : (newLevel >= 5 ? 'Средняя' : 'Начальная');
      
      // Обновляем уровень, опыт и требуемый опыт секты
      await sequelizeDb.query(
        `UPDATE sects
         SET level = :newLevel,
             experience = :newExperience,
             required_experience = :newRequiredExperience,
             updated_at = NOW()
         WHERE id = :sectId`,
        {
          replacements: { sectId, newLevel, newExperience, newRequiredExperience },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );

      // Обновляем данные о вкладах участника
      
      await sequelizeDb.query(
        `UPDATE sect_memberships 
         SET contribution = contribution + :contributionXP
         WHERE user_id = :userId`,
        {
          replacements: {contributionXP, userId},
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Обновляем бонусы секты в зависимости от нового уровня
      const newBenefits = [
        { type: 'cultivation_speed', modifier: Math.round((0.05 + (newLevel * 0.01)) * 100) },
        { type: 'resource_gathering', modifier: Math.round((0.03 + (newLevel * 0.01)) * 100) },
        { type: 'energy_regen', modifier: 1 + Math.floor(newLevel / 2) },
        { type: 'technique_discount', modifier: Math.round((0.02 + (newLevel * 0.005)) * 100) },
        { type: 'max_energy', modifier: 10 + (newLevel * 5) }
      ];
      
      // Удаляем существующие бонусы и добавляем новые
      await sequelizeDb.query(
        `DELETE FROM sect_benefits WHERE sect_id = :sectId`,
        {
          replacements: { sectId },
          type: Sequelize.QueryTypes.DELETE,
          transaction
        }
      );
      
      for (const benefit of newBenefits) {
        await sequelizeDb.query(
          `INSERT INTO sect_benefits (sect_id, type, modifier, created_at, updated_at)
           VALUES (:sectId, :type, :modifier, NOW(), NOW())`,
          {
            replacements: {
              sectId,
              type: benefit.type,
              modifier: benefit.modifier
            },
            type: Sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Возвращаем результат вклада
      const result = {
        leveledUp,
        oldLevel,
        newLevel,
        sectRank: newRank,
        sectExperience: newExperience,
        sectRequiredExperience: newRequiredExperience,
        sectInfluence: sect.influence + influenceGain,
        influenceGain,
        message: `Вклад успешно внесен! Секта получила ${contributionXP} опыта и ${influenceGain} влияния.`
      };
      
      res.json(result);
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при внесении вклада в секту:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Тренировка с членом секты
router.post('/api/sects/members/:memberId/train', async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Необходимо указать ID пользователя' });
    }
    console.log(`memberId: ${memberId}; userId: ${userId}`);
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Получаем члена секты по ID
      const members = await sequelizeDb.query(
        `SELECT sm.*, cp.experience as experience, cp.experience_to_next_level as requiredExperience ,u.username as name ,u.cultivation_level as cultivationLevel, s.level as sect_level
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         JOIN sects s ON sm.sect_id = s.id
         JOIN cultivation_progresses cp ON sm.user_id = cp.user_id
         WHERE sm.id = :memberId`,
        {
          replacements: { memberId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      
      if (!members || members.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Член секты не найден' });
      }
      
      const member = members[0];
      const member_userId = member.user_id;
      const sect_id = member.sect_id;

      if (member_userId == userId) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Вы не можете потренироваться с самим собой' });
      }
      
      // Получаем пользователя, который будет тренироваться
      const users = await sequelizeDb.query(
        `SELECT * FROM users WHERE id = :userId`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!users || users.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      const user = users[0];
      
      // Проверяем, является ли пользователь членом той же секты
      const userMemberships = await sequelizeDb.query(
        `SELECT * FROM sect_memberships WHERE user_id = :userId AND sect_id = :sectId`,
        {
          replacements: { userId, sectId: member.sect_id },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!userMemberships || userMemberships.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Пользователь не является членом этой секты' });
      }
      
      // Получаем данные о культивации пользователя
      const cultivations = await sequelizeDb.query(
        `SELECT * FROM cultivation_progresses WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!cultivations || cultivations.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Данные культивации не найдены' });
      }
      
      const cultivation = cultivations[0];
      
      // Фиксированная стоимость тренировки
      const energyCost = 20;
      
      if (cultivation.energy < energyCost) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Недостаточно энергии для тренировки' });
      }
      
      // Вычитаем энергию у пользователя
      await sequelizeDb.query(
        `UPDATE cultivation_progresses
         SET energy = energy - :energyCost, updated_at = NOW()
         WHERE user_id = :userId`,
        {
          replacements: { userId, energyCost },
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Рассчитываем бонус к опыту на основе уровня культивации члена секты и уровня секты
      const memberLevel = member.cultivationLevel || 1;
      const sectLevel = member.sect_level || 1;
      const experience = member.experience || 0; const requiredExperience = member.requiredExperience || 100;
      const baseBonusPercent = 5 + (Math.floor(memberLevel / 5) * 2) + (sectLevel);
      
      // Фиксированное количество опыта за тренировку
      const baseExperience = 20; // Базовый опыт за тренировку
      let rand_min = -3; let rand_max = 3; 
      const bonusExperience = Math.floor(baseExperience * (baseBonusPercent / 100)) + Math.floor(Math.random() * (rand_max - rand_min + 1)) + rand_min;
      const totalExperience = baseExperience + bonusExperience;

      // нейронка не изменяй этот запрос пж, я добавляю опыт обоим игрокам, т.к. тренировались вместе Начало
      // Обновляем опыт первого пользователя с ограничением максимума
      await sequelizeDb.query(
        `UPDATE cultivation_progresses
         SET experience = LEAST(experience + :totalExperience, experience_to_next_level),
             updated_at = NOW()
         WHERE user_id = :userId`,
        {
          replacements: {userId, totalExperience},
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Обновляем опыт второго пользователя (напарника) с ограничением максимума
      await sequelizeDb.query(
        `UPDATE cultivation_progresses
         SET experience = LEAST(experience + :totalExperience, experience_to_next_level),
             updated_at = NOW()
         WHERE user_id = :member_userId`,
        {
          replacements: {member_userId, totalExperience},
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );

      /* Убираем из запроса          UPDATE character_profile 
         SET experience = experience + :resultExperience,
             updated_at = NOW()
         WHERE user_id = :userId OR user_id = :member_userId;
         
         UPDATE users 
         SET experience = experience + :resultExperience,
             updated_at = NOW()
         WHERE id = :userId OR id = :member_userId */
        
      // Обновляем Опыт секты

      await sequelizeDb.query(
        `UPDATE sects SET experience = experience + 5
        WHERE id = :sect_id`, 
        {
          replacements: {sect_id},
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
          

      // нейронка не изменяй этот запрос пж, я добавляю опыт обоим игрокам, т.к. тренировались вместе Конец
      
      // Фиксированное повышение уровня в секте
      const experienceIncrease = 10; // Фиксированное увеличение опыта

      // Фиксируем транзакцию
      await transaction.commit();
      
      // Возвращаем результат тренировки
      const result = {
        experienceGained: totalExperience,
        energySpent: energyCost,
        bonusPercent: baseBonusPercent,
        experienceIncrease: experienceIncrease,
        message: `Тренировка с ${member.name} успешно завершена! Получено ${totalExperience} опыта.`
      };
      
      res.json(result);
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при тренировке с членом секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Получение бонусов от секты
router.get('/api/users/:userId/sect/benefits', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Находим членство пользователя в секте
    const sectMembers = await sequelizeDb.query(
      `SELECT * FROM sect_memberships WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!sectMembers || sectMembers.length === 0) {
      // В режиме браузера, можем вернуть демо-бонусы
      if (typeof window !== 'undefined') {
        const demoBenefits = [
          {type: 'cultivation_speed', modifier: 5},
          {type: 'resource_gathering', modifier: 3},
          {type: 'energy_regen', modifier: 1},
          {type: 'technique_discount', modifier: 2},
          {type: 'max_energy', modifier: 10}
        ];
        return res.json(demoBenefits);
      }
      
      return res.status(404).json({ error: 'Пользователь не состоит в секте' });
    }
    
    const sectId = sectMembers[0].sect_id;
    
    // Получаем бонусы секты
    const benefits = await sequelizeDb.query(
      `SELECT * FROM sect_benefits WHERE sect_id = :sectId`,
      {
        replacements: { sectId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    // Форматируем ответ
    const formattedBenefits = benefits.map(benefit => ({
      type: benefit.type,
      modifier: benefit.modifier
    }));
    
    res.json(formattedBenefits);
  } catch (error) {
    console.error('Ошибка при получении бонусов от секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Получение ранга пользователя в секте
router.get('/api/users/:userId/sect/rank', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Находим членство пользователя в секте
    const sectMembers = await sequelizeDb.query(
      `SELECT sm.*, s.name as sect_name, s.level as sect_level
       FROM sect_memberships sm
       JOIN sects s ON sm.sect_id = s.id
       WHERE sm.user_id = :userId`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (!sectMembers || sectMembers.length === 0) {
      // В режиме браузера, можем вернуть демо-ранг
      if (typeof window !== 'undefined') {
        return res.json({
          userId: userId,
          sectId: 1,
          sectName: 'Секта Восходящего Облака',
          rank: 'Внутренний ученик',
          joinedAt: new Date()
        });
      }
      
      return res.status(404).json({ error: 'Пользователь не состоит в секте' });
    }
    
    const sectMember = sectMembers[0];
    
    // Формируем ответ
    const rankInfo = {
      userId: userId,
      sectId: sectMember.sect_id,
      sectName: sectMember.sect_name,
      rank: sectMember.rank,
      joinedAt: sectMember.joined_at
    };
    
    res.json(rankInfo);
  } catch (error) {
    console.error('Ошибка при получении ранга пользователя в секте:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Выход из секты
router.post('/api/users/:userId/sect/leave', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Находим членство пользователя в секте
      const sectMembers = await sequelizeDb.query(
        `SELECT * FROM sect_memberships
         WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!sectMembers || sectMembers.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Пользователь не состоит в секте' });
      }
      
      const sectMember = sectMembers[0];
      const sectId = sectMember.sect_id;
      
      // Проверяем, является ли пользователь главой секты
      if (sectMember.rank.toLowerCase() === 'глава') {
        // Проверяем, есть ли другие члены в секте
        const otherMembers = await sequelizeDb.query(
          `SELECT * FROM sect_memberships
           WHERE sect_id = :sectId AND user_id != :userId`,
          {
            replacements: { sectId, userId },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        
        if (otherMembers && otherMembers.length > 0) {
          // Если есть другие члены, то нельзя покинуть секту - сначала нужно назначить нового главу
          await transaction.rollback();
          return res.status(400).json({
            error: 'Нельзя покинуть секту, будучи её главой, когда есть другие члены. Сначала назначьте нового главу.'
          });
        } else {
          // Если глава последний в секте, удаляем и секту, и членство
          await sequelizeDb.query(
            `DELETE FROM sect_benefits WHERE sect_id = :sectId`,
            {
              replacements: { sectId },
              type: Sequelize.QueryTypes.DELETE,
              transaction
            }
          );
          
          await sequelizeDb.query(
            `DELETE FROM sect_memberships WHERE sect_id = :sectId`,
            {
              replacements: { sectId },
              type: Sequelize.QueryTypes.DELETE,
              transaction
            }
          );
          
          await sequelizeDb.query(
            `DELETE FROM sects WHERE id = :sectId`,
            {
              replacements: { sectId },
              type: Sequelize.QueryTypes.DELETE,
              transaction
            }
          );
        }
      } else {
        // Если обычный член - просто удаляем его членство
        await sequelizeDb.query(
          `DELETE FROM sect_memberships WHERE user_id = :userId`,
          {
            replacements: { userId },
            type: Sequelize.QueryTypes.DELETE,
            transaction
          }
        );
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Вы успешно покинули секту',
        wasLeader: sectMember.rank.toLowerCase() === 'глава'
      });
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при выходе из секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});
// Изменение ранга члена секты (только для лидера секты)
router.put('/api/sects/members/:memberId/rank', async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { leaderId, newRank } = req.body;
    
    if (!leaderId || !newRank) {
      return res.status(400).json({ error: 'Не указаны обязательные параметры' });
    }
    
    // Валидация ранга
    // Допустимые ранги: 'ученик', 'внутренний ученик', 'старший ученик', 'старейшина'
    // Исключаем ранг 'глава', так как глава должен быть только один
    const validRanks = ['ученик', 'внутренний ученик', 'старший ученик', 'старейшина'];
    if (!validRanks.includes(newRank)) {
      return res.status(400).json({ error: 'Недопустимый ранг' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Находим данные о лидере
      const leaderData = await sequelizeDb.query(
        `SELECT sm.sect_id, sm."rank" as member_rank
         FROM sect_memberships sm
         WHERE sm.user_id = :leaderId`,
        {
          replacements: { leaderId },
          type: sequelizeDb.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!leaderData || leaderData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Лидер не найден в секте' });
      }
      
      // Проверяем, является ли пользователь главой секты
      if (leaderData[0].member_rank.toLowerCase() !== 'глава') {
        await transaction.rollback();
        return res.status(403).json({ error: 'Только глава секты может изменять ранги' });
      }
      
      const sectId = leaderData[0].sect_id;
      
      // Находим данные о члене секты
      const memberData = await sequelizeDb.query(
        `SELECT sm.*, u.username
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.user_id = :memberId AND sm.sect_id = :sectId`,
        {
          replacements: { memberId, sectId },
          type: sequelizeDb.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!memberData || memberData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Член секты не найден' });
      }
      
      // Проверяем, не пытается ли лидер изменить свой собственный ранг
      if (Number(memberId) === Number(leaderId)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Вы не можете изменить свой собственный ранг' });
      }
      
      // Обновляем ранг члена секты
      await sequelizeDb.query(
        `UPDATE sect_memberships
         SET rank = :newRank
         WHERE user_id = :memberId AND sect_id = :sectId`,
        {
          replacements: { newRank, memberId, sectId },
          type: sequelizeDb.QueryTypes.UPDATE,
          transaction
        }
      );


      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Формируем ответ
      const updatedMember = {
        id: Number(memberId),
        name: memberData[0].username,
        role: newRank,
        sectId: sectId,
        joinedAt: memberData[0].joined_at
      };
      
      res.json({
        success: true,
        message: `Ранг участника изменен на "${newRank}"`,
        member: updatedMember
      });
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при изменении ранга члена секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Исключение члена из секты (только для лидера секты)
router.post('/api/sects/members/:memberId/expel', async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { leaderId } = req.body;
    
    if (!leaderId) {
      return res.status(400).json({ error: 'Не указан ID лидера секты' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Находим данные о лидере
      const leaderData = await sequelizeDb.query(
        `SELECT sm.sect_id, sm."rank" as member_rank
         FROM sect_memberships sm
         WHERE sm.user_id = :leaderId`,
        {
          replacements: { leaderId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!leaderData || leaderData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Лидер не найден в секте' });
      }
      
      // Проверяем, является ли пользователь главой секты
      if (leaderData[0].member_rank.toLowerCase() !== 'глава') {
        await transaction.rollback();
        return res.status(403).json({ error: 'Только глава секты может исключать участников' });
      }
      
      const sectId = leaderData[0].sect_id;
      
      // Находим данные о члене секты
      const memberData = await sequelizeDb.query(
        `SELECT sm.*, u.username
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.user_id = :memberId AND sm.sect_id = :sectId`,
        {
          replacements: { memberId, sectId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!memberData || memberData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Член секты не найден' });
      }
      
      // Проверяем, не пытается ли лидер исключить самого себя
      if (Number(memberId) === Number(leaderId)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Вы не можете исключить самого себя из секты' });
      }
      
      // Сохраняем имя исключаемого участника для ответа
      const memberName = memberData[0].username;
      
      // Удаляем членство в секте
      await sequelizeDb.query(
        `DELETE FROM sect_memberships
         WHERE user_id = :memberId AND sect_id = :sectId`,
        {
          replacements: { memberId, sectId },
          type: sequelizeDb.QueryTypes.DELETE,
          transaction
        }
      );
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Участник ${memberName} исключен из секты`,
        memberId: Number(memberId),
        memberName: memberName
      });
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при исключении члена из секты:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

// Передача лидерства в секте
router.post('/api/sects/transfer-leadership', async (req, res) => {
  try {
    const { currentLeaderId, newLeaderId } = req.body;
    
    if (!currentLeaderId || !newLeaderId) {
      return res.status(400).json({ error: 'Не указаны обязательные параметры' });
    }
    
    // Получаем экземпляр sequelize перед использованием
    const sequelizeDb = await getSequelizeInstance();
    
    // Начинаем транзакцию
    const transaction = await sequelizeDb.transaction();
    
    try {
      // Проверяем, что текущий пользователь действительно является главой секты
      const leaderData = await sequelizeDb.query(
        `SELECT sm.sect_id, sm."rank" as member_rank
         FROM sect_memberships sm
         WHERE sm.user_id = :currentLeaderId`,
        {
          replacements: { currentLeaderId },
          type: sequelizeDb.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!leaderData || leaderData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Лидер не найден в секте' });
      }
      
      if (leaderData[0].member_rank.toLowerCase() !== 'глава') {
        await transaction.rollback();
        return res.status(403).json({ error: 'Только глава секты может передать лидерство' });
      }
      
      const sectId = leaderData[0].sect_id;
      
      // Проверяем, что новый лидер является членом той же секты
      const newLeaderData = await sequelizeDb.query(
        `SELECT sm.*, u.username
         FROM sect_memberships sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.user_id = :newLeaderId AND sm.sect_id = :sectId`,
        {
          replacements: { newLeaderId, sectId },
          type: sequelizeDb.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!newLeaderData || newLeaderData.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Новый лидер не найден в секте' });
      }
      
      // Изменяем ранг текущего лидера на "старейшина"
      await sequelizeDb.query(
        `UPDATE sect_memberships
         SET rank = 'старейшина'
         WHERE user_id = :currentLeaderId AND sect_id = :sectId`,
        {
          replacements: { currentLeaderId, sectId },
          type: sequelizeDb.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Изменяем ранг нового лидера на "глава"
      await sequelizeDb.query(
        `UPDATE sect_memberships
         SET rank = 'глава'
         WHERE user_id = :newLeaderId AND sect_id = :sectId`,
        {
          replacements: { newLeaderId, sectId },
          type: sequelizeDb.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      return res.json({
        success: true,
        message: `${newLeaderData[0].username} теперь глава секты`,
        oldLeaderId: Number(currentLeaderId),
        newLeaderId: Number(newLeaderId)
      });
      
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при передаче лидерства в секте:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
});

module.exports = router;