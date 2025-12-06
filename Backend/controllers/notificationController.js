const Notification = require('../models/Notification');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const MarketplaceUser = require('../models/MarketplaceUser');

// Socket.io instance holder
let io = null;

// Set socket.io instance
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Create notification (Admin only)
const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetType,
      targetIds,
      viloyatId,
      tumanId,
      mfyId,
    } = req.body;

    // Determine targetRefModel based on targetType
    let targetRefModel = null;
    if (targetType === 'punkts') {
      targetRefModel = 'Punkt';
    } else if (['viloyat_agents', 'tuman_agents', 'mfy_agents'].includes(targetType)) {
      targetRefModel = 'Agent';
    } else if (targetType === 'marketplace_users') {
      targetRefModel = 'MarketplaceUser';
    } else if (targetType === 'contragents') {
      targetRefModel = 'Contragent';
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      targetType,
      targetIds: targetIds || [],
      targetRefModel,
      viloyatId,
      tumanId,
      mfyId,
      sentBy: req.user.userId,
    });

    // Emit socket event based on targetType
    if (io) {
      const eventData = {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetType: notification.targetType,
        createdAt: notification.createdAt,
      };

      // Emit to specific rooms based on targetType
      switch (targetType) {
        case 'all':
          io.emit('notification:new', eventData);
          break;
        case 'punkts':
          io.to('punkts').emit('notification:new', eventData);
          break;
        case 'viloyat_agents':
          io.to('viloyat_agents').emit('notification:new', eventData);
          break;
        case 'tuman_agents':
          io.to('tuman_agents').emit('notification:new', eventData);
          break;
        case 'mfy_agents':
          io.to('mfy_agents').emit('notification:new', eventData);
          break;
        case 'marketplace_users':
          io.to('marketplace_users').emit('notification:new', eventData);
          break;
        case 'contragents':
          io.to('contragents').emit('notification:new', eventData);
          break;
      }

      // If specific targetIds provided, emit to specific users
      if (targetIds && targetIds.length > 0) {
        targetIds.forEach((id) => {
          io.to(`user:${id}`).emit('notification:new', eventData);
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification yaratildi va yuborildi',
      data: notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification yaratishda xatolik',
      error: error.message,
    });
  }
};

// Get all notifications (Admin)
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType, type, isActive } = req.query;

    const query = {};
    if (targetType) query.targetType = targetType;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const notifications = await Notification.find(query)
      .populate('sentBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sentBy', 'name username');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification olishda xatolik',
      error: error.message,
    });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { title, message, type, isActive } = req.body;

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message, type, isActive },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification yangilandi',
      data: notification,
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification yangilashda xatolik',
      error: error.message,
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'chirildi',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification o\'chirishda xatolik',
      error: error.message,
    });
  }
};

// Helper function to get target types
const getTargetTypes = (userType) => {
  switch (userType) {
    case 'punkt':
      return ['all', 'punkts'];
    case 'viloyat_agent':
      return ['all', 'viloyat_agents'];
    case 'tuman_agent':
      return ['all', 'tuman_agents'];
    case 'mfy_agent':
      return ['all', 'mfy_agents'];
    case 'marketplace_user':
      return ['all', 'marketplace_users'];
    default:
      return [];
  }
};

// Helper function to get recipient type
const getRecipientType = (userType) => {
  switch (userType) {
    case 'punkt':
      return 'Punkt';
    case 'viloyat_agent':
    case 'tuman_agent':
    case 'mfy_agent':
      return 'Agent';
    case 'marketplace_user':
      return 'MarketplaceUser';
    default:
      return null;
  }
};

