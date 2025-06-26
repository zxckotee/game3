/**
 * Клиентская версия GroupService без серверных зависимостей
 * Используется в браузере вместо оригинального group-service.js
 */

// Статусы группы
const GROUP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISBANDED: 'disbanded'
};

// Статусы членства в группе
const MEMBER_STATUS = {
  LEADER: 'leader',
  ELDER: 'elder',
  MEMBER: 'member',
  TRIAL: 'trial'
};

// Типы групп
const GROUP_TYPES = {
  CLAN: 'clan',
  ALLIANCE: 'alliance',
  GUILD: 'guild',
  PARTY: 'party'
};

// Моковые данные о группах
const mockGroups = [
  {
    id: 1,
    name: 'Клан Огненного Лотоса',
    description: 'Группа культиваторов, специализирующихся на огненных техниках.',
    type: GROUP_TYPES.CLAN,
    status: GROUP_STATUS.ACTIVE,
    leaderUserId: 101,
    leaderName: 'МастерОгня',
    minLevel: 5,
    minCultivationStage: 'Закалка тела',
    members: 15,
    maxMembers: 30,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // Создан 100 дней назад
  },
  {
    id: 2,
    name: 'Гильдия Собирателей',
    description: 'Группа, специализирующаяся на сборе редких ресурсов и материалов.',
    type: GROUP_TYPES.GUILD,
    status: GROUP_STATUS.ACTIVE,
    leaderUserId: 102,
    leaderName: 'РесурсМастер',
    minLevel: 3,
    minCultivationStage: 'Закалка тела',
    members: 8,
    maxMembers: 20,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // Создан 45 дней назад
  },
  {
    id: 3,
    name: 'Альянс Пяти Стихий',
    description: 'Альянс культиваторов, изучающих все пять основных стихий.',
    type: GROUP_TYPES.ALLIANCE,
    status: GROUP_STATUS.ACTIVE,
    leaderUserId: 103,
    leaderName: 'БалансПяти',
    minLevel: 10,
    minCultivationStage: 'Построение основания',
    members: 25,
    maxMembers: 50,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) // Создан 200 дней назад
  }
];

// Моковые данные о членстве в группах
const mockGroupMemberships = [
  {
    id: 1,
    groupId: 1,
    userId: 101,
    status: MEMBER_STATUS.LEADER,
    joinedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    contribution: 5000,
    rank: 1
  },
  {
    id: 2,
    groupId: 1,
    userId: 104,
    status: MEMBER_STATUS.ELDER,
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    contribution: 3500,
    rank: 2
  },
  {
    id: 3,
    groupId: 1,
    userId: 105,
    status: MEMBER_STATUS.MEMBER,
    joinedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    contribution: 1200,
    rank: 5
  }
];

// Моковые данные о приглашениях в группы
const mockGroupInvitations = [
  {
    id: 1,
    groupId: 1,
    userId: 106,
    invitedBy: 101,
    message: 'Присоединяйся к нашему клану для совместного развития!',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'pending'
  },
  {
    id: 2,
    groupId: 2,
    userId: 106,
    invitedBy: 102,
    message: 'Нам нужны хорошие собиратели ресурсов.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'pending'
  }
];

class GroupServiceAPI {
  /**
   * Получает все группы
   * @returns {Promise<Array>} Массив всех групп
   */
  static async getAllGroups() {
    return Promise.resolve([...mockGroups]);
  }

  /**
   * Получает группу по ID
   * @param {number} groupId ID группы
   * @returns {Promise<Object|null>} Объект группы или null, если не найден
   */
  static async getGroupById(groupId) {
    const group = mockGroups.find(group => group.id === groupId);
    return Promise.resolve(group ? {...group} : null);
  }

  /**
   * Получает группы по типу
   * @param {string} type Тип группы
   * @returns {Promise<Array>} Массив групп указанного типа
   */
  static async getGroupsByType(type) {
    const groups = mockGroups.filter(group => group.type === type);
    return Promise.resolve([...groups]);
  }

  /**
   * Создает новую группу
   * @param {number} userId ID пользователя (лидера)
   * @param {Object} groupData Данные о группе
   * @returns {Promise<Object>} Созданная группа
   */
  static async createGroup(userId, groupData) {
    // Генерируем новый ID группы
    const newGroupId = Math.max(...mockGroups.map(group => group.id), 0) + 1;
    
    const newGroup = {
      id: newGroupId,
      name: groupData.name,
      description: groupData.description || '',
      type: groupData.type || GROUP_TYPES.CLAN,
      status: GROUP_STATUS.ACTIVE,
      leaderUserId: userId,
      leaderName: groupData.leaderName || 'Лидер', // В реальной версии получали бы имя из БД
      minLevel: groupData.minLevel || 1,
      minCultivationStage: groupData.minCultivationStage || null,
      members: 1, // Лидер уже считается участником
      maxMembers: groupData.maxMembers || 20,
      createdAt: new Date()
    };
    
    // Добавляем запись о членстве лидера
    const membershipId = Math.max(...mockGroupMemberships.map(m => m.id), 0) + 1;
    const leaderMembership = {
      id: membershipId,
      groupId: newGroupId,
      userId,
      status: MEMBER_STATUS.LEADER,
      joinedAt: new Date(),
      contribution: 0,
      rank: 1
    };
    
    // В клиентской версии просто возвращаем успешный результат
    return Promise.resolve({
      success: true,
      message: `Группа "${newGroup.name}" успешно создана`,
      group: newGroup,
      membership: leaderMembership
    });
  }

