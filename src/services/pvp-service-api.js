/**
 * PvP Service API - клиентский API для взаимодействия с PvP-системой
 * Обеспечивает вызов серверных API-эндпоинтов из React-компонентов
 */
import { apiRequest } from './api'; 

/**
 * Получение списка доступных режимов PvP
 * @returns {Promise<Object>} - Ответ сервера с режимами PvP
 */
export const getPvPModes = async () => {
    try {
        console.log('[PvP API] Запрашиваем режимы PvP');
        const response = await apiRequest('GET', '/api/pvp/modes');
        
        // Дополнительное логирование для отладки
        console.log('[PvP API] Получен ответ от сервера:', response);
        
        // Проверка структуры ответа
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return { success: false, message: 'Получен пустой ответ от сервера', modes: [] };
        }
        
        // Если ответ не содержит поле success или modes, добавляем их
        if (response.success === undefined) {
            // Если есть поле modes или ответ - это массив, считаем успехом
            if (Array.isArray(response)) {
                console.log('[PvP API] Получен массив режимов без обертки');
                return { success: true, modes: response };
            } else if (response.modes) {
                console.log('[PvP API] Получен объект с полем modes без поля success');
                return { success: true, modes: response.modes };
            } else {
                console.error('[PvP API] Неизвестный формат ответа:', response);
                return {
                    success: false,
                    message: 'Неизвестный формат ответа',
                    modes: []
                };
            }
        }
        
        // Если success: false, но нет сообщения об ошибке
        if (response.success === false && !response.message) {
            response.message = 'Произошла неизвестная ошибка при получении режимов PvP';
        }
        
        // Если success: true, но нет массива modes
        if (response.success === true && !response.modes) {
            response.modes = [];
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении режимов PvP:', error);
        return {
            success: false,
            message: `Ошибка при получении режимов PvP: ${error.message}`,
            modes: []
        };
    }
};

/**
 * Получение списка комнат
 * @param {string} status - Статус комнат для фильтрации (waiting, in_progress, completed)
 * @param {number} modeId - ID режима для фильтрации
 * @returns {Promise<Object>} - Ответ сервера со списком комнат
 */
export const getRooms = async (status = 'waiting', modeId = null) => {
    try {
        let url = `/api/pvp/rooms?status=${status}`;
        if (modeId) {
            url += `&modeId=${modeId}`;
        }
        const response = await apiRequest('GET', url);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении списка комнат',
                details: 'Получен пустой ответ от сервера',
                rooms: []
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении списка комнат:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении списка комнат',
            details: errorDetails,
            rooms: []
        };
    }
};

/**
 * Создание новой комнаты
 * @param {string} name - Название комнаты
 * @param {number} modeId - ID режима
 * @param {number} minLevel - Минимальный уровень культивации
 * @param {number} maxLevel - Максимальный уровень культивации
 * @returns {Promise<Object>} - Ответ сервера с созданной комнатой
 */
export const createRoom = async (name, modeId, minLevel, maxLevel) => {
    try {
        console.log('[PvP API] Создание комнаты:', { name, modeId, minLevel, maxLevel });
        const response = await apiRequest('POST', '/api/pvp/rooms', {
            name,
            modeId,
            minLevel,
            maxLevel
        });
        
        // Проверяем ответ
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                error: 'Получен пустой ответ от сервера'
            };
        }
        
        // Если ответ не содержит поле success, добавляем его
        if (response.success === undefined) {
            if (response.room || response.id) {
                return { success: true, room: response.room || response };
            } else {
                return {
                    success: false,
                    error: response.error || response.message || 'Неизвестная ошибка при создании комнаты'
                };
            }
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при создании комнаты:', error);
        
        // Извлекаем сообщение об ошибке и детали
        let errorMessage = 'Ошибка при создании комнаты';
        let errorDetails = '';
        
        if (error.response && error.response.data) {
            // Если есть ответ от сервера с данными
            errorMessage = error.response.data.message || 'Ошибка при создании комнаты';
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            // Если есть сообщение об ошибке
            errorDetails = error.message;
        }
        
        return {
            success: false,
            error: errorMessage,
            details: errorDetails
        };
    }
};

