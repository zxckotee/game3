import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGameContext } from '../../context/GameContextProvider';
import GroupList from '../group/GroupList';
import GroupCreation from '../group/GroupCreation';
import GroupDetails from '../group/GroupDetails';
import GroupActivitySelection from '../group/GroupActivitySelection';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const GroupTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  background-color: rgba(34, 34, 34, 0.8);
  border-radius: 5px;
  color: #f0f0f0;
`;

const Title = styled.h2`
  color: #ffcc00;
  text-align: center;
  margin-bottom: 15px;
  font-family: 'Cinzel', serif;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
`;

const StyledTabs = styled(Tabs)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .react-tabs__tab-list {
    border-bottom: 1px solid #555;
    margin: 0 0 10px;
    padding: 0;
    display: flex;
  }
  
  .react-tabs__tab {
    background: rgba(51, 51, 51, 0.5);
    border: 1px solid #555;
    border-radius: 5px 5px 0 0;
    margin-right: 5px;
    padding: 8px 16px;
    cursor: pointer;
    color: #ccc;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(80, 80, 80, 0.5);
    }
  }
  
  .react-tabs__tab--selected {
    background: rgba(100, 100, 100, 0.5);
    border-color: #ffcc00;
    color: #ffcc00;
  }
  
  .react-tabs__tab-panel {
    display: none;
    height: calc(100% - 50px);
    overflow-y: auto;
  }
  
  .react-tabs__tab-panel--selected {
    display: block;
  }
`;

const NoGroupMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
`;

const CreateGroupButton = styled.button`
  background: linear-gradient(to bottom, #ffcc00, #cc9900);
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  margin-top: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to bottom, #ffdd33, #ddaa00);
    transform: translateY(-2px);
    box-shadow: 0 2px 10px rgba(255, 204, 0, 0.5);
  }
`;

const GroupTab = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showActivitySelection, setShowActivitySelection] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { state, actions } = useGameContext();
  const { playerGroups = [], invitations = [], isLoading, error } = state.group || {};
  
  useEffect(() => {
    // Загрузка данных о группах пользователя при монтировании компонента
    const loadUserGroups = async () => {
      try {
        await actions.loadUserGroups();
      } catch (error) {
        console.error('Ошибка при загрузке групп пользователя:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserGroups();
  }, [actions]);
  
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setActiveTab(1); // Переключаемся на вкладку деталей группы
  };
  
  const handleCreateGroupClick = () => {
    setShowCreateGroup(true);
  };
  
  const handleGroupCreated = async (groupData) => {
    try {
      const newGroup = await actions.createGroup(groupData);
      setShowCreateGroup(false);
      setSelectedGroup(newGroup);
      setActiveTab(1); // Переключаемся на вкладку деталей группы
    } catch (error) {
      console.error('Ошибка при создании группы:', error);
    }
  };
  
  const handleStartActivity = () => {
    setShowActivitySelection(true);
  };
  
  const handleActivitySelected = async (activity, difficulty, options) => {
    try {
      if (!selectedGroup) return;
      
      const activityInstance = await actions.createActivityInstance(
        selectedGroup.id,
        activity.id,
        difficulty,
        options
      );
      
      setShowActivitySelection(false);
      
      // После успешного создания активности обновляем информацию о группе
      const updatedGroups = await actions.loadUserGroups();
      const updatedGroup = updatedGroups.find(g => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch (error) {
      console.error('Ошибка при создании активности:', error);
    }
  };
  
  const handleCancelActivitySelection = () => {
    setShowActivitySelection(false);
  };
  
  const handleAcceptInvitation = async (invitation) => {
    try {
      await actions.joinGroup(invitation.groupId);
      await actions.removeInvitation(invitation.id);
      // Обновляем список групп
      await actions.loadUserGroups();
    } catch (error) {
      console.error('Ошибка при принятии приглашения:', error);
    }
  };
  
  const handleDeclineInvitation = async (invitationId) => {
    try {
      await actions.removeInvitation(invitationId);
    } catch (error) {
      console.error('Ошибка при отклонении приглашения:', error);
    }
  };
  
  const handleLeaveGroup = async (groupId) => {
    try {
      if (window.confirm('Вы уверены, что хотите покинуть группу?')) {
        await actions.leaveGroup(groupId);
        if (selectedGroup && selectedGroup.id === groupId) {
          setSelectedGroup(null);
          setActiveTab(0);
        }
      }
    } catch (error) {
      console.error('Ошибка при выходе из группы:', error);
    }
  };
  
  return (
    <GroupTabContainer>
      <Title>Групповые активности</Title>
      
      {isLoading || loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Загрузка...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          <p>Произошла ошибка: {error}</p>
          <button onClick={() => actions.loadUserGroups()}>Повторить загрузку</button>
        </div>
      ) : showCreateGroup ? (
        <GroupCreation 
          onGroupCreated={handleGroupCreated}
          onCancel={() => setShowCreateGroup(false)}
        />
      ) : showActivitySelection ? (
        <GroupActivitySelection
          group={selectedGroup}
          onActivitySelected={handleActivitySelected}
          onCancel={handleCancelActivitySelection}
        />
      ) : (
        <StyledTabs 
          selectedIndex={activeTab} 
          onSelect={index => setActiveTab(index)}
        >
          <TabList>
            <Tab>Мои группы</Tab>
            {selectedGroup && <Tab>Детали группы</Tab>}
            <Tab>Приглашения {invitations && invitations.length > 0 && `(${invitations.length})`}</Tab>
          </TabList>
          
          <TabPanel>
            {playerGroups && playerGroups.length > 0 ? (
              <GroupList 
                groups={playerGroups} 
                onSelectGroup={handleGroupSelect} 
                onLeaveGroup={handleLeaveGroup}
              />
            ) : (
              <NoGroupMessage>
                <p>Вы еще не состоите ни в одной группе.</p>
                <p>Создайте свою собственную группу или присоединитесь к существующей!</p>
                <CreateGroupButton onClick={handleCreateGroupClick}>
                  Создать новую группу
                </CreateGroupButton>
              </NoGroupMessage>
            )}
          </TabPanel>
          
          {selectedGroup && (
            <TabPanel>
              <GroupDetails 
                group={selectedGroup} 
                onStartActivity={handleStartActivity}
                onLeaveGroup={() => handleLeaveGroup(selectedGroup.id)}
              />
            </TabPanel>
          )}
          
          <TabPanel>
            {invitations && invitations.length > 0 ? (
              <div>
                {invitations.map(invitation => (
                  <div key={invitation.id} style={{ 
                    border: '1px solid #555', 
                    padding: '10px', 
                    margin: '10px 0',
                    borderRadius: '5px',
                    background: 'rgba(50, 50, 50, 0.5)'
                  }}>
                    <h3>Приглашение в группу "{invitation.groupName}"</h3>
                    <p>От: {invitation.inviterName}</p>
                    <p>Роль: {invitation.role || 'Участник'}</p>
                    <p>Сообщение: {invitation.message || 'Присоединяйтесь к нашей группе!'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <button 
                        style={{ 
                          padding: '5px 15px', 
                          background: '#4CAF50', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleAcceptInvitation(invitation)}
                      >
                        Принять
                      </button>
                      <button 
                        style={{ 
                          padding: '5px 15px', 
                          background: '#f44336', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleDeclineInvitation(invitation.id)}
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoGroupMessage>
                <p>У вас нет активных приглашений.</p>
              </NoGroupMessage>
            )}
          </TabPanel>
        </StyledTabs>
      )}
    </GroupTabContainer>
  );
};

export default GroupTab;
