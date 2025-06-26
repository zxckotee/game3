# План исправления системы эффектов в PvP

## Проблема

В файле `src/services/pvp-service.js` обнаружены множественные синтаксические ошибки, которые препятствуют корректной работе системы эффектов в PvP-боях. Основные ошибки возникают в следующих методах:
- `getRoomDetails`
- `joinRoom`
- `performAction`
- `dismissRoom`
- и других методах класса

Эти ошибки, скорее всего, вызваны нарушением структуры класса и неправильным форматированием кода, особенно в методе `getRoomDetails`.

## Решение

### 1. Переписать метод `getRoomDetails`

Необходимо полностью переписать метод `getRoomDetails`, сохранив всю его функциональность, но исправив структуру. Вот как должен выглядеть правильный метод:

```javascript
/**
 * Получение детальной информации о комнате
 * @param {number} roomId - ID комнаты
 * @returns {Promise<Object>} Данные комнаты и участников
 */
static async getRoomDetails(roomId) {
  try {
    // Инициализируем реестр моделей
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const PvPRoom = modelRegistry.getModel('PvPRoom');
    const PvPParticipant = modelRegistry.getModel('PvPParticipant');
    const PvPAction = modelRegistry.getModel('PvPAction');
    const User = modelRegistry.getModel('User');
    const PvPMode = modelRegistry.getModel('PvPMode');
    
    // Получаем данные комнаты с ассоциациями
    const room = await PvPRoom.findByPk(roomId, {
      include: [
        {
          model: PvPMode,
          as: 'pvpMode',
          attributes: ['id', 'name', 'player_count', 'team_size'] // Добавляем виртуальное поле team_size
        },
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!room) {
      throw new Error('Комната не найдена');
    }
    
    // Преобразуем данные комнаты
    const roomData = {
      id: room.id,
      name: room.name,
      status: room.status,
      min_level: room.min_level,
      max_level: room.max_level,
      leader_id: room.leader_id,
      leader_name: room.leader ? room.leader.username : 'Unknown',
      mode_name: room.pvpMode ? room.pvpMode.name : 'Unknown',
      player_count: room.pvpMode ? room.pvpMode.player_count : 0,
      winner_team: room.winner_team,
      start_time: room.start_time,
      end_time: room.end_time,
      created_at: room.created_at
    };
    
    // Получаем участников комнаты
    const participants = await PvPParticipant.findAll({
      where: { room_id: roomId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['team', 'ASC'], ['position', 'ASC']]
    });
    
    // Обработка эффектов и расчет модификаторов для каждого участника
    for (const participant of participants) {
      // Проверяем наличие истекших временных эффектов
      if (participant.effects && participant.effects.length > 0) {
        const now = Date.now();
        
        // Отфильтровываем истекшие эффекты, основанные на реальном времени
        participant.effects = participant.effects.filter(effect => {
          // Пропускаем эффекты без durationMs (основанные на ходах)
          if (!effect.durationMs) return true;
          
          const startTime = effect.startTime || new Date(effect.appliedAt).getTime();
          return (now - startTime) < effect.durationMs;
        });
        
        // Для эффектов на основе ходов добавляем информацию о оставшейся длительности
        participant.effects = participant.effects.map(effect => {
          if (!effect.duration) return effect;
          
          const remaining = effect.duration - (effect.elapsedTurns || 0);
          return {
            ...effect,
            remainingTurns: remaining,
            isExpiring: remaining <= 2
          };
        });
      }
      
      // Рассчитываем модификаторы от эффектов
      participant.statsModifiers = PvPService.getEffectModifiers(participant);
      
      // Рассчитываем индивидуальный кулдаун с учетом эффектов скорости
      participant.action_cooldown = PvPService.calculateActionCooldown(participant);
      
      // Если у участника есть время последнего действия, рассчитываем оставшееся время до следующего
      if (participant.last_action_time) {
        const now = new Date();
        const lastAction = new Date(participant.last_action_time);
        const elapsedMs = now - lastAction;
        const cooldown = participant.action_cooldown || 5000;
        participant.cooldown_remaining_ms = Math.max(0, cooldown - elapsedMs);
        participant.can_act = elapsedMs >= cooldown;
      } else {
        participant.cooldown_remaining_ms = 0;
        participant.can_act = true;
      }
      
      // Обновляем участника с сохранением эффектов
      await participant.update({
        effects: participant.effects
      });
      
      // Обработка перезарядки
      if (participant.cooldowns) {
        const currentTime = new Date();
        const updatedCooldowns = {};
        let cooldownsChanged = false;
        
        // Проверяем каждую технику в перезарядке
        for (const [techniqueId, cooldownEndTimeStr] of Object.entries(participant.cooldowns)) {
          const cooldownEndTime = new Date(cooldownEndTimeStr);
          
          // Если перезарядка еще не закончилась, сохраняем ее
          if (currentTime < cooldownEndTime) {
            updatedCooldowns[techniqueId] = cooldownEndTimeStr;
          } else {
            cooldownsChanged = true;
          }
        }
        
        // Если были изменения в перезарядке, обновляем запись
        if (cooldownsChanged) {
          await participant.update({
            cooldowns: updatedCooldowns
          });
        }
      }
    }
    
    // Преобразуем данные участников
    const participantsData = participants.map(p => ({
      id: p.id,
      user_id: p.user_id,
      team: p.team,
      position: p.position,
      status: p.status,
      current_hp: p.current_hp,
      max_hp: p.max_hp,
      current_energy: p.current_energy,
      max_energy: p.max_energy,
      level: p.level,
      username: p.user ? p.user.username : 'Unknown',
      effects: p.effects || [],
      cooldowns: p.cooldowns || {}
    }));
    
    // Группируем участников по командам
    const teams = {
      1: [],
      2: []
    };
    
    participantsData.forEach(p => {
      if (teams[p.team]) {
        teams[p.team].push(p);
      }
    });
    
    // Получаем историю действий
    const actions = await PvPAction.findAll({
      where: { room_id: roomId },
      include: [
        {
          model: PvPParticipant,
          as: 'actor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username']
            }
          ]
        },
        {
          model: PvPParticipant,
          as: 'target',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username']
            }
          ]
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 20
    });
    
    // Преобразуем данные действий
    const actionsData = actions.map(a => ({
      id: a.id,
      participant_id: a.participant_id,
      action_type: a.action_type,
      target_id: a.target_id,
      technique_id: a.technique_id,
      damage: a.damage,
      healing: a.healing,
      timestamp: a.timestamp,
      actor_name: a.actor && a.actor.user ? a.actor.user.username : 'Unknown',
      target_name: a.target && a.target.user ? a.target.user.username : 'Unknown'
    }));
    
    return {
      room: roomData,
      participants: participantsData,
      teams,
      actions: actionsData
    };
  } catch (error) {
    console.error('Ошибка при получении деталей комнаты:', error);
    throw new Error(`Не удалось получить детали комнаты: ${error.message}`);
  }
}
```

