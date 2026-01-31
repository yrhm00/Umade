/**
 * Page des avis pour le provider
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { useProviderStats } from '@/hooks/useProviderStats';
import { useAddProviderResponse, useProviderReviews, useProviderReviewStats } from '@/hooks/useReviews';
import { ReviewWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Reply, Star, User, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderReviewsScreen() {
    const router = useRouter();

    // Get provider ID from stats hook
    const { data: stats } = useProviderStats();
    const providerId = stats?.providerId;

    const {
        data: reviewsPages,
        isLoading,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useProviderReviews(providerId || '');

    const { data: reviewStats, isLoading: statsLoading } = useProviderReviewStats(providerId || '');
    const { mutate: addResponse, isPending: isSubmitting } = useAddProviderResponse();

    // State for reply modal
    const [selectedReview, setSelectedReview] = useState<ReviewWithDetails | null>(null);
    const [responseText, setResponseText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const reviews = useMemo(() => {
        return reviewsPages?.pages.flat() || [];
    }, [reviewsPages]);

    const handleOpenReplyModal = (review: ReviewWithDetails) => {
        setSelectedReview(review);
        setResponseText('');
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedReview(null);
        setResponseText('');
    };

    const handleSubmitResponse = () => {
        if (!selectedReview || !responseText.trim()) return;

        addResponse(
            { reviewId: selectedReview.id, response: responseText.trim() },
            {
                onSuccess: () => {
                    handleCloseModal();
                },
            }
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        color={star <= rating ? Colors.warning.DEFAULT : Colors.gray[300]}
                        fill={star <= rating ? Colors.warning.DEFAULT : 'transparent'}
                    />
                ))}
            </View>
        );
    };

    const renderRatingDistribution = () => {
        if (!reviewStats) return null;

        const total = reviewStats.total_count;
        if (total === 0) return null;

        return (
            <View style={styles.distributionContainer}>
                {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.distribution[rating as 1 | 2 | 3 | 4 | 5];
                    const percentage = (count / total) * 100;

                    return (
                        <View key={rating} style={styles.distributionRow}>
                            <Text style={styles.distributionLabel}>{rating}</Text>
                            <Star size={12} color={Colors.warning.DEFAULT} fill={Colors.warning.DEFAULT} />
                            <View style={styles.distributionBarBg}>
                                <View
                                    style={[
                                        styles.distributionBarFill,
                                        { width: `${percentage}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.distributionCount}>{count}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderReview = ({ item: review }: { item: ReviewWithDetails }) => {
        const clientName = review.client?.full_name || 'Client anonyme';
        const serviceName = review.booking?.service?.name || 'Service';

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.clientInfo}>
                        {review.client?.avatar_url ? (
                            <Image
                                source={{ uri: review.client.avatar_url }}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={20} color={Colors.gray[400]} />
                            </View>
                        )}
                        <View style={styles.clientDetails}>
                            <Text style={styles.clientName}>{clientName}</Text>
                            <Text style={styles.serviceName}>{serviceName}</Text>
                        </View>
                    </View>
                    <View style={styles.ratingDate}>
                        {renderStars(review.rating)}
                        <Text style={styles.reviewDate}>
                            {review.created_at ? formatDate(review.created_at) : ''}
                        </Text>
                    </View>
                </View>

                {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                )}

                {review.provider_response ? (
                    <View style={styles.responseContainer}>
                        <View style={styles.responseHeader}>
                            <MessageSquare size={14} color={Colors.primary.DEFAULT} />
                            <Text style={styles.responseLabel}>Votre réponse</Text>
                        </View>
                        <Text style={styles.responseText}>{review.provider_response}</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => handleOpenReplyModal(review)}
                    >
                        <Reply size={16} color={Colors.primary.DEFAULT} />
                        <Text style={styles.replyButtonText}>Répondre à cet avis</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.statsSection}>
            <View style={styles.overallRating}>
                <Text style={styles.ratingValue}>
                    {reviewStats?.average_rating?.toFixed(1) || '-'}
                </Text>
                <View style={styles.ratingDetails}>
                    {renderStars(Math.round(reviewStats?.average_rating ?? 0))}
                    <Text style={styles.totalReviews}>
                        {reviewStats?.total_count || 0} avis au total
                    </Text>
                </View>
            </View>
            {renderRatingDistribution()}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Star size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun avis</Text>
            <Text style={styles.emptySubtitle}>
                Les avis de vos clients apparaîtront ici
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <LoadingSpinner size="small" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Avis clients</Text>
                <View style={styles.placeholder} />
            </View>

            {isLoading || statsLoading ? (
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                            tintColor={Colors.primary.DEFAULT}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Reply Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={handleCloseModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={handleCloseModal}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Répondre à l'avis</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={handleCloseModal}
                            >
                                <X size={18} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Review Preview */}
                        {selectedReview && (
                            <View style={styles.reviewPreview}>
                                <View style={styles.reviewPreviewHeader}>
                                    {renderStars(selectedReview.rating)}
                                    <Text style={styles.reviewPreviewName}>
                                        {selectedReview.client?.full_name || 'Client'}
                                    </Text>
                                </View>
                                {selectedReview.comment && (
                                    <Text style={styles.reviewPreviewComment} numberOfLines={3}>
                                        {selectedReview.comment}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Response Input */}
                        <TextInput
                            style={styles.responseInput}
                            placeholder="Écrivez votre réponse..."
                            placeholderTextColor={Colors.text.tertiary}
                            value={responseText}
                            onChangeText={setResponseText}
                            multiline
                            textAlignVertical="top"
                            autoFocus
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!responseText.trim() || isSubmitting) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmitResponse}
                            disabled={!responseText.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <LoadingSpinner size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>Envoyer la réponse</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    statsSection: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    overallRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingValue: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.text.primary,
        marginRight: 16,
    },
    ratingDetails: {
        flex: 1,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,
    },
    totalReviews: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    distributionContainer: {
        gap: 8,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    distributionLabel: {
        width: 12,
        fontSize: 12,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    distributionBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.gray[100],
        borderRadius: 4,
        overflow: 'hidden',
    },
    distributionBarFill: {
        height: '100%',
        backgroundColor: Colors.warning.DEFAULT,
        borderRadius: 4,
    },
    distributionCount: {
        width: 24,
        fontSize: 12,
        color: Colors.text.secondary,
        textAlign: 'right',
    },
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientDetails: {
        marginLeft: 12,
        flex: 1,
    },
    clientName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    serviceName: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    ratingDate: {
        alignItems: 'flex-end',
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    reviewComment: {
        fontSize: 14,
        color: Colors.text.primary,
        lineHeight: 20,
    },
    responseContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: Colors.primary.DEFAULT + '08',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary.DEFAULT,
    },
    responseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    responseLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary.DEFAULT,
    },
    responseText: {
        fontSize: 13,
        color: Colors.text.secondary,
        lineHeight: 18,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.primary.DEFAULT + '10',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary.DEFAULT + '30',
    },
    replyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary.DEFAULT,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.gray[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewPreview: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    reviewPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewPreviewName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginLeft: 8,
    },
    reviewPreviewComment: {
        fontSize: 13,
        color: Colors.text.secondary,
        lineHeight: 18,
    },
    responseInput: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: Colors.text.primary,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    submitButton: {
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
});
