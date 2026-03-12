/**
 * Écran Plan de Table Interactif
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Plus,
  Users,
  Circle,
  Square,
  RectangleHorizontal,
  Trash2,
  Wand2,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useTables,
  useTablesWithGuests,
  useUnassignedGuests,
  useCreateTable,
  useUpdateTable,
  useUpdateTablePosition,
  useDeleteTable,
  useAutoAssignGuests,
  useSeatingRoomLayout,
  useUpsertSeatingRoomLayout,
  useAutoLayoutTables,
  normalizeTableCoordinates,
  getDefaultSeatingRoomLayout,
} from '@/hooks/useSeatingPlan';
import { useAssignGuestToTable } from '@/hooks/useGuests';
import {
  Table,
  TableWithGuests,
  Guest,
  TableShape,
  SeatingRoomShape,
  SeatingLayoutPresetId,
  SEATING_LAYOUT_PRESETS,
} from '@/types/eventFeatures';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_CANVAS_WIDTH = SCREEN_WIDTH - Layout.spacing.lg * 2 - Layout.spacing.md * 2;
const MIN_CANVAS_HEIGHT = 300;
const MAX_CANVAS_HEIGHT = 560;
const ROOM_COORDINATE_MARGIN_M = 0.5;

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseDecimalInput = (value: string, fallback: number) => {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

function BrandLogoMark({ size = 28, subtle = false }: { size?: number; subtle?: boolean }) {
  const fontSize = Math.max(14, size * 0.62);
  return (
    <View
      style={[
        styles.brandLogoMark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: subtle ? 0.18 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={['#6B49FF', '#B455F3', '#E26DDE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brandLogoGradient}
      >
        <Text style={[styles.brandLogoText, { fontSize, lineHeight: fontSize * 1.02 }]}>U</Text>
      </LinearGradient>
    </View>
  );
}

// Composant Table Draggable
function DraggableTable({
  table,
  colors,
  onPositionChange,
  onSelect,
  isSelected,
  canvasWidth,
  canvasHeight,
  roomWidth,
  roomHeight,
  roomShape,
}: {
  table: TableWithGuests;
  colors: any;
  onPositionChange: (x: number, y: number) => void;
  onSelect: () => void;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  roomWidth: number;
  roomHeight: number;
  roomShape: SeatingRoomShape;
}) {
  const getTableShape = () => {
    const size = 74;
    switch (table.shape) {
      case 'round':
        return { width: size, height: size, borderRadius: size / 2 };
      case 'square':
        return { width: size, height: size, borderRadius: 10 };
      case 'rectangular':
        return { width: size * 1.55, height: size, borderRadius: 10 };
      default:
        return { width: size, height: size, borderRadius: size / 2 };
    }
  };

  const shapeStyle = getTableShape();
  const maxTranslateX = Math.max(0, canvasWidth - shapeStyle.width);
  const maxTranslateY = Math.max(0, canvasHeight - shapeStyle.height);

  const toCanvasX = useCallback(
    (roomX: number) => {
      const ratio = roomX / Math.max(roomWidth, 0.0001);
      return clampValue(ratio * canvasWidth, 0, maxTranslateX);
    },
    [roomWidth, canvasWidth, maxTranslateX]
  );

  const toCanvasY = useCallback(
    (roomY: number) => {
      const ratio = roomY / Math.max(roomHeight, 0.0001);
      return clampValue(ratio * canvasHeight, 0, maxTranslateY);
    },
    [roomHeight, canvasHeight, maxTranslateY]
  );

  const constrainToRoom = (rawX: number, rawY: number) => {
    'worklet';

    const boundedX = Math.max(0, Math.min(maxTranslateX, rawX));
    const boundedY = Math.max(0, Math.min(maxTranslateY, rawY));

    if (roomShape !== 'l_shape') {
      return { x: boundedX, y: boundedY };
    }

    const mainMaxX = Math.max(0, canvasWidth * 0.62 - shapeStyle.width);
    const wingMinX = Math.min(maxTranslateX, Math.max(0, canvasWidth * 0.62));
    const wingTop = Math.max(0, canvasHeight * 0.52);
    const wingExists = wingMinX <= maxTranslateX && wingTop <= maxTranslateY;

    const isInMain = boundedX <= mainMaxX + 0.001;
    const isInWing = wingExists && boundedX >= wingMinX - 0.001 && boundedY >= wingTop - 0.001;
    if (isInMain || isInWing) {
      return { x: boundedX, y: boundedY };
    }

    const mainCandidate = {
      x: Math.max(0, Math.min(mainMaxX, boundedX)),
      y: Math.max(0, Math.min(maxTranslateY, boundedY)),
    };

    if (!wingExists) {
      return mainCandidate;
    }

    const wingCandidate = {
      x: Math.max(wingMinX, Math.min(maxTranslateX, boundedX)),
      y: Math.max(wingTop, Math.min(maxTranslateY, boundedY)),
    };

    const mainDist =
      (mainCandidate.x - boundedX) * (mainCandidate.x - boundedX) +
      (mainCandidate.y - boundedY) * (mainCandidate.y - boundedY);
    const wingDist =
      (wingCandidate.x - boundedX) * (wingCandidate.x - boundedX) +
      (wingCandidate.y - boundedY) * (wingCandidate.y - boundedY);

    return mainDist <= wingDist ? mainCandidate : wingCandidate;
  };

  const initialPosition = constrainToRoom(toCanvasX(table.position_x), toCanvasY(table.position_y));
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const startX = useSharedValue(initialPosition.x);
  const startY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);

  useEffect(() => {
    const constrained = constrainToRoom(toCanvasX(table.position_x), toCanvasY(table.position_y));
    translateX.value = constrained.x;
    translateY.value = constrained.y;
  }, [table.position_x, table.position_y, roomShape, canvasWidth, canvasHeight, toCanvasX, toCanvasY, translateX, translateY]);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const triggerMediumHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withTiming(1.04, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
      runOnJS(triggerLightHaptic)();
    })
    .onUpdate((event) => {
      const constrained = constrainToRoom(startX.value + event.translationX, startY.value + event.translationY);
      translateX.value = constrained.x;
      translateY.value = constrained.y;
    })
    .onEnd(() => {
      scale.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      const constrained = constrainToRoom(translateX.value, translateY.value);
      const roomX = Math.max(
        ROOM_COORDINATE_MARGIN_M,
        Math.min(
          roomWidth - ROOM_COORDINATE_MARGIN_M,
          (constrained.x / Math.max(canvasWidth, 0.0001)) * roomWidth
        )
      );
      const roomY = Math.max(
        ROOM_COORDINATE_MARGIN_M,
        Math.min(
          roomHeight - ROOM_COORDINATE_MARGIN_M,
          (constrained.y / Math.max(canvasHeight, 0.0001)) * roomHeight
        )
      );
      runOnJS(onPositionChange)(roomX, roomY);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)();
    runOnJS(triggerMediumHaptic)();
  });

  const composedGestures = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const isFull = table.available_seats === 0;
  const occupancy = table.guests.length / table.capacity;

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View
        style={[
          styles.table,
          shapeStyle,
          {
            backgroundColor: isFull ? '#10B98130' : `${colors.primary}30`,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[styles.tableName, { color: colors.text }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.66}
        >
          {table.name}
        </Text>
        <Text style={[styles.tableCount, { color: colors.textSecondary }]}>
          {table.guests.length}/{table.capacity}
        </Text>
        {/* Progress indicator */}
        <View style={[styles.occupancyBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.occupancyFill,
              {
                backgroundColor: isFull ? '#10B981' : colors.primary,
                width: `${occupancy * 100}%`,
              },
            ]}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function RoomPlanOverlay({
  canvasWidth,
  canvasHeight,
  roomShape,
  colors,
}: {
  canvasWidth: number;
  canvasHeight: number;
  roomShape: SeatingRoomShape;
  colors: any;
}) {
  const baseFill = `${colors.primary}10`;
  const baseBorder = `${colors.primary}55`;
  const gridColor = `${colors.primary}26`;
  const watermarkSize = Math.min(canvasWidth, canvasHeight) * 0.34;
  const watermarkLeft = (canvasWidth - watermarkSize) / 2;
  const watermarkTop = (canvasHeight - watermarkSize) / 2;

  const renderGrid = (zoneWidth: number, zoneHeight: number, left = 0, top = 0) => (
    <View
      style={[
        styles.roomGrid,
        {
          width: zoneWidth,
          height: zoneHeight,
          left,
          top,
        },
      ]}
    >
      {[0.25, 0.5, 0.75].map((ratio) => (
        <View
          key={`v-${left}-${top}-${ratio}`}
          style={[
            styles.roomGridLineV,
            {
              left: zoneWidth * ratio,
              backgroundColor: gridColor,
            },
          ]}
        />
      ))}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <View
          key={`h-${left}-${top}-${ratio}`}
          style={[
            styles.roomGridLineH,
            {
              top: zoneHeight * ratio,
              backgroundColor: gridColor,
            },
          ]}
        />
      ))}
    </View>
  );

  if (roomShape === 'l_shape') {
    const mainWidth = canvasWidth * 0.62;
    const wingWidth = canvasWidth * 0.38;
    const wingHeight = canvasHeight * 0.48;
    const wingTop = canvasHeight * 0.52;

    return (
      <View pointerEvents="none" style={styles.roomOverlay}>
        <View
          style={[
            styles.roomWatermark,
            {
              left: watermarkLeft,
              top: watermarkTop,
              width: watermarkSize,
              height: watermarkSize,
            },
          ]}
        >
          <BrandLogoMark size={watermarkSize} subtle />
        </View>

        <View
          style={[
            styles.roomZone,
            {
              width: mainWidth,
              height: canvasHeight,
              left: 0,
              top: 0,
              backgroundColor: baseFill,
              borderColor: baseBorder,
            },
          ]}
        />
        {renderGrid(mainWidth, canvasHeight, 0, 0)}

        <View
          style={[
            styles.roomZone,
            {
              width: wingWidth,
              height: wingHeight,
              left: mainWidth,
              top: wingTop,
              backgroundColor: baseFill,
              borderColor: baseBorder,
            },
          ]}
        />
        {renderGrid(wingWidth, wingHeight, mainWidth, wingTop)}
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.roomOverlay}>
      <View
        style={[
          styles.roomWatermark,
          {
            left: watermarkLeft,
            top: watermarkTop,
            width: watermarkSize,
            height: watermarkSize,
          },
        ]}
      >
        <BrandLogoMark size={watermarkSize} subtle />
      </View>

      <View
        style={[
          styles.roomZone,
          {
            width: canvasWidth,
            height: canvasHeight,
            left: 0,
            top: 0,
            backgroundColor: baseFill,
            borderColor: baseBorder,
          },
        ]}
      />
      {renderGrid(canvasWidth, canvasHeight, 0, 0)}
    </View>
  );
}