  /**
   * Обновляет информацию о группе
   * @param {number} userId ID пользователя (должен быть лидером или старейшиной)
   * @param {number} groupId ID группы
   * @param {Object} updateData Данные для обновления
   * @returns {Promise<Object>} Обновленная группа
   */
  static async updateGroup(userId, groupId, updateData) {
    const group = await this.getGroupById(groupId);
    
    if (!group) {
      return Promise.reject(new Error('Группа не найдена'));
    }
    
    // Проверяем, является ли пользователь лидером группы
    if (group.leaderUserId !== userId) {
      // В реальной версии мы бы проверяли, является ли он хотя бы старейшиной
      return Promise.reject(new Error('У вас нет прав для обновления информации о группе'));
    }
    
    // Обновляем данные группы
    const updatedGroup = {
      ...group,
      name: updateData.name !== undefined ? updateData.name : group.name,
      description: updateData.description !== undefined ? updateData.description : group.description,
      minLevel: updateData.minLevel !== undefined ? updateData.minLevel : group.minLevel,
      minCultivationStage: updateData.minCultivationStage !== undefined ? updateData.minCultivationStage : group.minCultivationStage,
      maxMembers: updateData.maxMembers !== undefined ? updateData.maxMembers : group.maxMembers
    };
    
    return Promise.resolve({
      success: true,
      message: `Информация о группе "${updatedGroup.name}" обновлена`,
      group: updatedGroup
    });
  }

  /**
   * Расформировывает группу
   * @param {number} userId ID пользователя (должен быть лидером)
   * @param {number} groupId ID группы
   * @returns {Promise<Object>} Результат операции
   */
  static async disbandGroup(userId, groupId) {
    const group = await this.getGroupById(groupId);
    
    if (!group) {
      return Promise.reject(new Error('Группа не найдена'));
    }
    
    // Проверяем, является ли пользователь лидером группы
    if (group.leaderUserId !== userId) {
      return Promise.reject(new Error('Только лидер группы может её расформировать'));
    }
    
    // Обновляем статус группы
    const updatedGroup = {
      ...group,
      status: GROUP_STATUS.DISBANDED
    };
    
    return Promise.resolve({
      success: true,
      message: `Группа "${updatedGroup.name}" расформирована`,
      group: updatedGroup
    });
  }

  /**
   * Получает список членов группы
   * @param {number} groupId ID группы
   * @returns {Promise<Array>} Массив членов группы
   */
  static async getGroupMembers(groupId) {
    const members = mockGroupMemberships.filter(m => m.groupId === groupId);
    return Promise.resolve([...members]);
  }

  /**
   * Получает информацию о членстве пользователя в группе
   * @param {number} userId ID пользователя
   * @param {number} groupId ID группы
   * @returns {Promise<Object|null>} Объект членства или null, если пользователь не состоит в группе
   */
  static async getUserMembership(userId, groupId) {
    const membership = mockGroupMemberships.find(m => m.userId === userId && m.groupId === groupId);
    return Promise.resolve(membership ? {...membership} : null);
  }

  /**
   * Получает все группы, в которых состоит пользователь
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив групп пользователя
   */
  static async getUserGroups(userId) {
    const memberships = mockGroupMemberships.filter(m => m.userId === userId);
    const groupIds = memberships.map(m => m.groupId);
    const groups = mockGroups.filter(g => groupIds.includes(g.id));
    
    return Promise.resolve([...groups]);
  }