/**
 * Получение детальной информации о комнате
 * @param {number} roomId - ID комнаты
 * @returns {Promise<Object>} - Ответ сервера с детальной информацией о комнате
 */
export const getRoomDetails = async (roomId) => {
    try {
        console.log('[PvP API] Запрашиваем детали комнаты:', roomId);
        const response = await apiRequest('GET', `/api/pvp/rooms/${roomId}`);
        
        console.log('[PvP API] Получен ответ от сервера:', response);
        
        // Если ответ пустой или undefined
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении деталей комнаты',
                details: 'Получен пустой ответ от сервера',
                room: {},
                participants: [],
                teams: { '1': [], '2': [] },
                actions: []
            };
        }
        
        // Если получен ответ с success: false
        if (response.success === false) {
            return {
                ...response,
                room: response.room || {},
                participants: response.participants || [],
                teams: response.teams || { '1': [], '2': [] },
                actions: response.actions || []
            };
        }
        
        // Нормализация структуры ответа - обработка возможной вложенности
        if (response.room && response.room.room) {
            console.log('[PvP API] Обнаружена двойная вложенность, нормализуем структуру');
            
            // Извлекаем данные из вложенной структуры
            const { room: roomData, participants, teams, actions } = response.room;
            
            // Возвращаем нормализованную структуру
            return {
                success: true,
                room: {
                    ...roomData,
                    mode_name: roomData.mode_name || 'Неизвестный режим'
                },
                participants: participants || [],
                teams: teams || { '1': [], '2': [] },
                actions: actions || []
            };
        }
        
        // Нормализация структуры - гарантируем наличие всех полей
        return {
            ...response,
            room: response.room || {},
            participants: response.participants || [],
            teams: response.teams || { '1': [], '2': [] },
            actions: response.actions || []
        };
    } catch (error) {
        console.error('[PvP API] Ошибка при получении деталей комнаты:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении деталей комнаты',
            details: errorDetails,
            room: {},
            participants: [],
            teams: { '1': [], '2': [] },
            actions: []
        };
    }
};

/**
 * Присоединение к комнате
 * @param {number} roomId - ID комнаты
 * @param {number} team - Номер команды (1 или 2)
 * @param {number} position - Позиция в команде
 * @returns {Promise<Object>} - Ответ сервера с результатом присоединения
 */
