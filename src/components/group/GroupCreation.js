import React, { useState } from 'react';
import styled from 'styled-components';
import { useGameContext } from '../../context/GameContextProvider';

const CreationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(40, 40, 40, 0.8);
  border-radius: 8px;
  border: 1px solid #555;
`;

const Title = styled.h3`
  color: #ffcc00;
  text-align: center;
  margin: 0 0 10px 0;
  font-family: 'Cinzel', serif;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #ddd;
`;

const Input = styled.input`
  padding: 10px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
    box-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
    box-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  }
`;

const Select = styled.select`
  padding: 10px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
    box-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
  }
  
  option {
    background: #333;
    color: #fff;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
`;

const CancelButton = styled(Button)`
  background: #555;
  color: #fff;
  border: none;
  
  &:hover {
    background: #777;
  }
`;

const CreateButton = styled(Button)`
  background: linear-gradient(to bottom, #ffcc00, #cc9900);
  color: #333;
  border: none;
  
  &:hover {
    background: linear-gradient(to bottom, #ffdd33, #ddaa00);
    box-shadow: 0 2px 10px rgba(255, 204, 0, 0.5);
  }
  
  &:disabled {
    background: #888;
    color: #ddd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
`;

const GroupCreation = ({ onGroupCreated, onCancel }) => {
  const { state, actions } = useGameContext();
  const { player } = state;
  
  // Начальное состояние формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 5,
    minCultivationLevel: 1,
    isPrivate: false,
    requiresApproval: true,
    leaderSpecialization: 'damage'
  });
  
  // Состояние ошибок
  const [errors, setErrors] = useState({});
  
  // Состояние процесса создания
  const [isCreating, setIsCreating] = useState(false);
  
  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) : value
    });
    
    // Очищаем ошибку для поля, которое изменяется
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название группы обязательно';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Название должно содержать не менее 2 символов';
    } else if (formData.name.length > 30) {
      newErrors.name = 'Название должно содержать не более 30 символов';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Описание группы обязательно';
    }
    
    if (formData.maxMembers < 2) {
      newErrors.maxMembers = 'Группа должна вмещать минимум 2 участника';
    } else if (formData.maxMembers > 10) {
      newErrors.maxMembers = 'Группа не может вмещать более 10 участников';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Создаем данные для отправки на сервер
      const groupData = {
        name: formData.name,
        description: formData.description,
        maxMembers: formData.maxMembers,
        minCultivationLevel: formData.minCultivationLevel,
        isPrivate: formData.isPrivate,
        requiresApproval: formData.requiresApproval,
        leaderSpecialization: formData.leaderSpecialization
      };
      
      // Используем метод createGroup из нашего контекста
      const newGroup = await actions.createGroup(groupData);
      
      // Вызываем колбэк с созданной группой
      onGroupCreated(newGroup);
    } catch (error) {
      console.error('Ошибка при создании группы:', error);
      setErrors({
        ...errors,
        submit: 'Ошибка при создании группы. Пожалуйста, попробуйте еще раз.'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <CreationContainer>
      <Title>Создание новой группы</Title>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Название группы *</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Введите название группы"
            maxLength={30}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Описание группы *</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите цели и деятельность вашей группы"
          />
          {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="maxMembers">Максимальное количество участников</Label>
          <Input
            type="number"
            id="maxMembers"
            name="maxMembers"
            value={formData.maxMembers}
            onChange={handleChange}
            min={2}
            max={10}
          />
          {errors.maxMembers && <ErrorMessage>{errors.maxMembers}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="minCultivationLevel">Минимальный уровень культивации</Label>
          <Input
            type="number"
            id="minCultivationLevel"
            name="minCultivationLevel"
            value={formData.minCultivationLevel}
            onChange={handleChange}
            min={1}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="leaderSpecialization">Ваша специализация в группе</Label>
          <Select
            id="leaderSpecialization"
            name="leaderSpecialization"
            value={formData.leaderSpecialization}
            onChange={handleChange}
          >
            <option value="tank">Защитник (Танк)</option>
            <option value="damage">Атакующий (Урон)</option>
            <option value="support">Поддержка</option>
            <option value="healer">Целитель</option>
            <option value="scout">Разведчик</option>
            <option value="alchemist">Алхимик</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Checkbox>
            <input
              type="checkbox"
              id="isPrivate"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
            />
            <Label htmlFor="isPrivate">Приватная группа (видна только по приглашению)</Label>
          </Checkbox>
        </FormGroup>
        
        <FormGroup>
          <Checkbox>
            <input
              type="checkbox"
              id="requiresApproval"
              name="requiresApproval"
              checked={formData.requiresApproval}
              onChange={handleChange}
            />
            <Label htmlFor="requiresApproval">Требуется одобрение для вступления</Label>
          </Checkbox>
        </FormGroup>
        
        {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
        
        <ButtonGroup>
          <CancelButton type="button" onClick={onCancel}>Отмена</CancelButton>
          <CreateButton type="submit" disabled={isCreating}>
            {isCreating ? 'Создание...' : 'Создать группу'}
          </CreateButton>
        </ButtonGroup>
      </Form>
    </CreationContainer>
  );
};

export default GroupCreation;
