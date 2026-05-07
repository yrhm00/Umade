/**
 * Hooks pour le Plan de Table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableWithGuests,
  CreateTableInput,
  Guest,
  GuestGroup,
  GuestGroupMember,
  GuestStatus,
  SeatingRoomLayout,
  SeatingRoomLayoutInput,
  SeatingLayoutPresetId,
  SEATING_LAYOUT_PRESETS,
  SeatingRoomShape,
} from '@/types/eventFeatures';

const QUERY_KEY = 'tables';
const ROOM_LAYOUT_QUERY_KEY = 'roomLayout';
const AUTO_GROUP_MEMBER_PREFIX = 'AUTO_GROUP_MEMBER:';
const AUTO_GROUP_SLOT_PREFIX = 'AUTO_GROUP_SLOT:';
const AUTO_ASSIGN_TABLE_CAPACITY = 8;
const AUTO_ASSIGNABLE_GROUP_STATUSES: GuestStatus[] = ['confirmed', 'pending', 'maybe'];
const DEFAULT_LAYOUT_PRESET_ID: SeatingLayoutPresetId = 'classique';
const DEFAULT_ROOM_MIN_DIMENSION_M = 6;
const DEFAULT_ROOM_MAX_DIMENSION_M = 80;
const DEFAULT_AISLE_MIN_M = 0.6;
const DEFAULT_AISLE_MAX_M = 4;
const LEGACY_CANVAS_REFERENCE = {
  width: 340,
  height: 400,
};
const MIN_TABLE_MARGIN_M = 0.5;
const POSITION_DECIMALS = 3;

// Helper pour les tables non typées
// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (tableName: string) => (supabase as any).from(tableName);

function roundPosition(value: number) {
  const factor = 10 ** POSITION_DECIMALS;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function asFiniteNumber(value: unknown, fallback: number) {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function findLayoutPreset(presetId: string | undefined) {
  return (
    SEATING_LAYOUT_PRESETS.find((preset) => preset.id === presetId) ||
    SEATING_LAYOUT_PRESETS.find((preset) => preset.id === DEFAULT_LAYOUT_PRESET_ID) ||
    SEATING_LAYOUT_PRESETS[0]
  );
}

export function getDefaultSeatingRoomLayout(eventId: string): SeatingRoomLayoutInput {
  const preset = findLayoutPreset(DEFAULT_LAYOUT_PRESET_ID);
  return {
    event_id: eventId,
    preset_id: preset.id,
    room_shape: preset.room_shape,
    width_m: preset.width_m,
    height_m: preset.height_m,
    aisle_m: preset.aisle_m,
  };
}

function sanitizeRoomLayout(input: Partial<SeatingRoomLayoutInput> & { event_id: string }): SeatingRoomLayoutInput {
  const preset = findLayoutPreset(input.preset_id);
  const width_m = clamp(
    asFiniteNumber(input.width_m, preset.width_m),
    DEFAULT_ROOM_MIN_DIMENSION_M,
    DEFAULT_ROOM_MAX_DIMENSION_M
  );
  const height_m = clamp(
    asFiniteNumber(input.height_m, preset.height_m),
    DEFAULT_ROOM_MIN_DIMENSION_M,
    DEFAULT_ROOM_MAX_DIMENSION_M
  );
  const maxAisleByRoom = Math.max(DEFAULT_AISLE_MIN_M, Math.min(width_m, height_m) / 2 - 0.4);
  const aisle_m = clamp(
    asFiniteNumber(input.aisle_m, preset.aisle_m),
    DEFAULT_AISLE_MIN_M,
    Math.min(DEFAULT_AISLE_MAX_M, maxAisleByRoom)
  );

  let room_shape: SeatingRoomShape = preset.room_shape;
  if (input.room_shape === 'rectangle' || input.room_shape === 'square' || input.room_shape === 'l_shape') {
    room_shape = input.room_shape;
  }

  return {
    event_id: input.event_id,
    preset_id: preset.id,
    room_shape,
    width_m,
    height_m,
    aisle_m,
  };
}

function isMissingRoomLayoutTableError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === '42P01' || code === 'PGRST205') return true;

  const message = String((error as { message?: string } | null)?.message || '').toLowerCase();
  return message.includes('event_room_layouts');
}

async function fetchRoomLayout(eventId: string): Promise<SeatingRoomLayoutInput> {
  const fallback = getDefaultSeatingRoomLayout(eventId);
  const { data, error } = await fromTable('event_room_layouts')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) {
    if (isMissingRoomLayoutTableError(error) || error.code === 'PGRST116') {
      return fallback;
    }
    throw error;
  }

  if (!data) return fallback;

  const row = data as Partial<SeatingRoomLayout>;
  return sanitizeRoomLayout({
    event_id: eventId,
    preset_id: row.preset_id,
    room_shape: row.room_shape,
    width_m: row.width_m,
    height_m: row.height_m,
    aisle_m: row.aisle_m,
  });
}

type LayoutZone = { x: number; y: number; width: number; height: number };

function getLayoutZones(roomShape: SeatingRoomShape): LayoutZone[] {
  if (roomShape === 'l_shape') {
    return [
      { x: 0, y: 0, width: 0.62, height: 1 },
      { x: 0.62, y: 0.52, width: 0.38, height: 0.48 },
    ];
  }

  return [{ x: 0, y: 0, width: 1, height: 1 }];
}

function buildGridPoints(count: number, zone: LayoutZone, roomAspectRatio: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];

  const zoneRatio = (zone.width * roomAspectRatio) / Math.max(zone.height, 0.0001);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * zoneRatio)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellWidth = zone.width / cols;
  const cellHeight = zone.height / rows;
  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    points.push({
      x: zone.x + cellWidth * (col + 0.5),
      y: zone.y + cellHeight * (row + 0.5),
    });
  }

  return points;
}

export function buildTablePositionsForRoom(tableCount: number, layout: SeatingRoomLayoutInput) {
  if (tableCount <= 0) return [];

  const zones = getLayoutZones(layout.room_shape);
  const zoneAreas = zones.map((zone) => zone.width * zone.height);
  const totalArea = zoneAreas.reduce((sum, area) => sum + area, 0);
  const zoneCounts = zoneAreas.map((area) => {
    const raw = (tableCount * area) / Math.max(totalArea, 0.0001);
    return Math.floor(raw);
  });
  let assigned = zoneCounts.reduce((sum, count) => sum + count, 0);
  const zonePriority = zoneAreas
    .map((area, index) => ({ area, index }))
    .sort((a, b) => b.area - a.area);

  let pointer = 0;
  while (assigned < tableCount && zonePriority.length > 0) {
    const zoneIndex = zonePriority[pointer % zonePriority.length].index;
    zoneCounts[zoneIndex] += 1;
    assigned += 1;
    pointer += 1;
  }

  const ratio = layout.width_m / Math.max(layout.height_m, 0.0001);
  const marginXRatio = clamp(layout.aisle_m / layout.width_m, 0.03, 0.3);
  const marginYRatio = clamp(layout.aisle_m / layout.height_m, 0.03, 0.3);
  const usableWidthRatio = Math.max(0.08, 1 - marginXRatio * 2);
  const usableHeightRatio = Math.max(0.08, 1 - marginYRatio * 2);

  const allPoints: Array<{ x: number; y: number }> = [];
  zones.forEach((zone, index) => {
    const zoneCount = zoneCounts[index] || 0;
    if (zoneCount <= 0) return;

    const zoneInUsableArea: LayoutZone = {
      x: marginXRatio + zone.x * usableWidthRatio,
      y: marginYRatio + zone.y * usableHeightRatio,
      width: zone.width * usableWidthRatio,
      height: zone.height * usableHeightRatio,
    };
    allPoints.push(...buildGridPoints(zoneCount, zoneInUsableArea, ratio));
  });

  return allPoints.slice(0, tableCount).map((point) => ({
    x: roundPosition(clamp(point.x * layout.width_m, MIN_TABLE_MARGIN_M, layout.width_m - MIN_TABLE_MARGIN_M)),
    y: roundPosition(clamp(point.y * layout.height_m, MIN_TABLE_MARGIN_M, layout.height_m - MIN_TABLE_MARGIN_M)),
  }));
}

export function normalizeTableCoordinates(table: Pick<Table, 'position_x' | 'position_y'>, layout: SeatingRoomLayoutInput) {
  const normalize = (value: number, axis: 'x' | 'y') => {
    const roomDimension = axis === 'x' ? layout.width_m : layout.height_m;
    const legacyDimension = axis === 'x' ? LEGACY_CANVAS_REFERENCE.width : LEGACY_CANVAS_REFERENCE.height;
    const fallback = roomDimension / 2;
    const numeric = asFiniteNumber(value, fallback);

    if (numeric <= roomDimension * 1.5) {
      return clamp(numeric, MIN_TABLE_MARGIN_M, roomDimension - MIN_TABLE_MARGIN_M);
    }

    const scaled = (numeric / legacyDimension) * roomDimension;
    return clamp(scaled, MIN_TABLE_MARGIN_M, roomDimension - MIN_TABLE_MARGIN_M);
  };

  return {
    x: roundPosition(normalize(table.position_x, 'x')),
    y: roundPosition(normalize(table.position_y, 'y')),
  };
}

function splitDisplayName(name: string, fallbackLastName = 'Invité') {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { first_name: 'Invité', last_name: fallbackLastName };
  }

  const chunks = cleaned.split(' ');
  if (chunks.length === 1) {
    return { first_name: chunks[0], last_name: fallbackLastName };
  }

  return {
    first_name: chunks[0],
    last_name: chunks.slice(1).join(' '),
  };
}

// ============================================
// Récupérer toutes les tables
// ============================================

export function useTables(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<Table[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('event_tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Table[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer les tables avec leurs invités
// ============================================

export function useTablesWithGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'withGuests', eventId],
    queryFn: async (): Promise<TableWithGuests[]> => {
      if (!eventId) return [];

      const { data: tablesData, error: tablesError } = await fromTable('event_tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (tablesError) throw tablesError;

      const tables = (tablesData || []) as Table[];
      if (tables.length === 0) return [];

      // Récupérer tous les invités assignés
      const { data: guests, error } = await fromTable('guests')
        .select('*')
        .eq('event_id', eventId)
        .not('table_id', 'is', null);

      if (error) throw error;

      // Mapper les invités aux tables
      return tables.map((table) => {
        const tableGuests = (guests as Guest[] || []).filter(
          (g) => g.table_id === table.id
        );
        return {
          ...table,
          guests: tableGuests,
          available_seats: table.capacity - tableGuests.length,
        };
      });
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer les invités non assignés
// ============================================

export function useUnassignedGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'unassigned', eventId],
    queryFn: async (): Promise<Guest[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('guests')
        .select('*')
        .eq('event_id', eventId)
        .is('table_id', null)
        .neq('status', 'declined')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return (data || []) as Guest[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Configuration de la salle (surface + template)
// ============================================

export function useSeatingRoomLayout(eventId: string | undefined) {
  return useQuery({
    queryKey: [ROOM_LAYOUT_QUERY_KEY, eventId],
    queryFn: async (): Promise<SeatingRoomLayoutInput> => {
      if (!eventId) return getDefaultSeatingRoomLayout('');
      return fetchRoomLayout(eventId);
    },
    enabled: !!eventId,
  });
}

export function useUpsertSeatingRoomLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SeatingRoomLayoutInput) => {
      const payload = sanitizeRoomLayout(input);
      const { data, error } = await fromTable('event_room_layouts')
        .upsert(
          {
            event_id: payload.event_id,
            preset_id: payload.preset_id,
            room_shape: payload.room_shape,
            width_m: payload.width_m,
            height_m: payload.height_m,
            aisle_m: payload.aisle_m,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'event_id',
          }
        )
        .select('*')
        .single();

      if (error) {
        if (isMissingRoomLayoutTableError(error)) {
          throw new Error('ROOM_LAYOUT_TABLE_MISSING');
        }
        throw error;
      }

      const row = data as Partial<SeatingRoomLayout>;
      return sanitizeRoomLayout({
        event_id: payload.event_id,
        preset_id: row.preset_id,
        room_shape: row.room_shape,
        width_m: row.width_m,
        height_m: row.height_m,
        aisle_m: row.aisle_m,
      });
    },
    onSuccess: (layout) => {
      queryClient.setQueryData([ROOM_LAYOUT_QUERY_KEY, layout.event_id], layout);
    },
  });
}

export function useAutoLayoutTables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      layout,
    }: {
      eventId: string;
      layout: SeatingRoomLayoutInput;
    }) => {
      const roomLayout = sanitizeRoomLayout(layout);
      const { data, error } = await fromTable('event_tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (error) throw error;

      const tables = (data || []) as Table[];
      if (tables.length === 0) return { moved: 0, total: 0 };

      const positions = buildTablePositionsForRoom(tables.length, roomLayout);
      let moved = 0;

      for (let index = 0; index < tables.length; index += 1) {
        const table = tables[index];
        const target = positions[index];
        if (!target) continue;

        const current = normalizeTableCoordinates(table, roomLayout);
        const changed = Math.abs(current.x - target.x) > 0.01 || Math.abs(current.y - target.y) > 0.01;
        if (!changed) continue;

        const { error: updateError } = await fromTable('event_tables')
          .update({
            position_x: target.x,
            position_y: target.y,
            updated_at: new Date().toISOString(),
          })
          .eq('id', table.id);

        if (updateError) throw updateError;
        moved += 1;
      }

      return { moved, total: tables.length };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.eventId],
      });
    },
  });
}

// ============================================
// Créer une table
// ============================================

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTableInput) => {
      const { data, error } = await fromTable('event_tables')
        .insert({
          event_id: input.event_id,
          name: input.name,
          shape: input.shape || 'round',
          capacity: input.capacity || 8,
          position_x: input.position_x ?? 8,
          position_y: input.position_y ?? 6,
          rotation: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.event_id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.event_id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'unassigned', variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour une table
// ============================================

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<Table>;
    }) => {
      const { data, error } = await fromTable('event_tables')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.eventId],
      });
    },
  });
}

// ============================================
// Mettre à jour la position d'une table
// ============================================

export function useUpdateTablePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, x, y, rotation }: {
      id: string;
      eventId: string;
      x: number;
      y: number;
      rotation?: number;
    }) => {
      const updateData: any = {
        position_x: x,
        position_y: y,
        updated_at: new Date().toISOString(),
      };

      if (rotation !== undefined) {
        updateData.rotation = rotation;
      }

      const { data, error } = await fromTable('event_tables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.eventId],
      });
    },
  });
}

// ============================================
// Supprimer une table
// ============================================

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      // D'abord, désassigner tous les invités de cette table
      await fromTable('guests')
        .update({ table_id: null, seat_number: null })
        .eq('table_id', id);

      // Ensuite, supprimer la table
      const { error } = await fromTable('event_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'unassigned', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['guests', variables.eventId],
      });
    },
  });
}

// ============================================
// Auto-assigner les invités aux tables
// ============================================

export function useAutoAssignGuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      // 1) Charger les tables et invités existants
      const { data: rawTables, error: tablesError } = await fromTable('event_tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name');
      if (tablesError) throw tablesError;

      let tables = (rawTables || []) as Table[];

      const { data: rawGuests, error: guestsError } = await fromTable('guests')
        .select('*')
        .eq('event_id', eventId);
      if (guestsError) throw guestsError;

      let guests = (rawGuests || []) as Guest[];

      // 2) Convertir automatiquement les groupes/familles en invités si nécessaire.
      // Cela permet l'auto-assignation même si l'utilisateur n'a créé que des groupes.
      const { data: rawGroups, error: groupsError } = await fromTable('guest_groups')
        .select('*')
        .eq('event_id', eventId)
        .in('status', AUTO_ASSIGNABLE_GROUP_STATUSES);
      if (groupsError) throw groupsError;

      const groups = (rawGroups || []) as GuestGroup[];
      let groupMembers: GuestGroupMember[] = [];

      if (groups.length > 0) {
        const { data: rawMembers, error: membersError } = await fromTable('guest_group_members')
          .select('*')
          .in('group_id', groups.map((group) => group.id));
        if (membersError) throw membersError;
        groupMembers = (rawMembers || []) as GuestGroupMember[];
      }

      const autoMarkers = new Set<string>();
      for (const guest of guests) {
        const note = guest.notes?.trim();
        if (
          note &&
          (note.startsWith(AUTO_GROUP_MEMBER_PREFIX) || note.startsWith(AUTO_GROUP_SLOT_PREFIX))
        ) {
          autoMarkers.add(note);
        }
      }

      const normalize = (value: string) => value.trim().toLowerCase();
      const hasGuestByName = (firstName: string, lastName: string) =>
        guests.some(
          (guest) =>
            normalize(guest.first_name) === normalize(firstName) &&
            normalize(guest.last_name) === normalize(lastName)
        );

      type GuestInsertPayload = {
        event_id: string;
        first_name: string;
        last_name: string;
        email: string | null;
        phone: string | null;
        status: GuestStatus;
        category: Guest['category'];
        plus_one: boolean;
        plus_one_name: string | null;
        plus_one_confirmed: boolean;
        meal_preference: Guest['meal_preference'];
        dietary_notes: string | null;
        notes: string | null;
      };

      const guestsToInsert: GuestInsertPayload[] = [];

      for (const group of groups) {
        const membersForGroup = groupMembers.filter((member) => member.group_id === group.id);

        for (const member of membersForGroup) {
          const marker = `${AUTO_GROUP_MEMBER_PREFIX}${group.id}:${member.id}`;
          if (autoMarkers.has(marker)) continue;

          const parsedName = splitDisplayName(member.name, group.name);
          if (hasGuestByName(parsedName.first_name, parsedName.last_name)) continue;

          guestsToInsert.push({
            event_id: eventId,
            first_name: parsedName.first_name,
            last_name: parsedName.last_name,
            email: null,
            phone: null,
            status: group.status,
            category: group.category,
            plus_one: false,
            plus_one_name: null,
            plus_one_confirmed: false,
            meal_preference: member.meal_preference || 'standard',
            dietary_notes: member.dietary_notes || null,
            notes: marker,
          });
          autoMarkers.add(marker);
        }

        const missingSlots = Math.max(0, group.member_count - membersForGroup.length);
        for (let offset = 0; offset < missingSlots; offset++) {
          const slotNumber = membersForGroup.length + offset + 1;
          const marker = `${AUTO_GROUP_SLOT_PREFIX}${group.id}:${slotNumber}`;
          if (autoMarkers.has(marker)) continue;

          const parsedName = splitDisplayName(`Invité ${slotNumber} ${group.name}`, group.name);
          if (hasGuestByName(parsedName.first_name, parsedName.last_name)) continue;

          guestsToInsert.push({
            event_id: eventId,
            first_name: parsedName.first_name,
            last_name: parsedName.last_name,
            email: null,
            phone: null,
            status: group.status,
            category: group.category,
            plus_one: false,
            plus_one_name: null,
            plus_one_confirmed: false,
            meal_preference: 'standard',
            dietary_notes: null,
            notes: marker,
          });
          autoMarkers.add(marker);
        }
      }

      let generatedGuests = 0;
      if (guestsToInsert.length > 0) {
        const { data: insertedGuests, error: insertGuestsError } = await fromTable('guests')
          .insert(guestsToInsert)
          .select('*');

        if (insertGuestsError) throw insertGuestsError;

        const createdGuests = (insertedGuests || []) as Guest[];
        generatedGuests = createdGuests.length;
        guests = [...guests, ...createdGuests];
      }

      // 3) Déterminer les invités assignables (tout sauf refusé)
      const guestsToAssign = guests
        .filter((guest) => guest.table_id === null && guest.status !== 'declined')
        .sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'fr', {
            numeric: true,
            sensitivity: 'base',
          })
        );

      if (guestsToAssign.length === 0) {
        return { assigned: 0, createdTables: 0, generatedGuests, reason: 'no_guests' as const };
      }

      // 4) Calcul des places occupées par table
      const tableCounts: Record<string, number> = {};
      for (const table of tables) {
        tableCounts[table.id] = 0;
      }
      for (const guest of guests) {
        if (!guest.table_id || guest.status === 'declined') continue;
        if (tableCounts[guest.table_id] === undefined) continue;
        tableCounts[guest.table_id] += 1;
      }

      // 5) Créer automatiquement des tables s'il n'y a pas assez de places
      const availableSeats = tables.reduce(
        (sum, table) => sum + Math.max(0, table.capacity - (tableCounts[table.id] || 0)),
        0
      );
      const missingSeats = Math.max(0, guestsToAssign.length - availableSeats);
      const roomLayout = await fetchRoomLayout(eventId);

      let createdTables = 0;
      if (missingSeats > 0) {
        const tablesToCreate = Math.ceil(missingSeats / AUTO_ASSIGN_TABLE_CAPACITY);
        const existingTableNumbers = new Set<number>(
          tables
            .map((table) => {
              const match = table.name.match(/table\s*(\d+)/i);
              return match ? Number(match[1]) : null;
            })
            .filter((value): value is number => value !== null && Number.isFinite(value))
        );

        let nextNumber = 1;
        const allPositions = buildTablePositionsForRoom(tables.length + tablesToCreate, roomLayout);
        const newTablesPayload = Array.from({ length: tablesToCreate }, (_, index) => {
          while (existingTableNumbers.has(nextNumber)) {
            nextNumber += 1;
          }
          const tableNumber = nextNumber;
          existingTableNumbers.add(tableNumber);
          nextNumber += 1;
          const position = allPositions[tables.length + index] || {
            x: roundPosition(roomLayout.width_m / 2),
            y: roundPosition(roomLayout.height_m / 2),
          };

          return {
            event_id: eventId,
            name: `Table ${tableNumber}`,
            shape: 'round' as const,
            capacity: AUTO_ASSIGN_TABLE_CAPACITY,
            position_x: position.x,
            position_y: position.y,
            rotation: 0,
          };
        });

        const { data: insertedTables, error: insertTablesError } = await fromTable('event_tables')
          .insert(newTablesPayload)
          .select('*');

        if (insertTablesError) throw insertTablesError;

        const created = (insertedTables || []) as Table[];
        createdTables = created.length;
        tables = [...tables, ...created].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' })
        );
        for (const table of created) {
          tableCounts[table.id] = tableCounts[table.id] || 0;
        }
      }

      // 6) Assigner les invités
      let assigned = 0;
      for (const guest of guestsToAssign) {
        const availableTable = tables.find((table) => (tableCounts[table.id] || 0) < table.capacity);
        if (!availableTable) break;

        const { error: updateError } = await fromTable('guests')
          .update({
            table_id: availableTable.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', guest.id);

        if (updateError) throw updateError;

        tableCounts[availableTable.id] = (tableCounts[availableTable.id] || 0) + 1;
        assigned += 1;
      }

      return {
        assigned,
        createdTables,
        generatedGuests,
        consideredGuests: guestsToAssign.length,
      };

    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'withGuests', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'unassigned', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['guests', variables.eventId],
      });
    },
  });
}
