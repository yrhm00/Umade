import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  MessageCircle,
  Star,
  Info,
} from 'lucide-react-native';
import { AppNotification, NotificationTypeDB } from '@/types';
import { useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationCardProps {
  notification: AppNotification;
}

// Map notification type to icon and colors
const getNotificationConfig = (
  type: NotificationTypeDB,
  isDark: boolean,
  colors: ReturnType<typeof useColors>
) => {
  switch (type) {
    case 'booking':
      return {
        icon: <Calendar size={22} color={Colors.warning.DEFAULT} />,
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : Colors.warning.light,
      };
    case 'message':
      return {
        icon: <MessageCircle size={22} color={colors.primary} />,
        backgroundColor: isDark ? 'rgba(143, 119, 184, 0.18)' : Colors.primary[50],
      };
    case 'review':
      return {
        icon: <Star size={22} color={Colors.warning.DEFAULT} />,
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : Colors.warning.light,
      };
    case 'system':
    default:
      return {
        icon: <Info size={22} color={colors.textSecondary} />,
        backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100],
      };
  }
};

export const NotificationCard = React.memo(function NotificationCard({
  notification,
}: NotificationCardProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  const config = getNotificationConfig(notification.type, isDark, colors);

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
        {
          backgroundColor: notification.is_read
            ? colors.card
            : isDark
            ? 'rgba(143, 119, 184, 0.16)'
            : Colors.primary[50],
          borderColor: notification.is_read ? colors.cardBorder : colors.primary,
        },
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
          style={[
            styles.title,
            { color: colors.text },
            !notification.is_read && styles.titleUnread,
          ]}
        >
          {notification.title}
        </Text>
        {notification.body && (
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        <Text style={[styles.time, { color: colors.textTertiary }]}>
          {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {!notification.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.sm,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Layout.radius.sm,
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
    fontFamily: fontFamily.medium,
    marginBottom: 2,
  },
  titleUnread: {
    fontFamily: fontFamily.bold,
  },
  body: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
});
