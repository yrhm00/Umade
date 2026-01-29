export const Config = {
  // App info
  appName: 'Umade',
  appVersion: '1.0.0',
  
  // API
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Pagination
  pageSize: 20,
  
  // Images
  maxImageSize: 5 * 1024 * 1024, // 5MB
  imageQuality: 0.8,
  
  // Search
  searchDebounceMs: 300,
  minSearchLength: 2,
  
  // Booking
  minAdvanceBookingHours: 24,
  maxAdvanceBookingDays: 90,
  
  // Messages
  messagesPageSize: 50,
  
  // Notifications
  notificationsPageSize: 20,
  
  // Cache keys
  cacheKeys: {
    categories: 'categories',
    providers: 'providers',
    bookings: 'bookings',
    events: 'events',
    availability: 'availability',
    conversations: 'conversations',
    notifications: 'notifications',
    favorites: 'favorites',
  },
} as const;