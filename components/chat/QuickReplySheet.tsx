/**
 * Bottom sheet de templates de réponse rapide (prestataire)
 */

import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { QuickReplyTemplate, useQuickReplyStore } from '@/stores/quickReplyStore';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Plus, Trash2 } from 'lucide-react-native';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface QuickReplySheetProps {
  onSelectTemplate: (content: string) => void;
}

export const QuickReplySheet = forwardRef<BottomSheetModal, QuickReplySheetProps>(
  function QuickReplySheet({ onSelectTemplate }, ref) {
    const colors = useColors();

    const templates = useQuickReplyStore((state) => state.templates);
    const addTemplate = useQuickReplyStore((state) => state.addTemplate);
    const updateTemplate = useQuickReplyStore((state) => state.updateTemplate);
    const deleteTemplate = useQuickReplyStore((state) => state.deleteTemplate);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftLabel, setDraftLabel] = useState('');
    const [draftContent, setDraftContent] = useState('');

    const snapPoints = useMemo(() => ['55%', '80%'], []);

    const sortedTemplates = useMemo(
      () => [...templates].sort((a, b) => a.order - b.order),
      [templates]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.38}
        />
      ),
      []
    );

    const startEdit = (template: QuickReplyTemplate) => {
      setEditingId(template.id);
      setDraftLabel(template.label);
      setDraftContent(template.content);
    };

    const cancelEdit = () => {
      setEditingId(null);
      setDraftLabel('');
      setDraftContent('');
    };

    const saveEdit = () => {
      if (!editingId) return;

      const label = draftLabel.trim();
      const content = draftContent.trim();
      if (!label || !content) return;

      updateTemplate(editingId, { label, content });
      cancelEdit();
    };

    const handleAddTemplate = () => {
      const createdLabel = 'Nouveau template';
      const createdContent = 'Écris ton message ici...';

      addTemplate({
        label: createdLabel,
        content: createdContent,
      });
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetView style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Réponses rapides</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Appuie sur un template pour l’insérer dans le message.</Text>
        </BottomSheetView>

        <BottomSheetScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {sortedTemplates.map((template) => {
            const isEditing = editingId === template.id;

            return (
              <Swipeable
                key={template.id}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    onPress={() => deleteTemplate(template.id)}
                    style={({ pressed }) => [
                      styles.deleteAction,
                      {
                        backgroundColor: pressed ? `${colors.error}CC` : colors.error,
                      },
                    ]}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={styles.deleteActionText}>Supprimer</Text>
                  </Pressable>
                )}
              >
                <View
                  style={[
                    styles.templateCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {isEditing ? (
                    <>
                      <TextInput
                        value={draftLabel}
                        onChangeText={setDraftLabel}
                        placeholder="Titre"
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.inputLabel, { color: colors.text, borderColor: colors.border }]}
                      />
                      <TextInput
                        value={draftContent}
                        onChangeText={setDraftContent}
                        placeholder="Contenu"
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        style={[styles.inputContent, { color: colors.text, borderColor: colors.border }]}
                      />

                      <View style={styles.editActions}>
                        <Pressable
                          onPress={cancelEdit}
                          style={({ pressed }) => [
                            styles.secondaryAction,
                            {
                              borderColor: colors.border,
                              backgroundColor: pressed ? `${colors.primary}12` : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>Annuler</Text>
                        </Pressable>
                        <Pressable
                          onPress={saveEdit}
                          style={({ pressed }) => [
                            styles.primaryAction,
                            {
                              backgroundColor: pressed ? `${colors.primary}D9` : colors.primary,
                            },
                          ]}
                        >
                          <Text style={styles.primaryActionText}>Enregistrer</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      <Pressable onPress={() => onSelectTemplate(template.content)}>
                        <Text style={[styles.templateLabel, { color: colors.text }]}>{template.label}</Text>
                        <Text style={[styles.templateContent, { color: colors.textSecondary }]} numberOfLines={3}>
                          {template.content}
                        </Text>
                      </Pressable>

                      <View style={styles.rowActions}>
                        <Pressable
                          onPress={() => startEdit(template)}
                          style={({ pressed }) => [
                            styles.editButton,
                            {
                              borderColor: colors.border,
                              backgroundColor: pressed ? `${colors.primary}12` : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[styles.editButtonText, { color: colors.primary }]}>Modifier</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              </Swipeable>
            );
          })}

          <Pressable
            onPress={handleAddTemplate}
            style={({ pressed }) => [
              styles.addButton,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? `${colors.primary}16` : 'transparent',
              },
            ]}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Nouveau template</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: Layout.fontSize.sm,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    gap: Layout.spacing.sm,
  },
  templateCard: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  templateLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  templateContent: {
    fontSize: Layout.fontSize.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  rowActions: {
    marginTop: Layout.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    borderWidth: 1,
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  deleteAction: {
    width: 106,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginLeft: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
  },
  addButton: {
    marginTop: Layout.spacing.xs,
    borderWidth: 1,
    borderRadius: Layout.radius.full,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  addButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  inputLabel: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  inputContent: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    marginTop: Layout.spacing.sm,
    minHeight: 88,
    paddingHorizontal: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    textAlignVertical: 'top',
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  primaryAction: {
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 8,
  },
  secondaryActionText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
