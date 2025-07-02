/**
 * Маршруты API для управления социальными отношениями
 */
const express = require('express');
const router = express.Router();
const { validateAuth } = require('../middleware/auth-middleware');
const CharacterProfileService = require('../../services/character-profile-service');

/**
 * @route   POST /api/relationships/event
 * @desc    Добавление нового события к отношениям с NPC
 * @access  Private
 */
router.post('/event', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { relationshipId, eventText } = req.body;

    if (!relationshipId || !eventText) {
      return res.status(400).json({ success: false, message: 'Необходимо указать relationshipId и eventText' });
    }

    const updatedRelationship = await CharacterProfileService.addRelationshipEvent(userId, relationshipId, eventText);

    res.json({ success: true, relationship: updatedRelationship });
  } catch (error) {
    console.error('Ошибка в маршруте добавления события отношений:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера', error: error.message });
  }
});
/**
 * @route   POST /api/relationships/interact
 * @desc    Обработка взаимодействия с NPC для изменения отношений
 * @access  Private
 */
router.post('/interact', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { characterId, interactionType } = req.body;

    if (!characterId || !interactionType) {
      return res.status(400).json({ success: false, message: 'Необходимо указать characterId и interactionType' });
    }

    const result = await CharacterProfileService.handleInteraction(userId, characterId, interactionType);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Ошибка в маршруте взаимодействия с NPC:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера', error: error.message });
  }
});

module.exports = router;