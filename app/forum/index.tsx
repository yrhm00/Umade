/**
 * Forum - Liste des questions
 */

import { QuestionCard } from '@/components/forum';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useForumCategories, useForumQuestions } from '@/hooks/useForum';
import { ForumFilters, ForumQuestionWithDetails, ForumSortBy } from '@/types/forum';
import { router } from 'expo-router';
import {
  ChevronLeft,
  MessageSquarePlus,
  Search,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

const SORT_OPTIONS: { value: ForumSortBy; label: string }[] = [
  { value: 'recent', label: 'Récent' },
  { value: 'popular', label: 'Populaire' },
  { value: 'unanswered', label: 'Sans réponse' },
  { value: 'solved', label: 'Résolu' },
];

export default function ForumScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<ForumSortBy>('recent');

  const { data: categories } = useForumCategories();

  const filters: ForumFilters = useMemo(
    () => ({
      category_id: selectedCategory,
      search_query: searchQuery.trim() || undefined,
    }),
    [selectedCategory, searchQuery]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useForumQuestions(filters, sortBy);

  const questions = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreateQuestion = useCallback(() => {
    router.push('/forum/create' as any);
  }, []);

  const renderQuestion = useCallback(
    ({ item, index }: { item: ForumQuestionWithDetails; index: number }) => (
      <QuestionCard question={item} index={index} />
    ),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Forum</Text>
        <Pressable onPress={handleCreateQuestion} style={styles.createButton}>
          <MessageSquarePlus size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundTertiary }]}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une question..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <Pressable
          onPress={() => setSelectedCategory(undefined)}
          style={[
            styles.categoryPill,
            { backgroundColor: !selectedCategory ? colors.primary : colors.backgroundTertiary },
          ]}
        >
          <Text
            style={[
              styles.categoryPillText,
              { color: !selectedCategory ? Colors.white : colors.text },
            ]}
          >
            Toutes
          </Text>
        </Pressable>
        {categories?.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryPill,
              {
                backgroundColor:
                  selectedCategory === category.id
                    ? colors.primary
                    : colors.backgroundTertiary,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                {
                  color:
                    selectedCategory === category.id ? Colors.white : colors.text,
                },
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortContainer}
      >
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSortBy(option.value)}
            style={[
              styles.sortPill,
              {
                borderColor:
                  sortBy === option.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sortPillText,
                {
                  color: sortBy === option.value ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Questions list */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucune question
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Soyez le premier à poser une question !
              </Text>
              <Button
                title="Poser une question"
                variant="primary"
                onPress={handleCreateQuestion}
              />
            </View>
          }
        />
      )}
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: Layout.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoriesContainer: {
    paddingLeft: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortContainer: {
    paddingLeft: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  sortPill: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: Layout.spacing.md,
  },
  emptyContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
