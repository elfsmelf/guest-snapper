import { pgTable, foreignKey, text, timestamp, unique, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const deletionEvents = pgTable("deletion_events", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id"),
	action: text().notNull(),
	reason: text(),
	executedAt: timestamp("executed_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: text().default('{}').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "deletion_events_event_id_events_id_fk"
		}).onDelete("set null"),
]);

export const members = pgTable("members", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "members_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "members_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
	activeOrganizationId: text("active_organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	role: text().default('user'),
	banned: boolean(),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const organizations = pgTable("organizations", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: text(),
}, (table) => [
	unique("organizations_slug_unique").on(table.slug),
]);

export const invitations = pgTable("invitations", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	inviterId: text("inviter_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "invitations_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [users.id],
			name: "invitations_inviter_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const events = pgTable("events", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
	name: text().notNull(),
	coupleNames: text("couple_names").notNull(),
	eventDate: text("event_date").notNull(),
	activationDate: text("activation_date"),
	isPublished: boolean("is_published").default(false).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	venue: text(),
	slug: text().notNull(),
	themeId: text("theme_id").default('default').notNull(),
	uploadWindowEnd: timestamp("upload_window_end", { mode: 'string' }).notNull(),
	downloadWindowEnd: timestamp("download_window_end", { mode: 'string' }).notNull(),
	privacySettings: text("privacy_settings").default('{"allow_guest_viewing":true,"allow_guest_downloads":false}').notNull(),
	moderationSettings: text("moderation_settings").default('{"nsfw_filter":true,"auto_approve":true}').notNull(),
	coverImageUrl: text("cover_image_url"),
	guestCanViewAlbum: boolean("guest_can_view_album").default(true),
	approveUploads: boolean("approve_uploads").default(true),
	realtimeSlideshow: boolean("realtime_slideshow").default(true),
	slideDuration: integer("slide_duration").default(5),
	revealSetting: text("reveal_setting").default('immediately'),
	guestCount: integer("guest_count").default(0),
	plan: text().default('free').notNull(),
	currency: text().default('AUD').notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	stripeSessionId: text("stripe_session_id"),
	stripePaymentIntent: text("stripe_payment_intent"),
	settings: text().default('{}').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	status: text().default('active').notNull(),
	trashedAt: timestamp("trashed_at", { mode: 'string' }),
	deleteAt: timestamp("delete_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "events_organization_id_organizations_id_fk"
		}).onDelete("set null"),
	unique("events_slug_unique").on(table.slug),
]);

export const guestbookEntries = pgTable("guestbook_entries", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	sessionId: text("session_id"),
	guestName: text("guest_name").notNull(),
	message: text().notNull(),
	isApproved: boolean("is_approved").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "guestbook_entries_event_id_events_id_fk"
		}).onDelete("cascade"),
]);

export const uploads = pgTable("uploads", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	albumId: text("album_id"),
	sessionId: text("session_id"),
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: text("file_type").notNull(),
	mimeType: text("mime_type").notNull(),
	fileSize: integer("file_size").notNull(),
	caption: text(),
	isApproved: boolean("is_approved").default(true).notNull(),
	uploaderName: text("uploader_name"),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "uploads_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "uploads_album_id_albums_id_fk"
		}).onDelete("set null"),
]);

export const albums = pgTable("albums", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	name: text().notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "albums_event_id_events_id_fk"
		}).onDelete("cascade"),
]);
