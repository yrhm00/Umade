import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Bell,
  MessageCircle,
  Star,
  MessageSquare,
  Info,
} from 'lucide-react-native';
import { AppNotification, NotificationTypeDB } from '@/types';
import { useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationCardProps {
  notification: AppNotification;
}

// Map notification type to icon and colors
const getNotificationConfig = (type: NotificationTypeDB) => {
  switch (type) {
    case 'booking':
      return {
        icon: <Calendar size={22} color={Colors.warning.DEFAULT} />,
        backgroundColor: Colors.warning.light,
      };
    case 'message':
      return {
        icon: <MessageCircle size={22} color={Colors.primary.DEFAULT} />,
        backgroundColor: Colors.primary[50],
      };
    case 'review':
      return {
        icon: <Star size={22} color={Colors.warning.DEFAULT} />,
        backgroundColor: Colors.warning.light,
      };
    case 'system':
    default:
      return {
        icon: <Info size={22} color={Colors.gray[500]} />,
        backgroundColor: Colors.gray[100],
      };
  }
};

export const NotificationCard = React.memo(function NotificationCard({
  notification,
}: NotificationCardProps) {
  const router = useRouter();
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  const config = getNotificationConfig(notification.type);

  const handlePress = () => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on data
    const { data } = notification;
    if (data.conversationId) {
      router.push(`/chat/${data.conversationId}`);
    } else if (data.bookingId) {
      router.push(`/booking/${data.bookingId}/details`);
    } else if (data.eventId) {
      router.push(`/event/${data.eventId}`);
    } else if (data.providerId) {
      router.push(`/reviews/provider/${data.providerId}`);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.containerUnread,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        {config.icon}
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, !notification.is_read && styles.titleUnread]}
        >
          {notification.title}
        </Text>
        {notification.body && (
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        <Text style={styles.time}>
          {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  containerUnread: {
    backgroundColor: Colors.primary[50],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Layout.spacing.md,
    marginRight: Layout.spacing.sm,
  },
  title: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  titleUnread: {
    fontWeight: '600',
  },
  body: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.DEFAULT,
  },
});
