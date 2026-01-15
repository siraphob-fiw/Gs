import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Switch, addToast } from '@heroui/react';
import {
  FaBell,
  FaBellSlash,
  FaCog,
  FaCheck,
  FaTimes,
  FaCalendar,
  FaDumbbell,
  FaRegCircle,
  FaTrophy,
} from 'react-icons/fa';
import { useTranslation } from '../../hooks/api/useTranslation';
import { NotificationHelpers } from '../../lib/notification-service';
import { useAuth } from '../../hooks/api/use-auth-hooks';

interface NotificationCenterProps {
  userId: string;
}

interface Notification {
  id: string;
  type:
    | 'WORKOUT_REMINDER'
    | 'WORKOUT_COMPLETED'
    | 'PROGRAM_GENERATED'
    | 'COACH_MESSAGE'
    | 'PERFORMANCE_MILESTONE';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { state } = useAuth();
  const user = state.user;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPushNotificationStatus();
    loadNotifications();
  }, [userId]);

  const checkPushNotificationStatus = async () => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  };

  const loadNotifications = async () => {
    // Mock notifications for demo - in real app, this would come from API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'WORKOUT_REMINDER',
        title: 'Workout Reminder',
        message: 'Your "Upper Body Strength" workout starts in 30 minutes.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        actionUrl: '/workouts/123',
      },
      {
        id: '2',
        type: 'PROGRAM_GENERATED',
        title: 'New Program Ready',
        message: 'Your personalized "Strength Building Phase 1" program has been generated.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/programs/456',
      },
      {
        id: '3',
        type: 'PERFORMANCE_MILESTONE',
        title: 'New Personal Best!',
        message: 'Congratulations! You achieved a new PR in Squat: 150kg',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  };

  const enablePushNotifications = async () => {
    try {
      setLoading(true);

      if (!('Notification' in window)) {
        addToast({
          title: t('notifications.notSupported'),
          description: t('notifications.notSupportedDesc'),
          variant: 'flat',
        });
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        await NotificationHelpers.registerPushNotifications(userId);
        setPushEnabled(true);

        addToast({
          title: t('notifications.enabled'),
          description: t('notifications.enabledDesc'),
          color: 'success',
        });
      } else {
        addToast({
          title: t('notifications.denied'),
          description: t('notifications.deniedDesc'),
          variant: 'flat',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      addToast({
        title: t('error.failed'),
        description: t('notifications.enableError'),
        variant: 'flat',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const disablePushNotifications = async () => {
    try {
      setLoading(true);
      await NotificationHelpers.unregisterPushNotifications(userId);
      setPushEnabled(false);

      addToast({
        title: t('notifications.disabled'),
        description: t('notifications.disabledDesc'),
        color: 'success',
      });
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      addToast({
        title: t('error.failed'),
        description: t('notifications.disableError'),
        variant: 'flat',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WORKOUT_REMINDER':
        return <FaCalendar />;
      case 'WORKOUT_COMPLETED':
        return <FaDumbbell className="h-4 w-4 success" />;
      case 'PROGRAM_GENERATED':
        return <FaCog className="h-4 w-4 text-purple-600" />;
      case 'COACH_MESSAGE':
        return <FaRegCircle />;
      case 'PERFORMANCE_MILESTONE':
        return <FaTrophy />;
      default:
        return <FaBell className="h-4 w-4 text-Secondary" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FaBell />
            <span>{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <Badge variant="flat" color="danger" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="bordered" size="sm" onClick={markAllAsRead}>
                <FaCheck />
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Push Notification Settings */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {pushEnabled ? <FaBell /> : <FaBellSlash />}
              <div>
                <div className="text-base font-medium">{t('notifications.pushNotifications')}</div>
                <p className="text-sm text-Secondary">{t('notifications.pushNotificationsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={pushEnabled}
              onValueChange={pushEnabled ? disablePushNotifications : enablePushNotifications}
              disabled={loading}
            />
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBell />
                <p>{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read
                      ? 'bg-background border-gray-200'
                      : 'bg-info/5 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && <div className="w-2 h-2 bg-info rounded-full" />}
                        </div>
                        <p className="text-sm text-Secondary mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <FaCheck />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <FaTimes />
                      </Button>
                    </div>
                  </div>

                  {notification.actionUrl && (
                    <div className="mt-3">
                      <Button variant="bordered" size="sm">
                        {t('notifications.viewDetails')}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
