export * from "@/../auth-schema"
import { pgTable, text, timestamp, boolean, integer, uuid, unique } from "drizzle-orm/pg-core"
import { users, organizations } from "@/../auth-schema"

// Events table (wedding galleries) - matching actual database schema
export const events = pgTable("events", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(), // Removed foreign key constraint to avoid conflicts with Better Auth
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }), // Link events to organizations
  name: text('name').notNull(),
  coupleNames: text('couple_names').notNull(),
  eventDate: text('event_date').notNull(), // Using text to match database
  activationDate: text('activation_date'), // When the gallery becomes active/public
  isPublished: boolean('is_published').default(false).notNull(), // Whether the event has been published
  publishedAt: timestamp('published_at', { mode: 'string' }), // When the event was published
  venue: text('venue'),
  slug: text('slug').notNull().unique(),
  themeId: text('theme_id').default('default').notNull(),
  uploadWindowEnd: timestamp('upload_window_end', { mode: 'string' }).notNull(),
  downloadWindowEnd: timestamp('download_window_end', { mode: 'string' }).notNull(),
  privacySettings: text('privacy_settings').default('{"allow_guest_viewing":true,"allow_guest_downloads":false}').notNull(),
  moderationSettings: text('moderation_settings').default('{"nsfw_filter":true,"auto_approve":true}').notNull(),
  coverImageUrl: text('cover_image_url'),
  guestCanViewAlbum: boolean('guest_can_view_album').default(true),
  approveUploads: boolean('approve_uploads').default(false),
  realtimeSlideshow: boolean('realtime_slideshow').default(true),
  slideDuration: integer('slide_duration').default(5),
  revealSetting: text('reveal_setting').default('immediately'),
  guestCount: integer('guest_count').default(0),
  // Payment-related fields
  plan: text('plan').default('free').notNull(), // 'free', 'starter', 'small', 'medium', 'large', 'xlarge', 'unlimited'
  currency: text('currency').default('AUD').notNull(), // 'AUD', 'USD', 'GBP', 'EUR', 'CAD', 'NZD'
  paidAt: timestamp('paid_at', { mode: 'string' }),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntent: text('stripe_payment_intent'),
  settings: text('settings').default('{}').notNull(), // JSON field for storing event settings
  quickStartProgress: text('quick_start_progress').default('{}').notNull(), // JSON field for quick start progress tracking
  // Scheduled deletion fields
  status: text('status').default('active').notNull(), // 'active', 'trashed', 'deleted'
  trashedAt: timestamp('trashed_at', { mode: 'string' }),
  deleteAt: timestamp('delete_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

// Albums table for organizing photos within events
export const albums = pgTable("albums", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
})

// Uploads table for storing media files
export const uploads = pgTable("uploads", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  albumId: text('album_id').references(() => albums.id, { onDelete: 'set null' }),
  sessionId: text('session_id'), // for authenticated user tracking
  anonId: text('anon_id'), // for anonymous user tracking - will reference guests.id after migration
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(), // 'image' | 'video' | 'audio'
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  caption: text('caption'),
  isApproved: boolean('is_approved').default(true).notNull(),
  uploaderName: text('uploader_name'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
})

// Guests table for anonymous user tracking
export const guests = pgTable("guests", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  cookieId: text('cookie_id').notNull(), // Browser guest ID from cookie
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  guestName: text('guest_name'), // Optional name from localStorage or user input
  ipAddress: text('ip_address'), // For basic deduplication
  userAgent: text('user_agent'), // For additional fingerprinting
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  // Composite unique constraint: one guest record per cookie per event
  uniqueCookieEvent: unique().on(table.cookieId, table.eventId),
}))

// Guestbook entries
export const guestbookEntries = pgTable("guestbook_entries", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'), // for authenticated user tracking
  anonId: text('anon_id'), // for anonymous user tracking - will reference guests.id after migration
  guestName: text('guest_name').notNull(),
  message: text('message').notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
})

// Deletion events log table for audit trail
export const deletionEvents = pgTable("deletion_events", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').references(() => events.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'trashed', 'deleted'
  reason: text('reason'), // 'expired_download', 'manual'
  executedAt: timestamp('executed_at', { mode: 'string' }).defaultNow().notNull(),
  metadata: text('metadata').default('{}').notNull(), // JSON field for additional data
})


