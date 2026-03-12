/**
 * Création d'une question
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useCreateQuestion, useForumCategories } from '@/hooks/useForum';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function CreateQuestionScreen() {
  const colors = useColors();
  const { data: categories } = useForumCategories();
  const { mutateAsync: createQuestion, isPending } = useCreateQuestion();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const selectedCategoryName = categories?.find((c) => c.id === selectedCategory)?.name;

  const addTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Entrez un titre pour votre question.');
      return;
    }
    if (!content.trim()) {
      toast.error('Décrivez votre question.');
      return;
    }
    if (!selectedCategory) {
      toast.error('Sélectionnez une catégorie.');
      return;
    }

    try {
      const question = await createQuestion({
        title: title.trim(),
        content: content.trim(),
        category_id: selectedCategory,
        tags,
      });

      toast.success('Votre question a été publiée !');
      router.replace(`/forum/question/${question.id}` as any);
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Impossible de publier la question. Réessayez.');
    }
  };

  const canSubmit = title.trim() && content.trim() && selectedCategory && !isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nouvelle question</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category selector */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Catégorie *</Text>
          <Pressable
            onPress={() => setShowCategories(!showCategories)}
            style={[styles.categorySelector, { backgroundColor: colors.backgroundTertiary }]}
          >
            <Text
              style={[
                styles.categorySelectorText,
                { color: selectedCategoryName ? colors.text : colors.textTertiary },
              ]}
            >
              {selectedCategoryName || 'Sélectionner une catégorie'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </Pressable>

          {showCategories && (
            <View style={[styles.categoryDropdown, { backgroundColor: colors.card }]}>
              {categories?.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setShowCategories(false);
                  }}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category.id && { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      { color: selectedCategory === category.id ? colors.primary : colors.text },
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
            placeholder="Résumez votre question en une phrase"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {title.length}/200
          </Text>
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: colors.text, backgroundColor: colors.backgroundTertiary },
            ]}
            placeholder="Décrivez votre question en détail..."
            placeholderTextColor={colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={5000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {content.length}/5000
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Tags (optionnel)</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                <Pressable onPress={() => removeTag(tag)}>
                  <X size={14} color={colors.primary} />
                </Pressable>
              </View>
            ))}
          </View>
          {tags.length < 5 && (
            <View style={styles.tagInputRow}>
              <TextInput
                style={[
                  styles.tagInput,
                  { color: colors.text, backgroundColor: colors.backgroundTertiary },
                ]}
                placeholder="Ajouter un tag"
                placeholderTextColor={colors.textTertiary}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                maxLength={20}
              />
              <Button title="Ajouter" variant="outline" size="sm" onPress={addTag} />
            </View>
          )}
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Max 5 tags. Utilisez des mots-clés simples.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Button
          title={isPending ? '' : 'Publier la question'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!canSubmit}
          icon={isPending ? <ActivityIndicator size="small" color={Colors.white} /> : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.lg,
  },
  field: {
    gap: Layout.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: 15,
  },
  textArea: {
    minHeight: 150,
    paddingTop: Layout.spacing.md,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  categorySelectorText: {
    fontSize: 15,
  },
  categoryDropdown: {
    borderRadius: Layout.radius.md,
    marginTop: Layout.spacing.xs,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  categoryOptionText: {
    fontSize: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.sm,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.xs,
  },
  tagInput: {
    flex: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
  },
  footer: {
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
  },
});
