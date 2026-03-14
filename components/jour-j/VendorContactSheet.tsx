/**
 * Bottom sheet avec contacts rapides des prestataires liés au Jour J
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { Avatar } from '@/components/ui/Avatar';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors } from '@/hooks/useColors';
import { JourJProvider } from '@/hooks/useJourJ';
import { MessageCircle, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface VendorContactSheetProps {
  vendors: JourJProvider[];
}

export const VendorContactSheet = forwardRef<BottomSheet, VendorContactSheetProps>(
  ({ vendors }, ref) => {
    const colors = useColors();
    const router = useRouter();
    const snapPoints = useMemo(() => ['40%', '70%'], []);

    const handleCall = useCallback((phone: string) => {
      Linking.openURL(`tel:${phone}`);
    }, []);

    const handleMessage = useCallback(
      (conversationId: string | null) => {
        if (conversationId) {
          router.push(`/chat/${conversationId}` as any);
        }
      },
      [router]
    );

    const renderVendor = useCallback(
      ({ item }: { item: JourJProvider }) => (
        <View style={[styles.vendorCard, { borderBottomColor: colors.border }]}>
          <Avatar
            source={item.profiles?.avatar_url}
            name={item.business_name}
            size="md"
          />
          <View style={styles.vendorInfo}>
            <Text style={[styles.vendorName, { color: colors.text }]}>
              {item.business_name}
            </Text>
            {item.profiles?.full_name && (
              <Text style={[styles.vendorContact, { color: colors.textSecondary }]}>
                {item.profiles.full_name}
              </Text>
            )}
          </View>
          <View style={styles.vendorActions}>
            {item.phone && (
              <PressableScale
                scale={0.9}
                haptic="light"
                onPress={() => handleCall(item.phone!)}
                style={[styles.actionButton, { backgroundColor: '#10B98120' }]}
              >
                <Phone size={18} color="#10B981" />
              </PressableScale>
            )}
            {item.conversationId && (
              <PressableScale
                scale={0.9}
                haptic="light"
                onPress={() => handleMessage(item.conversationId)}
                style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
              >
                <MessageCircle size={18} color={colors.primary} />
              </PressableScale>
            )}
          </View>
        </View>
      ),
      [colors, handleCall, handleMessage]
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Contacts prestataires
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {vendors.length} prestataire{vendors.length > 1 ? 's' : ''} lié{vendors.length > 1 ? 's' : ''}
          </Text>
        </View>
        <BottomSheetFlatList
          data={vendors}
          renderItem={renderVendor}
          keyExtractor={(item: JourJProvider) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </BottomSheet>
    );
  }
);

VendorContactSheet.displayName = 'VendorContactSheet';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontFamily: fontFamily.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    gap: Layout.spacing.md,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  vendorContact: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  vendorActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
