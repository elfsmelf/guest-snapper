import { relations } from "drizzle-orm/relations";
import { events, deletionEvents, organizations, members, users, sessions, accounts, invitations, guests, guestbookEntries, uploads, albums } from "./schema";

export const deletionEventsRelations = relations(deletionEvents, ({one}) => ({
	event: one(events, {
		fields: [deletionEvents.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	deletionEvents: many(deletionEvents),
	guests: many(guests),
	guestbookEntries: many(guestbookEntries),
	uploads: many(uploads),
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id]
	}),
	albums: many(albums),
}));

export const membersRelations = relations(members, ({one}) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	members: many(members),
	invitations: many(invitations),
	events: many(events),
}));

export const usersRelations = relations(users, ({many}) => ({
	members: many(members),
	sessions: many(sessions),
	accounts: many(accounts),
	invitations: many(invitations),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	organization: one(organizations, {
		fields: [invitations.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [invitations.inviterId],
		references: [users.id]
	}),
}));

export const guestsRelations = relations(guests, ({one}) => ({
	event: one(events, {
		fields: [guests.eventId],
		references: [events.id]
	}),
}));

export const guestbookEntriesRelations = relations(guestbookEntries, ({one}) => ({
	event: one(events, {
		fields: [guestbookEntries.eventId],
		references: [events.id]
	}),
}));

export const uploadsRelations = relations(uploads, ({one}) => ({
	event: one(events, {
		fields: [uploads.eventId],
		references: [events.id]
	}),
	album: one(albums, {
		fields: [uploads.albumId],
		references: [albums.id]
	}),
}));

export const albumsRelations = relations(albums, ({one, many}) => ({
	uploads: many(uploads),
	event: one(events, {
		fields: [albums.eventId],
		references: [events.id]
	}),
}));