export default function SeatingScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: tables = [], isLoading } = useTables(eventId);
  const { data: tablesWithGuests = [] } = useTablesWithGuests(eventId);
  const { data: unassignedGuests = [] } = useUnassignedGuests(eventId);
  const { data: roomLayout } = useSeatingRoomLayout(eventId);
  const { mutate: createTable, isPending: isCreating } = useCreateTable();
  const { mutate: updateTable, isPending: isUpdatingTable } = useUpdateTable();
  const { mutate: updatePosition } = useUpdateTablePosition();
  const { mutate: deleteTable } = useDeleteTable();
  const { mutate: autoAssign, isPending: isAutoAssigning } = useAutoAssignGuests();
  const { mutateAsync: saveRoomLayout, isPending: isSavingRoomLayout } = useUpsertSeatingRoomLayout();
  const { mutateAsync: autoLayoutTables, isPending: isAutoLayouting } = useAutoLayoutTables();
  const { mutate: assignGuest } = useAssignGuestToTable();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [tableNameDraft, setTableNameDraft] = useState('');
  const [newTable, setNewTable] = useState({
    name: '',
    shape: 'round' as TableShape,
    capacity: '8',
  });
  const [layoutDraft, setLayoutDraft] = useState<{
    preset_id: SeatingLayoutPresetId;
    room_shape: SeatingRoomShape;
    width_m: string;
    height_m: string;
    aisle_m: string;
  }>({
    preset_id: 'classique',
    room_shape: 'square',
    width_m: '12',
    height_m: '12',
    aisle_m: '1.6',
  });

  const activeRoomLayout = useMemo(
    () => roomLayout || getDefaultSeatingRoomLayout(eventId || ''),
    [eventId, roomLayout]
  );
  const roomSurface = Math.round(activeRoomLayout.width_m * activeRoomLayout.height_m);
  const roomRatio = activeRoomLayout.width_m / Math.max(activeRoomLayout.height_m, 0.0001);
  const canvasWidth = Math.max(220, BASE_CANVAS_WIDTH);
  const canvasHeight = clampValue(canvasWidth / roomRatio, MIN_CANVAS_HEIGHT, MAX_CANVAS_HEIGHT);
  const roomShapeLabel =
    activeRoomLayout.room_shape === 'square'
      ? 'Carre'
      : activeRoomLayout.room_shape === 'l_shape'
        ? 'En L'
        : 'Rectangle';
  const draftPreview = useMemo(() => {
    const width = clampValue(parseDecimalInput(layoutDraft.width_m, activeRoomLayout.width_m), 6, 80);
    const height = clampValue(parseDecimalInput(layoutDraft.height_m, activeRoomLayout.height_m), 6, 80);
    if (layoutDraft.room_shape === 'square') {
      const side = Math.max(width, height);
      return {
        width,
        height,
        renderedWidth: side,
        renderedHeight: side,
      };
    }
    return {
      width,
      height,
      renderedWidth: width,
      renderedHeight: height,
    };
  }, [layoutDraft.width_m, layoutDraft.height_m, layoutDraft.room_shape, activeRoomLayout.width_m, activeRoomLayout.height_m]);

  const visibleTables = useMemo(() => {
    const withGuestsById = new Map(tablesWithGuests.map((table) => [table.id, table]));
    return tables.map((table) => {
      const withGuests = withGuestsById.get(table.id);
      if (withGuests) return withGuests;
      return {
        ...table,
        guests: [],
        available_seats: table.capacity,
      };
    });
  }, [tables, tablesWithGuests]);

  const positionedTables = useMemo(
    () =>
      visibleTables.map((table) => {
        const normalized = normalizeTableCoordinates(table, activeRoomLayout);
        return {
          ...table,
          position_x: normalized.x,
          position_y: normalized.y,
        };
      }),
    [visibleTables, activeRoomLayout]
  );

  const selectedTable = useMemo(
    () => positionedTables.find((table) => table.id === selectedTableId) || null,
    [positionedTables, selectedTableId]
  );

  useEffect(() => {
    if (!selectedTableId) return;
    const stillExists = positionedTables.some((table) => table.id === selectedTableId);
    if (!stillExists) {
      setSelectedTableId(null);
    }
  }, [selectedTableId, positionedTables]);

  useEffect(() => {
    if (!selectedTable) {
      setIsEditingTableName(false);
      setTableNameDraft('');
      return;
    }

    setTableNameDraft(selectedTable.name);
    setIsEditingTableName(false);
  }, [selectedTable?.id, selectedTable?.name]);

  useEffect(() => {
    setLayoutDraft({
      preset_id: activeRoomLayout.preset_id,
      room_shape: activeRoomLayout.room_shape,
      width_m: String(activeRoomLayout.width_m),
      height_m: String(activeRoomLayout.height_m),
      aisle_m: String(activeRoomLayout.aisle_m),
    });
  }, [
    activeRoomLayout.preset_id,
    activeRoomLayout.room_shape,
    activeRoomLayout.width_m,
    activeRoomLayout.height_m,
    activeRoomLayout.aisle_m,
  ]);

  const handleResetToClassicSquare = useCallback(() => {
    const classicPreset =
      SEATING_LAYOUT_PRESETS.find((preset) => preset.id === 'classique') || SEATING_LAYOUT_PRESETS[0];

    setLayoutDraft({
      preset_id: 'classique',
      room_shape: 'square',
      width_m: String(classicPreset?.width_m ?? 12),
      height_m: String(classicPreset?.height_m ?? 12),
      aisle_m: String(classicPreset?.aisle_m ?? 1.6),
    });
  }, []);

  const handleApplyRoomLayout = useCallback(async () => {
    if (!eventId) return;

    const selectedPreset =
      SEATING_LAYOUT_PRESETS.find((preset) => preset.id === layoutDraft.preset_id) ||
      SEATING_LAYOUT_PRESETS.find((preset) => preset.id === 'custom') ||
      SEATING_LAYOUT_PRESETS[0];

    const roomShape: SeatingRoomShape =
      layoutDraft.room_shape === 'square' || layoutDraft.room_shape === 'l_shape'
        ? layoutDraft.room_shape
        : 'rectangle';

    let width = clampValue(
      parseDecimalInput(layoutDraft.width_m, selectedPreset.width_m),
      6,
      80
    );
    let height = clampValue(
      parseDecimalInput(layoutDraft.height_m, selectedPreset.height_m),
      6,
      80
    );
    const aisle = clampValue(
      parseDecimalInput(layoutDraft.aisle_m, selectedPreset.aisle_m),
      0.6,
      Math.min(4, Math.max(0.8, Math.min(width, height) / 2 - 0.4))
    );

    const presetId: SeatingLayoutPresetId = roomShape === 'square' && Math.abs(width - height) <= 0.01
      ? 'classique'
      : 'custom';

    if (roomShape === 'square') {
      const side = Math.max(width, height);
      width = side;
      height = side;
    }

    const payload = {
      event_id: eventId,
      preset_id: presetId,
      room_shape: roomShape,
      width_m: width,
      height_m: height,
      aisle_m: aisle,
    };

    try {
      const savedLayout = await saveRoomLayout(payload);
      const autoLayoutResult = await autoLayoutTables({
        eventId,
        layout: savedLayout,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(`Plan de salle mis a jour — ${Math.round(savedLayout.width_m * savedLayout.height_m)} m2 · ${autoLayoutResult.moved}/${autoLayoutResult.total} table(s) repositionnee(s).`);
      setShowLayoutEditor(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Impossible de mettre a jour le plan de salle.';
      if (message.includes('ROOM_LAYOUT_TABLE_MISSING')) {
        toast.error("Migration Supabase requise — La table event_room_layouts est absente.");
        return;
      }
      toast.error('Impossible de mettre a jour le plan de salle.');
    }
  }, [eventId, layoutDraft, saveRoomLayout, autoLayoutTables]);

  const handleCreateTable = useCallback(() => {
    if (!newTable.name) {
      toast.error('Veuillez donner un nom à la table.');
      return;
    }

    createTable(
      {
        event_id: eventId!,
        name: newTable.name,
        shape: newTable.shape,
        capacity: parseInt(newTable.capacity) || 8,
        position_x:
          Math.random() *
            Math.max(1, activeRoomLayout.width_m - ROOM_COORDINATE_MARGIN_M * 2) +
          ROOM_COORDINATE_MARGIN_M,
        position_y:
          Math.random() *
            Math.max(1, activeRoomLayout.height_m - ROOM_COORDINATE_MARGIN_M * 2) +
          ROOM_COORDINATE_MARGIN_M,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNewTable({ name: '', shape: 'round', capacity: '8' });
          setShowAddForm(false);
        },
      }
    );
  }, [newTable, eventId, createTable, activeRoomLayout.width_m, activeRoomLayout.height_m]);

  const handlePositionChange = useCallback(
    (tableId: string, x: number, y: number) => {
      updatePosition({ id: tableId, eventId: eventId!, x, y });
    },
    [eventId, updatePosition]
  );

  const handleDeleteTable = useCallback(
    (table: Table) => {
      Alert.alert(
        'Supprimer la table',
        `Supprimer "${table.name}" ? Les invités seront désassignés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              deleteTable({ id: table.id, eventId: eventId! });
              setSelectedTableId(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [eventId, deleteTable]
  );

  const handleRenameTable = useCallback(() => {
    if (!eventId || !selectedTable) return;

    const trimmedName = tableNameDraft.trim();
    if (!trimmedName) {
      toast.error('Le nom de la table ne peut pas etre vide.');
      return;
    }

    if (trimmedName === selectedTable.name) {
      setIsEditingTableName(false);
      return;
    }

    updateTable(
      {
        id: selectedTable.id,
        eventId,
        updates: { name: trimmedName },
      },
      {
        onSuccess: () => {
          setIsEditingTableName(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
        onError: () => {
          toast.error('Impossible de renommer cette table.');
        },
      }
    );
  }, [eventId, selectedTable, tableNameDraft, updateTable]);

  const handleAutoAssign = useCallback(() => {
    Alert.alert(
      'Auto-assignation',
      'Assigner automatiquement les invités (hors refusés) et créer les tables manquantes si nécessaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Assigner',
          onPress: () => {
            autoAssign(
              { eventId: eventId! },
              {
                onSuccess: (result) => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (result.reason === 'no_guests') {
                    toast.warning("Ajoutez des invités ou confirmez des groupes pour lancer l'auto-assignation.");
                    return;
                  }

                  const parts = [`${result.assigned} invité(s) assigné(s)`];
                  if (result.createdTables > 0) {
                    parts.push(`${result.createdTables} table(s) créée(s)`);
                  }
                  if (result.generatedGuests > 0) {
                    parts.push(`${result.generatedGuests} invité(s) généré(s) depuis les groupes`);
                  }

                  toast.success(`${parts.join(' · ')}.`);
                },
              }
            );
          },
        },
      ]
    );
  }, [eventId, autoAssign]);

  const handleAssignGuest = useCallback(
    (guest: Guest, tableId: string) => {
      assignGuest(
        { guestId: guest.id, eventId: eventId!, tableId },
        {
          onSuccess: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }
      );
    },
    [eventId, assignGuest]
  );

  const handleUnassignGuest = useCallback(
    (guest: Guest) => {
      assignGuest(
        { guestId: guest.id, eventId: eventId!, tableId: null },
        {
          onSuccess: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }
      );
    },
    [eventId, assignGuest]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du plan..." />;
  }

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedCount = positionedTables.reduce((sum, t) => sum + t.guests.length, 0);
  const draftPreviewRatio =
    draftPreview.renderedWidth / Math.max(draftPreview.renderedHeight, 0.0001);
  const previewMaxWidth = Math.max(220, BASE_CANVAS_WIDTH - Layout.spacing.lg);
  const previewMaxHeight = 180;
  const draftShapeWidthPx =
    draftPreviewRatio >= 1 ? previewMaxWidth : previewMaxHeight * draftPreviewRatio;
  const draftShapeHeightPx =
    draftPreviewRatio >= 1 ? previewMaxWidth / draftPreviewRatio : previewMaxHeight;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Plan de table',
            headerStyle: { backgroundColor: colors.backgroundSecondary },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <Animated.View
            entering={FadeInDown}
            style={[styles.statsCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{tables.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tables</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalSeats}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Places</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{assignedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Assignés</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{unassignedGuests.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
            </View>
          </Animated.View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setShowAddForm(!showAddForm)}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ajouter table</Text>
            </Pressable>

            <Pressable
              onPress={handleAutoAssign}
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Wand2 size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Auto-assigner</Text>
            </Pressable>
          </View>

          {/* Configuration salle (compact) */}
          <Animated.View
            entering={FadeInDown.delay(50)}
            style={[styles.layoutSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.layoutSummaryHeader}>
              <View style={styles.layoutSummaryLeft}>
                <BrandLogoMark size={30} />
                <View style={styles.layoutSummaryContent}>
                  <Text style={[styles.layoutSummaryTitle, { color: colors.text }]}>
                    Plan de salle {roomShapeLabel.toLowerCase()}
                  </Text>
                  <Text style={[styles.layoutSummaryText, { color: colors.textSecondary }]}>
                    {activeRoomLayout.width_m}m x {activeRoomLayout.height_m}m · {roomSurface} m2
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowLayoutEditor(true)}
                style={[styles.layoutSummaryButton, { backgroundColor: `${colors.primary}16`, borderColor: colors.primary }]}
              >
                <Text style={[styles.layoutSummaryButtonText, { color: colors.primary }]}>
                  Dessiner le plan
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Add Form */}
          {showAddForm && (
            <Animated.View
              entering={FadeInDown}
              style={[styles.addForm, { backgroundColor: colors.card }]}
            >
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Nom de la table (ex: Table 1)"
                placeholderTextColor={colors.textTertiary}
                value={newTable.name}
                onChangeText={(text) => setNewTable({ ...newTable, name: text })}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Forme</Text>
              <View style={styles.shapeSelector}>
                {(['round', 'square', 'rectangular'] as TableShape[]).map((shape) => (
                  <Pressable
                    key={shape}
                    onPress={() => setNewTable({ ...newTable, shape })}
                    style={[
                      styles.shapeOption,
                      { borderColor: colors.border },
                      newTable.shape === shape && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    {shape === 'round' && <Circle size={20} color={newTable.shape === shape ? '#FFFFFF' : colors.text} />}
                    {shape === 'square' && <Square size={20} color={newTable.shape === shape ? '#FFFFFF' : colors.text} />}
                    {shape === 'rectangular' && <RectangleHorizontal size={20} color={newTable.shape === shape ? '#FFFFFF' : colors.text} />}
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.formLabel, { color: colors.text }]}>Capacité</Text>
              <View style={styles.capacitySelector}>
                {['4', '6', '8', '10', '12'].map((cap) => (
                  <Pressable
                    key={cap}
                    onPress={() => setNewTable({ ...newTable, capacity: cap })}
                    style={[
                      styles.capacityOption,
                      { borderColor: colors.border },
                      newTable.capacity === cap && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.capacityText,
                        { color: newTable.capacity === cap ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cap}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <AnimatedButton
                title="Créer la table"
                onPress={handleCreateTable}
                loading={isCreating}
                fullWidth
              />
            </Animated.View>
          )}

          {/* Canvas */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={[styles.canvas, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.canvasTitle, { color: colors.textSecondary }]}>
              Glissez les tables pour les positionner
            </Text>
            <Text style={[styles.canvasScale, { color: colors.textTertiary }]}>
              Echelle: {activeRoomLayout.width_m}m x {activeRoomLayout.height_m}m
            </Text>
            <View style={[styles.canvasArea, { width: canvasWidth, height: canvasHeight }]}>
              <RoomPlanOverlay
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                roomShape={activeRoomLayout.room_shape}
                colors={colors}
              />

              {positionedTables.map((table) => (
                <DraggableTable
                  key={table.id}
                  table={table}
                  colors={colors}
                  onPositionChange={(x, y) => handlePositionChange(table.id, x, y)}
                  onSelect={() => setSelectedTableId(table.id)}
                  isSelected={selectedTable?.id === table.id}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  roomWidth={activeRoomLayout.width_m}
                  roomHeight={activeRoomLayout.height_m}
                  roomShape={activeRoomLayout.room_shape}
                />
              ))}

              {tables.length === 0 && (
                <View style={styles.emptyCanvas}>
                  <Text style={{ fontSize: 48 }}>🪑</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Aucune table créée
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Selected Table Details */}
          {selectedTable && (
            <Animated.View
              entering={FadeInRight}
              style={[styles.detailCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.detailHeader}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {isEditingTableName ? 'Renommer la table' : selectedTable.name}
                </Text>
                <View style={styles.detailHeaderActions}>
                  {!isEditingTableName && (
                    <Pressable
                      onPress={() => setIsEditingTableName(true)}
                      style={[styles.renameTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.renameTriggerText, { color: colors.text }]}>Modifier nom</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleDeleteTable(selectedTable)}
                    style={[styles.deleteBtn, { backgroundColor: `${colors.error}20` }]}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>

              {isEditingTableName && (
                <View style={styles.renameSection}>
                  <TextInput
                    value={tableNameDraft}
                    onChangeText={setTableNameDraft}
                    onSubmitEditing={handleRenameTable}
                    returnKeyType="done"
                    placeholder="Nom de la table"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.renameInput,
                      { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                    ]}
                  />
                  <View style={styles.renameActions}>
                    <Pressable
                      onPress={() => {
                        setIsEditingTableName(false);
                        setTableNameDraft(selectedTable.name);
                      }}
                      style={[styles.renameActionBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <Text style={[styles.renameActionText, { color: colors.textSecondary }]}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleRenameTable}
                      disabled={isUpdatingTable}
                      style={[styles.renameActionBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.renameActionText, { color: '#FFFFFF' }]}>
                        {isUpdatingTable ? '...' : 'Enregistrer'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                {selectedTable.guests.length}/{selectedTable.capacity} places occupées
              </Text>

              {/* Guests at this table */}
              {selectedTable.guests.length > 0 && (
                <View style={styles.guestsList}>
                  {selectedTable.guests.map((guest) => (
                    <View
                      key={guest.id}
                      style={[styles.guestItem, { backgroundColor: colors.background }]}
                    >
                      <User size={16} color={colors.textSecondary} />
                      <Text style={[styles.guestName, { color: colors.text }]}>
                        {guest.first_name} {guest.last_name}
                      </Text>
                      <Pressable onPress={() => handleUnassignGuest(guest)}>
                        <Text style={[styles.removeText, { color: colors.error }]}>Retirer</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Add guest to table */}
              {selectedTable.available_seats > 0 && unassignedGuests.length > 0 && (
                <View style={styles.addGuestSection}>
                  <Text style={[styles.addGuestLabel, { color: colors.textSecondary }]}>
                    Ajouter un invité
                  </Text>
                  {unassignedGuests.slice(0, 5).map((guest) => (
                    <Pressable
                      key={guest.id}
                      onPress={() => handleAssignGuest(guest, selectedTable.id)}
                      style={[styles.unassignedGuest, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.unassignedName, { color: colors.text }]}>
                        {guest.first_name} {guest.last_name}
                      </Text>
                      <ChevronRight size={16} color={colors.textTertiary} />
                    </Pressable>
                  ))}
                  {unassignedGuests.length > 5 && (
                    <Text style={[styles.moreGuests, { color: colors.textTertiary }]}>
                      +{unassignedGuests.length - 5} autres invités
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* Unassigned Guests */}
          {unassignedGuests.length > 0 && !selectedTable && (
            <Animated.View
              entering={FadeInDown.delay(200)}
              style={[styles.unassignedCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.unassignedHeader}>
                <Users size={20} color={colors.primary} />
                <Text style={[styles.unassignedTitle, { color: colors.text }]}>
                  Invités non assignés ({unassignedGuests.length})
                </Text>
              </View>
              <Text style={[styles.unassignedHint, { color: colors.textSecondary }]}>
                Sélectionnez une table pour y assigner des invités
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        <Modal
          visible={showLayoutEditor}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLayoutEditor(false)}
        >
          <View style={styles.editorBackdrop}>
            <Pressable style={styles.editorOverlay} onPress={() => setShowLayoutEditor(false)} />
            <View style={[styles.editorSheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <View style={styles.editorHeader}>
                <Text style={[styles.editorTitle, { color: colors.text }]}>Edition du plan</Text>
                <Pressable onPress={() => setShowLayoutEditor(false)} style={styles.editorCloseBtn}>
                  <Text style={[styles.editorCloseText, { color: colors.textSecondary }]}>Fermer</Text>
                </Pressable>
              </View>

              <Text style={[styles.editorSubtitle, { color: colors.textSecondary }]}>
                Choisis les dimensions puis dessine la forme de la salle.
              </Text>

              <Pressable
                onPress={handleResetToClassicSquare}
                style={[styles.classicResetBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}14` }]}
              >
                <Text style={[styles.classicResetText, { color: colors.primary }]}>
                  Revenir au classique carre (12m x 12m)
                </Text>
              </Pressable>

              <View style={styles.layoutInputsRow}>
                <View style={styles.layoutInputCol}>
                  <Text style={[styles.layoutInputLabel, { color: colors.textSecondary }]}>Largeur (m)</Text>
                  <TextInput
                    value={layoutDraft.width_m}
                    onChangeText={(text) => setLayoutDraft((prev) => ({ ...prev, width_m: text }))}
                    keyboardType="decimal-pad"
                    style={[
                      styles.layoutInput,
                      { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                    ]}
                  />
                </View>
                <View style={styles.layoutInputCol}>
                  <Text style={[styles.layoutInputLabel, { color: colors.textSecondary }]}>Longueur (m)</Text>
                  <TextInput
                    value={layoutDraft.height_m}
                    onChangeText={(text) => setLayoutDraft((prev) => ({ ...prev, height_m: text }))}
                    keyboardType="decimal-pad"
                    style={[
                      styles.layoutInput,
                      { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                    ]}
                  />
                </View>
                <View style={styles.layoutInputCol}>
                  <Text style={[styles.layoutInputLabel, { color: colors.textSecondary }]}>Allee (m)</Text>
                  <TextInput
                    value={layoutDraft.aisle_m}
                    onChangeText={(text) => setLayoutDraft((prev) => ({ ...prev, aisle_m: text }))}
                    keyboardType="decimal-pad"
                    style={[
                      styles.layoutInput,
                      { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.roomShapeRow}>
                {([
                  { id: 'rectangle', label: 'Rectangle' },
                  { id: 'square', label: 'Carre' },
                  { id: 'l_shape', label: 'En L' },
                ] as { id: SeatingRoomShape; label: string }[]).map((shapeOption) => {
                  const selected = layoutDraft.room_shape === shapeOption.id;
                  return (
                    <Pressable
                      key={shapeOption.id}
                      onPress={() => setLayoutDraft((prev) => ({ ...prev, room_shape: shapeOption.id }))}
                      style={[
                        styles.roomShapeOption,
                        { borderColor: colors.border },
                        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roomShapeText,
                          { color: selected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {shapeOption.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.editorPreview, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.editorShapeContainer,
                    {
                      width: draftShapeWidthPx,
                      height: draftShapeHeightPx,
                    },
                  ]}
                >
                  {layoutDraft.room_shape === 'l_shape' ? (
                    <>
                      <View
                        style={[
                          styles.editorShape,
                          {
                            backgroundColor: `${colors.primary}28`,
                            borderColor: `${colors.primary}66`,
                            width: draftShapeWidthPx * 0.62,
                            height: draftShapeHeightPx,
                            left: 0,
                            top: 0,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.editorShape,
                          {
                            backgroundColor: `${colors.primary}28`,
                            borderColor: `${colors.primary}66`,
                            width: draftShapeWidthPx * 0.38,
                            height: draftShapeHeightPx * 0.48,
                            left: draftShapeWidthPx * 0.62,
                            top: draftShapeHeightPx * 0.52,
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <View
                      style={[
                        styles.editorShape,
                        {
                          backgroundColor: `${colors.primary}28`,
                          borderColor: `${colors.primary}66`,
                          width: draftShapeWidthPx,
                          height: draftShapeHeightPx,
                          borderRadius: layoutDraft.room_shape === 'square' ? Layout.radius.md : Layout.radius.sm,
                          left: 0,
                          top: 0,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>

              <Text style={[styles.editorPreviewText, { color: colors.textSecondary }]}>
                Dessin: {Math.round(draftPreview.renderedWidth * 10) / 10}m x {Math.round(draftPreview.renderedHeight * 10) / 10}m
              </Text>

              <AnimatedButton
                title="Appliquer et reorganiser"
                onPress={handleApplyRoomLayout}
                loading={isSavingRoomLayout || isAutoLayouting}
                fullWidth
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  statsCard: {
    flexDirection: 'row',
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: Layout.fontSize.xs, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: Layout.fontSize.sm, fontWeight: '600' },
  brandLogoMark: {
    overflow: 'hidden',
    shadowColor: '#7A53FF',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  brandLogoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  layoutSummaryCard: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  layoutSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  layoutSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    flex: 1,
  },
  layoutSummaryContent: {
    flex: 1,
    gap: 3,
  },
  layoutSummaryTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  layoutSummaryText: {
    fontSize: Layout.fontSize.sm,
  },
  layoutSummaryButton: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
  },
  layoutSummaryButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  editorBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
  },
  editorSheet: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    gap: Layout.spacing.md,
    maxHeight: '86%',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editorTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  editorCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  editorCloseText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  editorSubtitle: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  classicResetBtn: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicResetText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  layoutInputsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  layoutInputCol: {
    flex: 1,
    gap: 4,
  },
  layoutInputLabel: {
    fontSize: Layout.fontSize.xs,
  },
  layoutInput: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    fontSize: Layout.fontSize.sm,
  },
  roomShapeRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  roomShapeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  roomShapeText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  editorPreview: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
  },
  editorShapeContainer: {
    position: 'relative',
  },
  editorShape: {
    position: 'absolute',
    borderWidth: 1,
  },
  editorPreviewText: {
    fontSize: Layout.fontSize.xs,
    textAlign: 'center',
  },
  addForm: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  input: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    fontSize: Layout.fontSize.md,
  },
  formLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  shapeSelector: { flexDirection: 'row', gap: Layout.spacing.sm },
  shapeOption: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  capacitySelector: { flexDirection: 'row', gap: Layout.spacing.sm },
  capacityOption: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  capacityText: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  canvas: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  canvasTitle: { fontSize: Layout.fontSize.sm, textAlign: 'center', marginBottom: Layout.spacing.sm },
  canvasScale: { fontSize: Layout.fontSize.xs, textAlign: 'center', marginBottom: Layout.spacing.sm },
  canvasArea: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
  },
  roomOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  roomWatermark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomZone: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  roomGrid: {
    position: 'absolute',
  },
  roomGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  roomGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  table: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  tableName: {
    fontSize: 10,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '98%',
  },
  tableCount: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  occupancyBar: { width: '88%', height: 3, borderRadius: 2, marginTop: 2 },
  occupancyFill: { height: '100%', borderRadius: 2 },
  emptyCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.sm },
  detailCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  detailTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700' },
  renameTrigger: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 6,
  },
  renameTriggerText: { fontSize: Layout.fontSize.xs, fontWeight: '600' },
  renameSection: { marginTop: Layout.spacing.sm, gap: Layout.spacing.sm },
  renameInput: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    fontSize: Layout.fontSize.sm,
  },
  renameActions: { flexDirection: 'row', gap: Layout.spacing.sm },
  renameActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    paddingVertical: Layout.spacing.sm,
  },
  renameActionText: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  deleteBtn: { padding: Layout.spacing.sm, borderRadius: Layout.radius.md },
  detailSubtitle: { fontSize: Layout.fontSize.sm, marginTop: 4, marginBottom: Layout.spacing.md },
  guestsList: { gap: Layout.spacing.sm },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
  },
  guestName: { flex: 1, fontSize: Layout.fontSize.sm },
  removeText: { fontSize: Layout.fontSize.sm },
  addGuestSection: { marginTop: Layout.spacing.md },
  addGuestLabel: { fontSize: Layout.fontSize.sm, marginBottom: Layout.spacing.sm },
  unassignedGuest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.sm,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    marginBottom: Layout.spacing.xs,
  },
  unassignedName: { fontSize: Layout.fontSize.sm },
  moreGuests: { fontSize: Layout.fontSize.sm, textAlign: 'center', marginTop: Layout.spacing.sm },
  unassignedCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
  },
  unassignedHeader: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: Layout.spacing.sm },
  unassignedTitle: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  unassignedHint: { fontSize: Layout.fontSize.sm },
});
