import { BookingActionCard } from '@/components/chat/BookingActionCard';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { BookingStatus } from '@/lib/supabase';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

type ChatBooking = React.ComponentProps<typeof BookingActionCard>['booking'];

interface Props {
  bookings: ChatBooking[];
  isProvider: boolean;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  isUpdating: boolean;
}

export function BookingActionCarousel({
  bookings,
  isProvider,
  onUpdateStatus,
  isUpdating,
}: Props) {
  const colors = useColors();
  const [index, setIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      setIndex(Math.max(0, Math.min(bookings.length - 1, next)));
    },
    [screenWidth, bookings.length]
  );

  if (bookings.length === 0) return null;

  if (bookings.length === 1) {
    return (
      <BookingActionCard
        booking={bookings[0]}
        isProvider={isProvider}
        onUpdateStatus={onUpdateStatus}
        isUpdating={isUpdating}
      />
    );
  }

  return (
    <View>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={{ width: screenWidth }}>
            <BookingActionCard
              booking={item}
              isProvider={isProvider}
              onUpdateStatus={onUpdateStatus}
              isUpdating={isUpdating}
            />
          </View>
        )}
      />
      <View style={styles.dots}>
        {bookings.map((b, i) => (
          <View
            key={b.id}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === index ? colors.primary : colors.cardBorder,
                width: i === index ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
