/**
 * Chat Input Component
 * Dark Mode Support
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useChatStore } from '@/stores/chatStore';
import { Send } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChatInputProps {
  conversationId: string;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ conversationId, onSend, disabled }: ChatInputProps) {
  const { getDraft, setDraft, clearDraft } = useChatStore();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [text, setText] = useState(getDraft(conversationId));

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);
      setDraft(conversationId, value);
    },
    [conversationId, setDraft]
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText('');
    clearDraft(conversationId);
  }, [text, disabled, onSend, conversationId, clearDraft]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <View style={[styles.inputContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={text}
          onChangeText={handleChangeText}
          placeholder="Votre message..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: colors.backgroundTertiary },
          canSend && { backgroundColor: colors.primary },
        ]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Send size={22} color={canSend ? Colors.white : colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    gap: Layout.spacing.sm,
  },
  inputContainer: {
    flex: 1,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    maxHeight: 120,
  },
  input: {
    fontSize: Layout.fontSize.md,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
