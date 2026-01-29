import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { useHaptics } from '@/hooks/useHaptics';

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

const toastConfig: Record<
  ToastType,
  { icon: React.ComponentType<any>; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    color: Colors.success.DEFAULT,
    bg: Colors.success.light,
  },
  error: {
    icon: AlertCircle,
    color: Colors.error.DEFAULT,
    bg: Colors.error.light,
  },
  warning: {
    icon: AlertTriangle,
    color: Colors.warning.DEFAULT,
    bg: Colors.warning.light,
  },
  info: {
    icon: Info,
    color: Colors.primary.DEFAULT,
    bg: Colors.primary[50],
  },
};

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
        { backgroundColor: config.bg },
        Shadows.lg,
      ]}
    >
      <View style={styles.iconContainer}>
        <IconComponent size={24} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      {action && (
        <Pressable style={styles.actionButton} onPress={action.onPress}>
          <Text style={[styles.actionText, { color: config.color }]}>
            {action.label}
          </Text>
        </Pressable>
      )}

      <Pressable style={styles.closeButton} onPress={onDismiss}>
        <X size={20} color={Colors.gray[500]} />
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
    color: Colors.text.secondary,
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
