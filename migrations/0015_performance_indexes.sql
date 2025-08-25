-- Performance optimization indexes based on Better Auth recommendations and usage patterns

-- Better Auth core table indexes (using snake_case column names)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);  
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);

-- Organization plugin indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Application-specific indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Upload table indexes (heavily queried in galleries)
CREATE INDEX IF NOT EXISTS idx_uploads_event_id ON uploads(event_id);
CREATE INDEX IF NOT EXISTS idx_uploads_event_id_approved ON uploads(event_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_file_type ON uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_uploads_album_id ON uploads(album_id);

-- Album table indexes
CREATE INDEX IF NOT EXISTS idx_albums_event_id ON albums(event_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_uploads_event_approved_created ON uploads(event_id, is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_published ON events(user_id, is_published);

-- Guestbook table indexes (if you have guestbook functionality)
-- CREATE INDEX IF NOT EXISTS idx_guestbook_event_id ON guestbook(event_id);
-- CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at);

-- Additional indexes for analytics queries (if needed)
CREATE INDEX IF NOT EXISTS idx_uploads_uploader_name ON uploads(uploader_name);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);