### 2. Удалить дублирующийся метод `dismissRoom`

**Обнаружена критическая проблема**: В файле определен метод `dismissRoom` дважды (строки 1863 и 2397). Это нарушает синтаксис JavaScript, так как в классе не может быть двух методов с одинаковым именем, и вызывает каскадные ошибки синтаксиса во всех последующих методах.

Необходимо:
1. Удалить один из дублирующихся методов `dismissRoom` (предпочтительно второй, если они идентичны)
2. Если в методах есть различия, сохранить наиболее полную и актуальную функциональность

### 3. Проверить целостность класса

После удаления дублирующегося метода и переписывания метода `getRoomDetails`, необходимо проверить структуру всего класса `PvPService`, убедившись, что:
1. Все методы правильно открываются и закрываются
2. Нет других дублирующихся методов
3. Нет лишних закрывающих скобок
4. Все блоки `try-catch` корректно структурированы

### 4. Тестирование

После внесения изменений необходимо:
1. Перезапустить сервер
2. Проверить работу PvP-системы, особенно применение эффектов
3. Убедиться, что все эффекты корректно обрабатываются и влияют на бой

## Дальнейшие улучшения

После исправления основных структурных проблем, рекомендуется:

1. Добавить более подробное логирование для отслеживания применения эффектов
2. Провести рефакторинг метода `getRoomDetails` для улучшения производительности
3. Разделить логику обработки эффектов на отдельные методы для лучшей модульности
4. Добавить тесты для проверки корректной работы системы эффектов

## Вывод

Основной проблемой был нарушенный синтаксис JavaScript, который не позволял правильно структурировать код. Главными проблемами были:
1. Некорректное форматирование в методе `getRoomDetails`
2. Дублирующийся метод `dismissRoom`

Устранение этих проблем должно решить большинство синтаксических ошибок и восстановить работоспособность системы эффектов в PvP.