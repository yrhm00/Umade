import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useChatStore } from '@/stores/chatStore';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface ChatInputProps {
  conversationId: string;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ conversationId, onSend, disabled }: ChatInputProps) {
  const { getDraft, setDraft, clearDraft } = useChatStore();
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
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChangeText}
          placeholder="Votre message..."
          placeholderTextColor={Colors.gray[400]}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, canSend && styles.sendButtonActive]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Send size={22} color={canSend ? Colors.white : Colors.gray[400]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    gap: Layout.spacing.sm,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    maxHeight: 120,
  },
  input: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
});
