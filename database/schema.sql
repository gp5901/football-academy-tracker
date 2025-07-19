-- Football Academy Tracker Database Schema
-- Production-grade schema with proper constraints and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Age Groups table
CREATE TABLE age_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Coaches table with proper constraints
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
    name VARCHAR(100) NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    monthly_sessions_booked INTEGER NOT NULL DEFAULT 12,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'evening')),
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    coach_id UUID NOT NULL REFERENCES coaches(id),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table with version for optimistic locking
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    player_id UUID NOT NULL REFERENCES players(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('present_regular', 'present_complimentary', 'absent')),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, player_id) -- Prevent duplicate attendance records
);

-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_attendance_player_month 
ON attendance (player_id, EXTRACT(MONTH FROM timestamp));

CREATE INDEX CONCURRENTLY idx_sessions_coach_date 
ON sessions (coach_id, date DESC);

CREATE INDEX CONCURRENTLY idx_players_age_group 
ON players (age_group_id);

CREATE INDEX CONCURRENTLY idx_attendance_session_status 
ON attendance (session_id, status);

-- Row-level security for multi-tenancy
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_isolation ON sessions 
    FOR ALL TO coaches 
    USING (age_group_id = (SELECT age_group_id FROM coaches WHERE id = current_user_id()));

-- Critical: Enforce complimentary session limit with trigger
CREATE OR REPLACE FUNCTION validate_complimentary_limit() 
RETURNS TRIGGER AS $$
DECLARE
    current_complimentary_count INTEGER;
    session_month INTEGER;
    session_year INTEGER;
BEGIN
    -- Only check for complimentary sessions
    IF NEW.status != 'present_complimentary' THEN
        RETURN NEW;
    END IF;
    
    -- Extract month and year from session
    SELECT EXTRACT(MONTH FROM s.date), EXTRACT(YEAR FROM s.date) 
    INTO session_month, session_year
    FROM sessions s WHERE s.id = NEW.session_id;
    
    -- Count existing complimentary sessions for this player in this month
    SELECT COUNT(*) INTO current_complimentary_count
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    WHERE a.player_id = NEW.player_id 
        AND a.status = 'present_complimentary'
        AND EXTRACT(MONTH FROM s.date) = session_month
        AND EXTRACT(YEAR FROM s.date) = session_year;
    
    -- Fail-fast if limit exceeded
    IF current_complimentary_count >= 3 THEN
        RAISE EXCEPTION 'Player has exceeded monthly complimentary session limit (3)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to prevent data integrity violations
CREATE TRIGGER check_complimentary_limit 
    BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION validate_complimentary_limit();

-- Seed data
INSERT INTO age_groups (id, name, min_age, max_age) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'U-12', 10, 12),
    ('550e8400-e29b-41d4-a716-446655440002', 'U-16', 13, 16);

INSERT INTO coaches (id, username, password_hash, name, age_group_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440011', 'john_doe', '$2b$10$hash1', 'John Doe', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440012', 'jane_smith', '$2b$10$hash2', 'Jane Smith', '550e8400-e29b-41d4-a716-446655440002');
