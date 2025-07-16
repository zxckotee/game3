const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateAuth, validateAdmin } = require('../middleware/auth-middleware');
const CharacterProfileService = require('../../services/character-profile-service');

// Настройка multer для загрузки аватарок
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../public/assets/images/avatars');
    
    // Создаем директорию если она не существует
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла: userId_timestamp.ext
    const userId = req.params.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});

// Фильтр для проверки типов файлов
const fileFilter = (req, file, cb) => {
  // Разрешенные типы файлов
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены только JPG, PNG и WebP изображения.'), false);
  }
};

// Настройка multer с ограничениями
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB максимум
  }
});

// API маршруты для работы с профилем персонажа
router.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Используем сервис для получения профиля персонажа
    const profile = await CharacterProfileService.getCharacterProfile(userId);
    
    if (!profile) {2
      console.log(`Профиль персонажа для пользователя ${userId} не найден`);
      return res.status(404).json({ error: 'Профиль персонажа не найден' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Ошибка при получении профиля персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновление профиля персонажа
router.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    const data = req.body;
    
    console.log(`Обновление профиля персонажа для пользователя ${userId}`);
    
    // Используем сервис для обновления профиля персонажа
    const updatedProfile = await CharacterProfileService.updateCharacterProfile(userId, data);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Ошибка при обновлении профиля персонажа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Загрузка аватарки персонажа
router.post('/api/users/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Файл аватарки не был загружен' });
    }
    
    // Формируем путь к файлу относительно public
    const avatarPath = `assets/images/avatars/${req.file.filename}`;
    
    console.log(`Загрузка аватарки для пользователя ${userId}: ${avatarPath}`);
    
    // Обновляем профиль персонажа с новой аватаркой
    const updatedProfile = await CharacterProfileService.updateAvatar(userId, avatarPath);
    
    res.json({
      success: true,
      message: 'Аватарка успешно загружена',
      avatar: avatarPath,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Ошибка при загрузке аватарки:', error);
    
    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Ошибка при удалении файла:', unlinkError);
      }
    }
    
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
});

// Получение аватарки персонажа (УСТАРЕЛО - аватарка теперь приходит с профилем)
// Оставлено для совместимости, но рекомендуется использовать /api/users/:userId/profile
router.get('/api/users/:userId/avatar', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    console.log(`[УСТАРЕЛО] Запрос аватарки для пользователя ${userId} - используйте /api/users/:userId/profile`);
    
    // Получаем путь к аватарке из профиля
    const avatarPath = await CharacterProfileService.getAvatar(userId);
    
    if (!avatarPath) {
      return res.status(404).json({
        error: 'Аватарка не найдена',
        avatar: null
      });
    }
    
    res.json({
      success: true,
      avatar: avatarPath
    });
  } catch (error) {
    console.error('Ошибка при получении аватарки:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
});

// Новый API роут для действий с NPC
router.post('/api/relationships/interact', validateAuth, async (req, res) => {
  try {
    const { characterId, interactionType } = req.body;
    
    // Получаем userId из аутентифицированного пользователя
    const userId = req.user.id;
    
    console.log(`Взаимодействие с NPC: userId=${userId}, characterId=${characterId}, type=${interactionType}`);
    
    // Валидация входных данных
    if (!characterId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Не указан ID персонажа или тип взаимодействия'
      });
    }
    
    // Проверяем допустимые типы взаимодействий
    const allowedTypes = ['chat', 'gift', 'train', 'quest'];
    if (!allowedTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: `Недопустимый тип взаимодействия. Разрешены: ${allowedTypes.join(', ')}`
      });
    }
    
    // Вызываем обновленный метод handleInteraction
    const result = await CharacterProfileService.handleInteraction(userId, characterId, interactionType);
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка при обработке взаимодействия с NPC:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Внутренняя ошибка сервера'
    });
  }
});

module.exports = router;