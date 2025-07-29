# План отладки взаимодействия с персонажами

## Проблема
Энергия обновляется успешно, но отношения не обновляются. Ошибка происходит в блоке catch, но логи не выводятся.

## Места для добавления логирования

### 1. После получения relationshipIndex
```javascript
console.log(`[DEBUG] Объект отношений:`, JSON.stringify(relationships_final[relationshipIndex], null, 2));
console.log(`[DEBUG] Текущий уровень:`, relationships_final[relationshipIndex]?.level);
console.log(`[DEBUG] Имя персонажа:`, relationships_final[relationshipIndex]?.name);
```

### 2. После расчета изменения отношений
```javascript
console.log(`[DEBUG] Изменение отношений:`, relationshipChange);
console.log(`[DEBUG] Новый уровень:`, newLevel);
```

### 3. Перед сохранением в БД
```javascript
console.log(`[DEBUG] Сохранение отношений в БД...`);
console.log(`[DEBUG] Обновленный объект:`, JSON.stringify(relationships_final[relationshipIndex], null, 2));
```

### 4. Улучшить блок catch
```javascript
catch (error) {
  await transaction.rollback();
  console.error('=== ОШИБКА ПРИ ВЗАИМОДЕЙСТВИИ С NPC ===');
  console.error('Тип ошибки:', error.constructor.name);
  console.error('Сообщение:', error.message);
  console.error('Стек:', error.stack);
  console.error('userId:', userId);
  console.error('characterId:', characterId);
  console.error('interactionType:', interactionType);
  console.error('==========================================');
  
  return {
    success: false,
    message: error.message || 'Произошла ошибка при взаимодействии с персонажем'
  };
}
```

## Возможные причины ошибки

1. **Отсутствие поля level или name** в объекте отношений
2. **Ошибка типа данных** - level не число
3. **Проблема с транзакцией** - конфликт блокировок БД
4. **Ошибка сериализации JSON** при сохранении массива

## Следующие шаги
1. Добавить детальное логирование
2. Протестировать взаимодействие
3. Проанализировать полные логи ошибки
4. Исправить найденную проблему