import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { useIsDarkTheme } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function Toast({
  visible,
  type = 'info',
  title,
  message,
  duration = 4000,
  onDismiss,
  action,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const isDark = useIsDarkTheme();

  // Dynamic config based on theme
  const toastConfig = {
    success: {
      icon: CheckCircle,
      color: isDark ? '#4ade80' : Colors.success.DEFAULT,
      bg: isDark ? 'rgba(22, 101, 52, 0.95)' : Colors.success.light,
      border: isDark ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
    },
    error: {
      icon: AlertCircle,
      color: isDark ? '#f87171' : Colors.error.DEFAULT,
      bg: isDark ? 'rgba(153, 27, 27, 0.95)' : Colors.error.light,
      border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
    },
    warning: {
      icon: AlertTriangle,
      color: isDark ? '#facc15' : Colors.warning.DEFAULT,
      bg: isDark ? 'rgba(161, 98, 7, 0.95)' : Colors.warning.light,
      border: isDark ? 'rgba(234, 179, 8, 0.3)' : 'transparent',

    },
    info: {
      icon: Info,
      color: isDark ? '#38bdf8' : Colors.primary.DEFAULT,
      bg: isDark ? 'rgba(12, 74, 110, 0.95)' : Colors.primary[50],
      border: isDark ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
    },
  };

  const config = toastConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    if (visible) {
      // Haptic feedback based on type
      if (type === 'success') haptics.success();
      else if (type === 'error') haptics.error();
      else if (type === 'warning') haptics.warning();
      else haptics.light();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, type, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15)}
      exiting={SlideOutUp.springify().damping(15)}
      style={[
        styles.container,
        { marginTop: insets.top + Layout.spacing.sm },
        { backgroundColor: config.bg, borderColor: config.border, borderWidth: isDark ? 1 : 0 },
        Shadows.lg,
      ]}
    >
      <View style={styles.iconContainer}>
        <IconComponent size={24} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        {message && <Text style={[styles.message, { color: config.color, opacity: 0.9 }]}>{message}</Text>}
      </View>

      {action && (
        <Pressable style={styles.actionButton} onPress={action.onPress}>
          <Text style={[styles.actionText, { color: config.color }]}>
            {action.label}
          </Text>
        </Pressable>
      )}

      <Pressable style={styles.closeButton} onPress={onDismiss}>
        <X size={20} color={config.color} style={{ opacity: 0.6 }} />
      </Pressable>
    </Animated.View>
  );
}

// Toast manager hook for showing toasts
interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
  });

  const show = React.useCallback(
    (
      type: ToastType,
      title: string,
      options?: {
        message?: string;
        duration?: number;
        action?: { label: string; onPress: () => void };
      }
    ) => {
      setState({
        visible: true,
        type,
        title,
        message: options?.message,
        duration: options?.duration,
        action: options?.action,
      });
    },
    []
  );

  const hide = React.useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const success = React.useCallback(
    (title: string, options?: Parameters<typeof show>[2]) => {
      show('success', title, options);
    },
    [show]
  );

  const error = React.useCallback(
    (title: string, options?: Parameters<typeof show>[2]) => {
      show('error', title, options);
    },
    [show]
  );

  const warning = React.useCallback(
    (title: string, options?: Parameters<typeof show>[2]) => {
      show('warning', title, options);
    },
    [show]
  );

  const info = React.useCallback(
    (title: string, options?: Parameters<typeof show>[2]) => {
      show('info', title, options);
    },
    [show]
  );

  return {
    state,
    show,
    hide,
    success,
    error,
    warning,
    info,
    ToastComponent: () => <Toast {...state} onDismiss={hide} />,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    zIndex: 9999,
  },
  iconContainer: {
    marginRight: Layout.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  message: {
    fontSize: Layout.fontSize.sm,
    marginTop: 2,
  },
  actionButton: {
    marginLeft: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  actionText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  closeButton: {
    padding: Layout.spacing.xs,
    marginLeft: Layout.spacing.xs,
  },
});