  /**
   * Отправляет приглашение пользователю в группу
   * @param {number} senderId ID отправителя (должен быть лидером или старейшиной)
   * @param {number} groupId ID группы
   * @param {number} targetUserId ID приглашаемого пользователя
   * @param {string} message Сообщение с приглашением
   * @returns {Promise<Object>} Результат отправки приглашения
   */
  static async inviteToGroup(senderId, groupId, targetUserId, message) {
    const group = await this.getGroupById(groupId);
    
    if (!group) {
      return Promise.reject(new Error('Группа не найдена'));
    }
    
    // Проверяем, является ли пользователь лидером или старейшиной группы
    const senderMembership = await this.getUserMembership(senderId, groupId);
    
    if (!senderMembership || (senderMembership.status !== MEMBER_STATUS.LEADER && senderMembership.status !== MEMBER_STATUS.ELDER)) {
      return Promise.reject(new Error('У вас нет прав приглашать пользователей в группу'));
    }
    
    // Проверяем, не достигнут ли лимит участников
    if (group.members >= group.maxMembers) {
      return Promise.reject(new Error('Группа достигла максимального количества участников'));
    }
    
    // Проверяем, нет ли уже активного приглашения
    const existingInvitation = mockGroupInvitations.find(
      inv => inv.groupId === groupId && inv.userId === targetUserId && inv.status === 'pending'
    );
    
    if (existingInvitation) {
      return Promise.reject(new Error('Пользователю уже отправлено приглашение в эту группу'));
    }
    
    // Создаем новое приглашение
    const newInvitationId = Math.max(...mockGroupInvitations.map(inv => inv.id), 0) + 1;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Истекает через 7 дней
    
    const newInvitation = {
      id: newInvitationId,
      groupId,
      userId: targetUserId,
      invitedBy: senderId,
      message: message || `Приглашение в группу "${group.name}"`,
      createdAt: new Date(),
      expiresAt: expiryDate,
      status: 'pending'
    };
    
    return Promise.resolve({
      success: true,
      message: `Приглашение отправлено пользователю`,
      invitation: newInvitation
    });
  }

  /**
   * Обрабатывает ответ на приглашение в группу
   * @param {number} userId ID пользователя
   * @param {number} invitationId ID приглашения
   * @param {boolean} accept Принять или отклонить приглашение
   * @returns {Promise<Object>} Результат обработки приглашения
   */
  static async respondToInvitation(userId, invitationId, accept) {
    const invitation = mockGroupInvitations.find(inv => inv.id === invitationId && inv.userId === userId);
    
    if (!invitation) {
      return Promise.reject(new Error('Приглашение не найдено'));
    }
    
    if (invitation.status !== 'pending') {
      return Promise.reject(new Error('Приглашение уже обработано или истекло'));
    }
    
    if (invitation.expiresAt < new Date()) {
      return Promise.reject(new Error('Приглашение истекло'));
    }
    
    if (accept) {
      // Пользователь принимает приглашение
      const group = await this.getGroupById(invitation.groupId);
      
      if (!group) {
        return Promise.reject(new Error('Группа не найдена'));
      }
      
      if (group.status !== GROUP_STATUS.ACTIVE) {
        return Promise.reject(new Error('Группа неактивна'));
      }
      
      if (group.members >= group.maxMembers) {
        return Promise.reject(new Error('Группа достигла максимального количества участников'));
      }
      
      // Создаем запись о членстве
      const membershipId = Math.max(...mockGroupMemberships.map(m => m.id), 0) + 1;
      const newMembership = {
        id: membershipId,
        groupId: invitation.groupId,
        userId,
        status: MEMBER_STATUS.MEMBER,
        joinedAt: new Date(),
        contribution: 0,
        rank: group.members + 1
      };
      
      // Обновляем приглашение
      invitation.status = 'accepted';
      
      // Обновляем количество участников в группе
      group.members += 1;
      
      return Promise.resolve({
        success: true,
        message: `Вы успешно присоединились к группе "${group.name}"`,
        membership: newMembership,
        group
      });
    } else {
      // Пользователь отклоняет приглашение
      invitation.status = 'declined';
      
      return Promise.resolve({
        success: true,
        message: 'Приглашение отклонено',
        invitation
      });
    }
  }

  /**
   * Покидает группу
   * @param {number} userId ID пользователя
   * @param {number} groupId ID группы
   * @returns {Promise<Object>} Результат выхода из группы
   */
  static async leaveGroup(userId, groupId) {
    const membership = await this.getUserMembership(userId, groupId);
    
    if (!membership) {
      return Promise.reject(new Error('Вы не состоите в этой группе'));
    }
    
    const group = await this.getGroupById(groupId);
    
    if (!group) {
      return Promise.reject(new Error('Группа не найдена'));
    }
    
    // Проверяем, не является ли пользователь лидером группы
    if (membership.status === MEMBER_STATUS.LEADER) {
      return Promise.reject(new Error('Лидер не может покинуть группу. Передайте лидерство другому участнику или расформируйте группу.'));
    }
    
    // Обновляем количество участников в группе
    group.members -= 1;
    
    return Promise.resolve({
      success: true,
      message: `Вы успешно покинули группу "${group.name}"`,
      group
    });
  }

