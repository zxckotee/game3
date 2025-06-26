/**
 * PvP API Routes - маршруты API для PvP-системы
 * Обеспечивает обработку HTTP-запросов для функциональности PvP
 */
const express = require('express');
const router = express.Router();
const PvPService = require('../../services/pvp-service');
const { validateAuth } = require('../middleware/auth-middleware');

/**
 * @route GET /api/pvp/modes
 * @desc Получение списка доступных режимов PvP
 * @access Public
 */
router.get('/modes', async (req, res) => {
    try {
        const modes = await PvPService.getModes();
        res.json({ success: true, modes });
    } catch (error) {
        console.error('Ошибка при получении режимов PvP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка при получении режимов PvP', 
            error: error.message 
        });
    }
});

/**
 * @route POST /api/pvp/rooms
 * @desc Создание новой комнаты
 * @access Private
 */
router.post('/rooms', validateAuth, async (req, res) => {
    try {
        const { name, modeId, minLevel, maxLevel } = req.body;
        const userId = req.user.id;
        
        if (!name || !modeId || minLevel === undefined || maxLevel === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Необходимо указать название комнаты, режим и диапазон уровней' 
            });
        }
        
        const room = await PvPService.createRoom(userId, name, modeId, minLevel, maxLevel);
        res.status(201).json({ success: true, room });
    } catch (error) {
        console.error('Ошибка при создании комнаты:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Ошибка при создании комнаты', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/rooms
 * @desc Получение списка комнат
 * @access Public
 */
router.get('/rooms', async (req, res) => {
    try {
        const { status, modeId } = req.query;
        const rooms = await PvPService.getRooms(status, modeId);
        res.json({ success: true, rooms });
    } catch (error) {
        console.error('Ошибка при получении списка комнат:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка при получении списка комнат', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/rooms/:roomId
 * @desc Получение детальной информации о комнате
 * @access Public
 */
router.get('/rooms/:roomId', async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (isNaN(roomId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Некорректный ID комнаты' 
            });
        }
        
        const room = await PvPService.getRoomDetails(roomId);
        res.json({ success: true, room });
    } catch (error) {
        console.error('Ошибка при получении деталей комнаты:', error);
        res.status(404).json({ 
            success: false, 
            message: 'Ошибка при получении деталей комнаты', 
            error: error.message 
        });
    }
});

/**
 * @route POST /api/pvp/rooms/:roomId/join
 * @desc Присоединение к комнате
 * @access Private
 */
router.post('/rooms/:roomId/join', validateAuth, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (isNaN(roomId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Некорректный ID комнаты' 
            });
        }
        
        const { team, position } = req.body;
        if (team === undefined || position === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Необходимо указать команду и позицию' 
            });
        }
        
        const userId = req.user.id;
        
        const result = await PvPService.joinRoom(userId, roomId, team, position);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Ошибка при присоединении к комнате:', error);
        
        // Определяем тип ошибки по сообщению
        let errorCode = 'JOIN_ERROR';
        let statusCode = 400;
        
        // Проверяем типичные ошибки и классифицируем их
        if (error.message.includes('уже присоединились')) {
            errorCode = 'ALREADY_JOINED';
        } else if (error.message.includes('позиция занята')) {
            errorCode = 'POSITION_TAKEN';
        } else if (error.message.includes('уровень культивации')) {
            errorCode = 'LEVEL_REQUIREMENT';
        } else if (error.message.includes('не найден')) {
            errorCode = 'NOT_FOUND';
            statusCode = 404;
        }
        
        // Возвращаем структурированный ответ с подробностями
        res.status(statusCode).json({
            success: false,
            message: 'Ошибка при присоединении к комнате',
            details: error.message,
            code: errorCode
        });
    }
});

/**
 * @route POST /api/pvp/rooms/:roomId/action
 * @desc Выполнение действия в бою
 * @access Private
 */
router.post('/rooms/:roomId/action', validateAuth, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (isNaN(roomId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Некорректный ID комнаты' 
            });
        }
        
        const { actionType, targetId, techniqueId } = req.body;
        if (!actionType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Необходимо указать тип действия' 
            });
        }
        
        const userId = req.user.id;
        
        const result = await PvPService.performAction(userId, roomId, actionType, targetId, techniqueId);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Ошибка при выполнении действия:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Ошибка при выполнении действия', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/rooms/:roomId/state
 * @desc Получение обновлений состояния комнаты
 * @access Public
 */
