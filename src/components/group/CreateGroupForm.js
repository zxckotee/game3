import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import Button from '../ui/Button';
import styles from './CreateGroupForm.module.css';

/**
 * Компонент формы для создания новой группы
 * @param {Function} onSubmit - Обработчик отправки формы
 * @param {Function} onCancel - Обработчик отмены создания
 * @param {boolean} loading - Индикатор загрузки
 */
const CreateGroupForm = ({ onSubmit, onCancel, loading }) => {
  const { state } = useGameContext();
  const { cultivation } = state.player;
  
  // Состояние для полей формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 5,
    minCultivationLevel: 1,
    isPrivate: false,
    requiresApproval: true,
    leaderSpecialization: 'damage' // Специализация по умолчанию
  });
  
  // Список доступных специализаций
  const specializations = [
    { id: 'damage', name: 'Урон', description: 'Специализация на нанесении максимального урона' },
    { id: 'tank', name: 'Защита', description: 'Специализация на поглощении урона и защите группы' },
    { id: 'support', name: 'Поддержка', description: 'Специализация на усилении союзников и ослаблении противников' },
    { id: 'control', name: 'Контроль', description: 'Специализация на контроле поля боя и обездвиживании противников' },
    { id: 'healer', name: 'Лечение', description: 'Специализация на восстановлении здоровья союзников' }
  ];
  
  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка на пустое название
    if (!formData.name.trim()) {
      alert('Пожалуйста, введите название группы');
      return;
    }
    
    // Вызываем обработчик отправки
    onSubmit(formData);
  };
  
  return (
    <div className={styles.formContainer}>
      <h3 className={styles.title}>Создание новой группы</h3>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Название группы</label>
          <input
            type="text"
            id="name"
            name="name"
            className={styles.input}
            value={formData.name}
            onChange={handleChange}
            placeholder="Введите название группы"
            required
            maxLength={30}
            disabled={loading}
          />
          <div className={styles.fieldHint}>От 2 до 30 символов</div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>Описание</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите цель вашей группы"
            rows={3}
            maxLength={200}
            disabled={loading}
          />
          <div className={styles.fieldHint}>До 200 символов</div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="maxMembers" className={styles.label}>Максимальное количество участников</label>
          <select
            id="maxMembers"
            name="maxMembers"
            className={styles.select}
            value={formData.maxMembers}
            onChange={handleChange}
            disabled={loading}
          >
            <option value={2}>2 культиватора</option>
            <option value={3}>3 культиватора</option>
            <option value={4}>4 культиватора</option>
            <option value={5}>5 культиваторов</option>
            {cultivation && cultivation.level >= 4 && (
              <>
                <option value={6}>6 культиваторов</option>
                <option value={7}>7 культиваторов</option>
              </>
            )}
            {cultivation && cultivation.level >= 7 && (
              <>
                <option value={8}>8 культиваторов</option>
                <option value={9}>9 культиваторов</option>
                <option value={10}>10 культиваторов</option>
              </>
            )}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="minCultivationLevel" className={styles.label}>Минимальный уровень культивации</label>
          <select
            id="minCultivationLevel"
            name="minCultivationLevel"
            className={styles.select}
            value={formData.minCultivationLevel}
            onChange={handleChange}
            disabled={loading}
          >
            <option value={1}>Уровень 1 (Закалка тела)</option>
            <option value={2}>Уровень 2 (Формирование основания)</option>
            <option value={3}>Уровень 3 (Накопление ци)</option>
            <option value={4}>Уровень 4 (Очищение меридиан)</option>
            <option value={5}>Уровень 5 (Золотое ядро)</option>
            <option value={6}>Уровень 6 (Формирование души)</option>
            <option value={7}>Уровень 7 (Соединение души)</option>
            <option value={8}>Уровень 8 (Восстановление духа)</option>
            <option value={9}>Уровень 9 (Выход ниши)</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="leaderSpecialization" className={styles.label}>Ваша специализация в группе</label>
          <select
            id="leaderSpecialization"
            name="leaderSpecialization"
            className={styles.select}
            value={formData.leaderSpecialization}
            onChange={handleChange}
            disabled={loading}
          >
            {specializations.map(spec => (
              <option key={spec.id} value={spec.id}>
                {spec.name} - {spec.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              disabled={loading}
            />
            <span className={styles.checkboxText}>Закрытая группа (только по приглашениям)</span>
          </label>
        </div>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="requiresApproval"
              checked={formData.requiresApproval}
              onChange={handleChange}
              disabled={loading}
            />
            <span className={styles.checkboxText}>Требовать одобрение для вступления</span>
          </label>
        </div>
        
        <div className={styles.actions}>
          <Button 
            type="button" 
            onClick={onCancel} 
            className={styles.cancelButton}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать группу'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupForm;