// Get notifications for Punkt
const getPunktNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const targetTypes = ['all', 'punkts'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    })
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add isRead field
    const notificationsWithRead = await Promise.all(
      notifications.map(async (n) => {
        const fullNotification = await Notification.findById(n._id);
        const isRead = fullNotification.readBy.some(
          (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Punkt'
        );
        return { ...n.toObject(), isRead };
      })
    );

    const total = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    res.status(200).json({
      success: true,
      data: notificationsWithRead,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get punkt notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get unread count for Punkt
const getPunktUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'punkts'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
      'readBy.recipientId': { $ne: userId },
    });

    // Filter out already read
    const unreadCount = notifications.filter(
      (n) => !n.readBy.some((r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Punkt')
    ).length;

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Get punkt unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark notification as read for Punkt
const markPunktNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Punkt'
    );

    if (!alreadyRead) {
      notification.readBy.push({
        recipientId: userId,
        recipientType: 'Punkt',
        readAt: new Date(),
      });
      await notification.save();

      // Emit updated unread count
      if (io) {
        const unreadCount = await getUnreadCountForUser(userId, ['all', 'punkts'], 'Punkt');
        io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark punkt notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark all as read for Punkt
const markAllPunktNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'punkts'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    for (const notification of notifications) {
      const alreadyRead = notification.readBy.some(
        (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Punkt'
      );
      if (!alreadyRead) {
        notification.readBy.push({
          recipientId: userId,
          recipientType: 'Punkt',
          readAt: new Date(),
        });
        await notification.save();
      }
    }

    // Emit updated unread count
    if (io) {
      io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'Barcha notificationlar o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark all punkt notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get notifications for Agent (viloyat/tuman/mfy)
const getAgentNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const agentRole = req.user.role; // 'viloyat', 'tuman', 'mfy'
    const { page = 1, limit = 20 } = req.query;
    
    const targetTypes = ['all', `${agentRole}_agents`];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    })
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add isRead field
    const notificationsWithRead = await Promise.all(
      notifications.map(async (n) => {
        const fullNotification = await Notification.findById(n._id);
        const isRead = fullNotification.readBy.some(
          (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Agent'
        );
        return { ...n.toObject(), isRead };
      })
    );

    const total = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    res.status(200).json({
      success: true,
      data: notificationsWithRead,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get agent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get unread count for Agent
const getAgentUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const agentRole = req.user.role;
    const targetTypes = ['all', `${agentRole}_agents`];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    const unreadCount = notifications.filter(
      (n) => !n.readBy.some((r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Agent')
    ).length;

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Get agent unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark notification as read for Agent
const markAgentNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const agentRole = req.user.role;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Agent'
    );

    if (!alreadyRead) {
      notification.readBy.push({
        recipientId: userId,
        recipientType: 'Agent',
        readAt: new Date(),
      });
      await notification.save();

      // Emit updated unread count
      if (io) {
        const unreadCount = await getUnreadCountForUser(userId, ['all', `${agentRole}_agents`], 'Agent');
        io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark agent notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark all as read for Agent
const markAllAgentNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const agentRole = req.user.role;
    const targetTypes = ['all', `${agentRole}_agents`];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    for (const notification of notifications) {
      const alreadyRead = notification.readBy.some(
        (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Agent'
      );
      if (!alreadyRead) {
        notification.readBy.push({
          recipientId: userId,
          recipientType: 'Agent',
          readAt: new Date(),
        });
        await notification.save();
      }
    }

    if (io) {
      io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'Barcha notificationlar o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark all agent notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get notifications for Marketplace User
const getMarketplaceNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const targetTypes = ['all', 'marketplace_users'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    })
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add isRead field
    const notificationsWithRead = await Promise.all(
      notifications.map(async (n) => {
        const fullNotification = await Notification.findById(n._id);
        const isRead = fullNotification.readBy.some(
          (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'MarketplaceUser'
        );
        return { ...n.toObject(), isRead };
      })
    );

    const total = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    res.status(200).json({
      success: true,
      data: notificationsWithRead,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get marketplace notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get unread count for Marketplace User
const getMarketplaceUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'marketplace_users'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    const unreadCount = notifications.filter(
      (n) => !n.readBy.some((r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'MarketplaceUser')
    ).length;

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Get marketplace unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark notification as read for Marketplace User
const markMarketplaceNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'MarketplaceUser'
    );

    if (!alreadyRead) {
      notification.readBy.push({
        recipientId: userId,
        recipientType: 'MarketplaceUser',
        readAt: new Date(),
      });
      await notification.save();

      if (io) {
        const unreadCount = await getUnreadCountForUser(userId, ['all', 'marketplace_users'], 'MarketplaceUser');
        io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark marketplace notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark all as read for Marketplace User
const markAllMarketplaceNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'marketplace_users'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    for (const notification of notifications) {
      const alreadyRead = notification.readBy.some(
        (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'MarketplaceUser'
      );
      if (!alreadyRead) {
        notification.readBy.push({
          recipientId: userId,
          recipientType: 'MarketplaceUser',
          readAt: new Date(),
        });
        await notification.save();
      }
    }

    if (io) {
      io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'Barcha notificationlar o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark all marketplace notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Helper function to get unread count
const getUnreadCountForUser = async (userId, targetTypes, recipientType) => {
  const notifications = await Notification.find({
    isActive: true,
    $or: [
      { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
      { targetIds: userId },
    ],
  });

  return notifications.filter(
    (n) => !n.readBy.some((r) => r.recipientId.toString() === userId.toString() && r.recipientType === recipientType)
  ).length;
};

// Legacy: Get notifications for specific user type (kept for backward compatibility)
const getMyNotifications = async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const targetTypes = getTargetTypes(userType);
    if (targetTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri user type',
      });
    }

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    })
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Legacy: Mark notification as read (kept for backward compatibility)
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { recipientId, recipientType } = req.body;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.recipientId.toString() === recipientId && r.recipientType === recipientType
    );

    if (!alreadyRead) {
      notification.readBy.push({
        recipientId,
        recipientType,
        readAt: new Date(),
      });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get notification statistics (Admin)
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
        },
      },
    ]);

    const totalNotifications = await Notification.countDocuments();
    const activeNotifications = await Notification.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        total: totalNotifications,
        active: activeNotifications,
        byTargetType: stats,
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik',
      error: error.message,
    });
  }
};

// Get notifications for Contragent
const getContragentNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const targetTypes = ['all', 'contragents'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    })
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const notificationsWithRead = await Promise.all(
      notifications.map(async (n) => {
        const fullNotification = await Notification.findById(n._id);
        const isRead = fullNotification.readBy.some(
          (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Contragent'
        );
        return { ...n.toObject(), isRead };
      })
    );

    const total = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    res.status(200).json({
      success: true,
      data: notificationsWithRead,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contragent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Notificationlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get unread count for Contragent
const getContragentUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'contragents'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    const unreadCount = notifications.filter(
      (n) => !n.readBy.some((r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Contragent')
    ).length;

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Get contragent unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark notification as read for Contragent
const markContragentNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification topilmadi',
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Contragent'
    );

    if (!alreadyRead) {
      notification.readBy.push({
        recipientId: userId,
        recipientType: 'Contragent',
        readAt: new Date(),
      });
      await notification.save();

      if (io) {
        const unreadCount = await getUnreadCountForUser(userId, ['all', 'contragents'], 'Contragent');
        io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark contragent notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark all as read for Contragent
const markAllContragentNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const targetTypes = ['all', 'contragents'];

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetType: { $in: targetTypes }, targetIds: { $size: 0 } },
        { targetIds: userId },
      ],
    });

    for (const notification of notifications) {
      const alreadyRead = notification.readBy.some(
        (r) => r.recipientId.toString() === userId.toString() && r.recipientType === 'Contragent'
      );
      if (!alreadyRead) {
        notification.readBy.push({
          recipientId: userId,
          recipientType: 'Contragent',
          readAt: new Date(),
        });
        await notification.save();
      }
    }

    if (io) {
      io.to(`user:${userId}`).emit('notification:unread_count', { unreadCount: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'Barcha notificationlar o\'qildi deb belgilandi',
    });
  } catch (error) {
    console.error('Mark all contragent notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  setSocketIO,
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getMyNotifications,
  markAsRead,
  getNotificationStats,
  // Punkt
  getPunktNotifications,
  getPunktUnreadCount,
  markPunktNotificationRead,
  markAllPunktNotificationsRead,
  // Agent
  getAgentNotifications,
  getAgentUnreadCount,
  markAgentNotificationRead,
  markAllAgentNotificationsRead,
  // Marketplace
  getMarketplaceNotifications,
  getMarketplaceUnreadCount,
  markMarketplaceNotificationRead,
  markAllMarketplaceNotificationsRead,
  // Contragent
  getContragentNotifications,
  getContragentUnreadCount,
  markContragentNotificationRead,
  markAllContragentNotificationsRead,
};