router.get('/rooms/:roomId/state', validateAuth, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный ID комнаты'
            });
        }
        
        const lastActionId = parseInt(req.query.lastActionId) || 0;
        const userId = req.user.id;
        
        // Передаем userId в метод getRoomState для обновления характеристик
        const state = await PvPService.getRoomState(roomId, userId, lastActionId);
        res.json({ success: true, ...state });
    } catch (error) {
        console.error('Ошибка при получении состояния комнаты:', error);
        res.status(404).json({ 
            success: false, 
            message: 'Ошибка при получении состояния комнаты', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/ratings/:userId
 * @desc Получение рейтинга игрока
 * @access Public
 */
router.get('/ratings/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Некорректный ID пользователя' 
            });
        }
        
        const { modeId, season } = req.query;
        
        const ratings = await PvPService.getUserRatings(userId, modeId, season);
        res.json({ success: true, ratings });
    } catch (error) {
        console.error('Ошибка при получении рейтингов пользователя:', error);
        res.status(404).json({ 
            success: false, 
            message: 'Ошибка при получении рейтингов пользователя', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/leaderboard
 * @desc Получение таблицы лидеров
 * @access Public
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const { modeId, season, limit = 100, offset = 0 } = req.query;
        
        if (!modeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Необходимо указать ID режима' 
            });
        }
        
        const leaderboard = await PvPService.getLeaderboard(
            modeId, 
            season, 
            parseInt(limit), 
            parseInt(offset)
        );
        
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Ошибка при получении таблицы лидеров:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка при получении таблицы лидеров', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/history/:userId
 * @desc Получение истории боев игрока
 * @access Public
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Некорректный ID пользователя' 
            });
        }
        
        const { limit = 10, offset = 0 } = req.query;
        
        const history = await PvPService.getUserBattleHistory(
            userId, 
            parseInt(limit), 
            parseInt(offset)
        );
        
        res.json({ success: true, history });
    } catch (error) {
        console.error('Ошибка при получении истории боев:', error);
        res.status(404).json({ 
            success: false, 
            message: 'Ошибка при получении истории боев', 
            error: error.message 
        });
    }
});

/**
 * @route GET /api/pvp/rewards
 * @desc Получение доступных наград
 * @access Public
 */
router.get('/rewards', async (req, res) => {
    try {
        const { season, minRating, maxRating } = req.query;
        
        const rewards = await PvPService.getAvailableRewards(
            season, 
            minRating ? parseInt(minRating) : undefined, 
            maxRating ? parseInt(maxRating) : undefined
        );
        
        res.json({ success: true, rewards });
    } catch (error) {
        console.error('Ошибка при получении доступных наград:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка при получении доступных наград', 
            error: error.message 
        });
    }
});

/**
 * @route POST /api/pvp/rooms/:roomId/leave
 * @desc Выход из комнаты
 * @access Private
 */
router.post('/rooms/:roomId/leave', validateAuth, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный ID комнаты',
                details: 'ID комнаты должен быть числовым значением'
            });
        }
        
        const userId = req.user.id;
        
        // Используем метод PvPService для выхода из комнаты
        const result = await PvPService.leaveRoom(userId, roomId);
        
        res.json(result);
    } catch (error) {
        console.error('Ошибка при выходе из комнаты:', error);
        
        // Определяем тип ошибки по сообщению
        let errorCode = 'LEAVE_ERROR';
        let statusCode = 400;
        
        // Проверяем типичные ошибки и классифицируем их
        if (error.message.includes('не являетесь участником')) {
            errorCode = 'NOT_PARTICIPANT';
        } else if (error.message.includes('не найдена')) {
            errorCode = 'ROOM_NOT_FOUND';
            statusCode = 404;
        }
        
        res.status(statusCode).json({
            success: false,
            message: 'Ошибка при выходе из комнаты',
            details: error.message,
            code: errorCode
        });
    }
});

/**
 * @route GET /api/pvp/user-status
 * @desc Получение текущего статуса пользователя в PvP (активные комнаты или бои)
 * @access Private
 */
router.get('/user-status', validateAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Ищем активное участие пользователя в комнатах
        const status = await PvPService.getUserPvPStatus(userId);
        
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('Ошибка при получении статуса пользователя в PvP:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении статуса пользователя в PvP',
            error: error.message
        });
    }
});

module.exports = router;