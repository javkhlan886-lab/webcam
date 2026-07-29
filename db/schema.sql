-- StreamHub Database Schema
-- PostgreSQL

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'creator', 'user')),
  username VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT false,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- CREATOR PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS creator_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties VARCHAR(255)[],
  is_live BOOLEAN DEFAULT false,
  viewers_count INT DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,
  subscription_price DECIMAL(10, 2),
  private_show_rate DECIMAL(10, 2),
  tips_enabled BOOLEAN DEFAULT true,
  token_rate INT DEFAULT 1,
  social_links JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);

-- ============================================
-- FOLLOWS & RELATIONSHIPS
-- ============================================

CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ============================================
-- LIVE STREAMS & SHOWS
-- ============================================

CREATE TABLE IF NOT EXISTS live_streams (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  stream_key VARCHAR(255) UNIQUE NOT NULL,
  stream_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  is_active BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  viewers_count INT DEFAULT 0,
  duration_minutes INT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_streams_creator ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_active ON live_streams(is_active);

-- ============================================
-- PRIVATE SHOWS & FANCLUB
-- ============================================

CREATE TABLE IF NOT EXISTS private_shows (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  duration_minutes INT,
  token_price INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  recording_url VARCHAR(500),
  is_recorded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_private_shows_creator ON private_shows(creator_id);
CREATE INDEX IF NOT EXISTS idx_private_shows_user ON private_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_private_shows_status ON private_shows(status);

-- ============================================
-- FANCLUB & SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS fanclub_memberships (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(100) DEFAULT 'basic',
  monthly_price DECIMAL(10, 2),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fanclub_creator ON fanclub_memberships(creator_id);
CREATE INDEX IF NOT EXISTS idx_fanclub_user ON fanclub_memberships(user_id);

CREATE TABLE IF NOT EXISTS fanclub_content (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_url VARCHAR(500),
  content_type VARCHAR(100) CHECK (content_type IN ('image', 'video', 'audio', 'text')),
  tier_required VARCHAR(100) DEFAULT 'basic',
  is_published BOOLEAN DEFAULT false,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fanclub_content_creator ON fanclub_content(creator_id);

-- ============================================
-- TOKENS & TIPS
-- ============================================

CREATE TABLE IF NOT EXISTS user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  total_purchased INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_tokens(user_id);

CREATE TABLE IF NOT EXISTS token_transactions (
  id SERIAL PRIMARY KEY,
  from_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  amount INT NOT NULL,
  type VARCHAR(100) CHECK (type IN ('purchase', 'gift', 'tip', 'private_show', 'subscription')),
  description VARCHAR(500),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_transactions_from ON token_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_to ON token_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(type);

-- ============================================
-- LIVE CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  stream_id INT REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'tip', 'system')),
  tip_amount INT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_stream ON chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

CREATE TABLE IF NOT EXISTS chat_bans (
  id SERIAL PRIMARY KEY,
  stream_id INT REFERENCES live_streams(id) ON DELETE CASCADE,
  banned_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by_user_id INT REFERENCES users(id),
  reason TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONTENT & POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  media_url VARCHAR(500)[],
  visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'fanclub')),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_creator ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(100) CHECK (type IN ('follow', 'like', 'comment', 'tip', 'stream_live', 'message')),
  content TEXT,
  related_id INT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- ADMIN & MODERATION
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  reported_post_id INT REFERENCES posts(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS admin_actions (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) CHECK (action_type IN ('ban_user', 'unban_user', 'delete_content', 'suspend', 'unsuspend')),
  target_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  duration_days INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);

-- ============================================
-- ANALYTICS & STATISTICS
-- ============================================

CREATE TABLE IF NOT EXISTS stream_analytics (
  id SERIAL PRIMARY KEY,
  stream_id INT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  peak_viewers INT,
  total_viewers INT,
  total_tokens_earned INT DEFAULT 0,
  total_tips INT DEFAULT 0,
  avg_viewer_duration INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE,
  viewers INT DEFAULT 0,
  followers_gained INT DEFAULT 0,
  tokens_earned INT DEFAULT 0,
  stream_minutes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creator_id, date)
);

-- ============================================
-- PAYMENT & WALLETS
-- ============================================

CREATE TABLE IF NOT EXISTS creator_wallets (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
  bank_account_verified BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bank_account VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_creator ON withdrawal_requests(creator_id);
