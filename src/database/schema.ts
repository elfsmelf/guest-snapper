export * from "@/../auth-schema"
import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core"
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
  approveUploads: boolean('approve_uploads').default(true),
  realtimeSlideshow: boolean('realtime_slideshow').default(true),
  slideDuration: integer('slide_duration').default(5),
  revealSetting: text('reveal_setting').default('immediately'),
  guestCount: integer('guest_count').default(0),
  settings: text('settings').default('{}').notNull(), // JSON field for storing event settings
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
  sessionId: text('session_id'), // for anonymous users
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

// Guestbook entries
export const guestbookEntries = pgTable("guestbook_entries", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'), // for anonymous users
  guestName: text('guest_name').notNull(),
  message: text('message').notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
})