export const joinRoom = async (roomId, team, position) => {
    try {
        console.log(`[PvP API] Присоединение к комнате ${roomId}, команда ${team}, позиция ${position}`);
        
        const response = await apiRequest('POST', `/api/pvp/rooms/${roomId}/join`, {
            team,
            position
        });
        
        console.log('[PvP API] Ответ от сервера на присоединение:', response);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при присоединении к комнате',
                details: 'Получен пустой ответ от сервера',
                errorCode: 'EMPTY_RESPONSE'
            };
        }
        
        // Нормализуем ответ, обеспечивая наличие сообщения в случае ошибки
        if (response.success === false && !response.message) {
            response.message = 'Не удалось присоединиться к комнате';
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при присоединении к комнате:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.message || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с сохранением оригинального сообщения об ошибке
        return {
            success: false,
            message: 'Ошибка при присоединении к комнате',
            details: errorDetails,
            errorCode: error.code || 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Выход из комнаты
 * @param {number} roomId - ID комнаты
 * @returns {Promise<Object>} - Ответ сервера с результатом операции
 */
export const leaveRoom = async (roomId) => {
    try {
        console.log(`[PvP API] Выход из комнаты ${roomId}`);
        
        const response = await apiRequest('POST', `/api/pvp/rooms/${roomId}/leave`);
        
        console.log('[PvP API] Ответ от сервера на выход из комнаты:', response);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при выходе из комнаты',
                details: 'Получен пустой ответ от сервера',
                errorCode: 'EMPTY_RESPONSE'
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при выходе из комнаты:', error);
        
        // Возвращаем структурированный ответ с сохранением оригинального сообщения об ошибке
        return {
            success: false,
            message: 'Ошибка при выходе из комнаты',
            details: error.message || 'Неизвестная ошибка',
            errorCode: error.code || 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Роспуск комнаты
 * @param {number} roomId - ID комнаты
 * @returns {Promise<Object>} - Ответ сервера с результатом операции
 */
export const dismissRoom = async (roomId) => {
    try {
        console.log(`[PvP API] Роспуск комнаты ${roomId}`);
        
        const response = await apiRequest('POST', `/api/pvp/rooms/${roomId}/dismiss`);
        
        console.log('[PvP API] Ответ от сервера на роспуск комнаты:', response);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при роспуске комнаты',
                details: 'Получен пустой ответ от сервера',
                errorCode: 'EMPTY_RESPONSE'
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при роспуске комнаты:', error);
        
        // Возвращаем структурированный ответ с сохранением оригинального сообщения об ошибке
        return {
            success: false,
            message: 'Ошибка при роспуске комнаты',
            details: error.message || 'Неизвестная ошибка',
            errorCode: error.code || 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Выполнение действия в бою
 * @param {number} roomId - ID комнаты
 * @param {string} actionType - Тип действия (attack, defend, technique)
 * @param {number} targetId - ID цели (участника)
 * @param {string} techniqueId - ID техники (если используется)
 * @returns {Promise<Object>} - Ответ сервера с результатом действия
 */
export const performAction = async (roomId, actionType, targetId, techniqueId) => {
    try {
        const response = await apiRequest('POST', `/api/pvp/rooms/${roomId}/action`, {
            actionType,
            targetId,
            techniqueId
        });
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при выполнении действия',
                details: 'Получен пустой ответ от сервера',
                errorCode: 'EMPTY_RESPONSE'
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при выполнении действия:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при выполнении действия',
            details: errorDetails,
            errorCode: error.code || 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Получение обновленного состояния комнаты
 * @param {number} roomId - ID комнаты
 * @param {number} lastActionId - ID последнего известного действия
 * @returns {Promise<Object>} - Ответ сервера с обновленным состоянием комнаты
 */
export const getRoomState = async (roomId, lastActionId = 0) => {
    try {
        console.log(`[PvP API DEBUG] 🔄 Запрос getRoomState для комнаты ${roomId}, lastActionId: ${lastActionId}`);
        
        // userId автоматически передается через authToken в apiRequest
        const response = await apiRequest('GET', `/api/pvp/rooms/${roomId}/state?lastActionId=${lastActionId}`);
        
        console.log(`[PvP API DEBUG] 📥 Полный ответ getRoomState:`, JSON.stringify(response, null, 2));
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API DEBUG] ❌ Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении состояния комнаты',
                details: 'Получен пустой ответ от сервера',
                actions: [],
                state: {}
            };
        }
        
        // Детальное логирование ключевых полей
        if (response.room) {
            console.log(`[PvP API DEBUG] 🏠 Статус комнаты: "${response.room.status}"`);
            console.log(`[PvP API DEBUG] 🏆 Команда-победитель: ${response.room.winner_team || 'не определена'}`);
            console.log(`[PvP API DEBUG] 👥 Участники:`, response.participants?.length || 0);
        }
        
        if (response.rewards) {
            console.log(`[PvP API DEBUG] 🎁 Награды найдены:`, response.rewards);
            Object.keys(response.rewards).forEach(playerId => {
                console.log(`[PvP API DEBUG] 🎁 Награды для игрока ${playerId}:`, response.rewards[playerId]);
            });
        } else {
            console.log(`[PvP API DEBUG] ❌ Награды отсутствуют в ответе`);
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении состояния комнаты:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении состояния комнаты',
            details: errorDetails,
            actions: [],
            state: {}
        };
    }
};

/**
 * Получение таблицы лидеров
 * @param {number} modeId - ID режима
 * @param {string} season - Сезон (current, previous, etc.)
 * @param {number} limit - Лимит записей
 * @param {number} offset - Смещение для пагинации
 * @returns {Promise<Object>} - Ответ сервера с таблицей лидеров
 */
export const getLeaderboard = async (modeId, season = 'current', limit = 100, offset = 0) => {
    try {
        const response = await apiRequest('GET', `/api/pvp/leaderboard?modeId=${modeId}&season=${season}&limit=${limit}&offset=${offset}`);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении таблицы лидеров',
                details: 'Получен пустой ответ от сервера',
                leaderboard: []
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении таблицы лидеров:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении таблицы лидеров',
            details: errorDetails,
            leaderboard: []
        };
    }
};

/**
 * Получение рейтингов пользователя
 * @param {number} userId - ID пользователя
 * @param {number} modeId - ID режима (опционально)
 * @param {string} season - Сезон (опционально)
 * @returns {Promise<Object>} - Ответ сервера с рейтингами пользователя
 */
export const getUserRatings = async (userId, modeId = null, season = 'current') => {
    try {
        let url = `/api/pvp/ratings/${userId}?season=${season}`;
        if (modeId) {
            url += `&modeId=${modeId}`;
        }
        const response = await apiRequest('GET', url);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении рейтингов пользователя',
                details: 'Получен пустой ответ от сервера',
                ratings: []
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении рейтингов пользователя:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении рейтингов пользователя',
            details: errorDetails,
            ratings: []
        };
    }
};

/**
 * Получение истории боев пользователя
 * @param {number} userId - ID пользователя
 * @param {number} limit - Лимит записей
 * @param {number} offset - Смещение для пагинации
 * @returns {Promise<Object>} - Ответ сервера с историей боев
 */
export const getUserBattleHistory = async (userId, limit = 10, offset = 0) => {
    try {
        const response = await apiRequest('GET', `/api/pvp/history/${userId}?limit=${limit}&offset=${offset}`);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении истории боев',
                details: 'Получен пустой ответ от сервера',
                history: []
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении истории боев:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении истории боев',
            details: errorDetails,
            history: []
        };
    }
};

/**
 * Получение текущего статуса пользователя в PvP
 * @returns {Promise<Object>} - Ответ сервера с информацией о текущем статусе пользователя
 */
export const getUserPvPStatus = async () => {
    try {
        console.log('[PvP API] Запрашиваем текущий статус пользователя в PvP');
        const response = await apiRequest('GET', '/api/pvp/user-status');
        
        console.log('[PvP API] Получен ответ о статусе пользователя:', response);
        
        if (!response) {
            return {
                success: false,
                inRoom: false,
                message: 'Ошибка при получении статуса пользователя',
                details: 'Получен пустой ответ от сервера'
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении статуса пользователя:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        return {
            success: false,
            inRoom: false,
            message: 'Ошибка при получении статуса пользователя',
            details: errorDetails
        };
    }
};

/**
 * Получение доступных наград
 * @param {string} season - Сезон
 * @param {number} minRating - Минимальный рейтинг
 * @param {number} maxRating - Максимальный рейтинг
 * @returns {Promise<Object>} - Ответ сервера с доступными наградами
 */
export const getAvailableRewards = async (season = 'current', minRating = null, maxRating = null) => {
    try {
        let url = `/api/pvp/rewards?season=${season}`;
        if (minRating !== null) {
            url += `&minRating=${minRating}`;
        }
        if (maxRating !== null) {
            url += `&maxRating=${maxRating}`;
        }
        const response = await apiRequest('GET', url);
        
        // Если response пустой или не содержит поле success
        if (!response) {
            console.error('[PvP API] Получен пустой ответ от сервера');
            return {
                success: false,
                message: 'Ошибка при получении доступных наград',
                details: 'Получен пустой ответ от сервера',
                rewards: []
            };
        }
        
        return response;
    } catch (error) {
        console.error('[PvP API] Ошибка при получении доступных наград:', error);
        
        // Извлекаем детали ошибки
        let errorDetails = '';
        if (error.response && error.response.data) {
            errorDetails = error.response.data.details || error.response.data.error || error.message;
        } else if (error.message) {
            errorDetails = error.message;
        }
        
        // Возвращаем структурированный ответ с ошибкой вместо исключения
        return {
            success: false,
            message: 'Ошибка при получении доступных наград',
            details: errorDetails,
            rewards: []
        };
    }
};