  /**
   * Изменяет статус участника группы
   * @param {number} leaderId ID лидера группы
   * @param {number} groupId ID группы
   * @param {number} targetUserId ID целевого пользователя
   * @param {string} newStatus Новый статус
   * @returns {Promise<Object>} Результат изменения статуса
   */
  static async changeMemberStatus(leaderId, groupId, targetUserId, newStatus) {
    const leaderMembership = await this.getUserMembership(leaderId, groupId);
    
    if (!leaderMembership || leaderMembership.status !== MEMBER_STATUS.LEADER) {
      return Promise.reject(new Error('Только лидер может изменять статусы участников'));
    }
    
    const targetMembership = await this.getUserMembership(targetUserId, groupId);
    
    if (!targetMembership) {
      return Promise.reject(new Error('Пользователь не состоит в этой группе'));
    }
    
    if (targetMembership.status === MEMBER_STATUS.LEADER) {
      return Promise.reject(new Error('Нельзя изменить статус лидера'));
    }
    
    if (newStatus === MEMBER_STATUS.LEADER) {
      // Особый случай - передача лидерства
      leaderMembership.status = MEMBER_STATUS.ELDER;
      targetMembership.status = MEMBER_STATUS.LEADER;
      
      // Обновляем лидера в группе
      const group = await this.getGroupById(groupId);
      group.leaderUserId = targetUserId;
      group.leaderName = 'Новый лидер'; // В реальности получили бы имя из БД
      
      return Promise.resolve({
        success: true,
        message: `Лидерство передано новому участнику`,
        updatedMemberships: [leaderMembership, targetMembership],
        group
      });
    } else {
      // Обычное изменение статуса
      targetMembership.status = newStatus;
      
      return Promise.resolve({
        success: true,
        message: `Статус участника изменен на "${newStatus}"`,
        membership: targetMembership
      });
    }
  }

  /**
   * Исключает участника из группы
   * @param {number} leaderId ID лидера или старейшины группы
   * @param {number} groupId ID группы
   * @param {number} targetUserId ID исключаемого участника
   * @returns {Promise<Object>} Результат исключения
   */
  static async kickMember(leaderId, groupId, targetUserId) {
    const leaderMembership = await this.getUserMembership(leaderId, groupId);
    
    if (!leaderMembership || (leaderMembership.status !== MEMBER_STATUS.LEADER && leaderMembership.status !== MEMBER_STATUS.ELDER)) {
      return Promise.reject(new Error('У вас нет прав исключать участников из группы'));
    }
    
    const targetMembership = await this.getUserMembership(targetUserId, groupId);
    
    if (!targetMembership) {
      return Promise.reject(new Error('Пользователь не состоит в этой группе'));
    }
    
    // Старейшина не может исключить другого старейшину или лидера
    if (leaderMembership.status === MEMBER_STATUS.ELDER && 
        (targetMembership.status === MEMBER_STATUS.ELDER || targetMembership.status === MEMBER_STATUS.LEADER)) {
      return Promise.reject(new Error('Вы не можете исключить старейшину или лидера'));
    }
    
    // Обновляем количество участников в группе
    const group = await this.getGroupById(groupId);
    group.members -= 1;
    
    return Promise.resolve({
      success: true,
      message: `Участник исключен из группы`,
      group
    });
  }

  /**
   * Получает статусы групп
   */
  static getGroupStatuses() {
    return GROUP_STATUS;
  }

  /**
   * Получает статусы членства
   */
  static getMemberStatuses() {
    return MEMBER_STATUS;
  }

  /**
   * Получает типы групп
   */
  static getGroupTypes() {
    return GROUP_TYPES;
  }
}

// Экспортируем класс через CommonJS
module.exports = GroupServiceAPI;

// Экспортируем константы для совместимости
const GROUP_STATUS_EXPORT = GROUP_STATUS;
const MEMBER_STATUS_EXPORT = MEMBER_STATUS;
const GROUP_TYPES_EXPORT = GROUP_TYPES;

// Экспортируем отдельные методы для совместимости
module.exports.getAllGroups = GroupServiceAPI.getAllGroups;
module.exports.getGroupById = GroupServiceAPI.getGroupById;
module.exports.getGroupsByType = GroupServiceAPI.getGroupsByType;
module.exports.createGroup = GroupServiceAPI.createGroup;
module.exports.updateGroup = GroupServiceAPI.updateGroup;
module.exports.disbandGroup = GroupServiceAPI.disbandGroup;
module.exports.getGroupMembers = GroupServiceAPI.getGroupMembers;
module.exports.getUserMembership = GroupServiceAPI.getUserMembership;
module.exports.getUserGroups = GroupServiceAPI.getUserGroups;
module.exports.inviteToGroup = GroupServiceAPI.inviteToGroup;
module.exports.respondToInvitation = GroupServiceAPI.respondToInvitation;
module.exports.leaveGroup = GroupServiceAPI.leaveGroup;
module.exports.changeMemberStatus = GroupServiceAPI.changeMemberStatus;
module.exports.kickMember = GroupServiceAPI.kickMember;