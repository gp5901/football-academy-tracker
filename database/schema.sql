-- Production-grade database schema with proper constraints and indexing
-- Enforce business rules at database level for data integrity

-- Age groups table
CREATE TABLE age_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- U-12, U-16, etc.
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coaches table with proper security
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    monthly_sessions_booked INTEGER NOT NULL DEFAULT 12,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'evening')),
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    coach_id UUID NOT NULL REFERENCES coaches(id),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table with version for optimistic locking
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    player_id UUID NOT NULL REFERENCES players(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('present_regular', 'present_complimentary', 'absent')),
    photo_url TEXT,
    version INTEGER DEFAULT 1,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate attendance records
    UNIQUE(session_id, player_id)
);

-- Critical indexes for O(1) query performance
CREATE INDEX CONCURRENTLY idx_attendance_player_month 
    ON attendance (player_id, EXTRACT(MONTH FROM (SELECT date FROM sessions WHERE id = session_id)));

CREATE INDEX CONCURRENTLY idx_sessions_coach_date 
    ON sessions (coach_id, date DESC);

CREATE INDEX CONCURRENTLY idx_players_age_group 
    ON players (age_group_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_attendance_session_status 
    ON attendance (session_id, status);

-- Row-level security for multi-tenancy
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Coaches can only access their age group data
CREATE POLICY coach_session_isolation ON sessions
    FOR ALL TO coaches
    USING (age_group_id = (SELECT age_group_id FROM coaches WHERE id = current_setting('app.current_coach_id')::UUID));

-- Critical: Enforce complimentary session limit with trigger
CREATE OR REPLACE FUNCTION validate_complimentary_limit() 
RETURNS TRIGGER AS $$
DECLARE
    current_complimentary_count INTEGER;
    session_month INTEGER;
    session_year INTEGER;
BEGIN
    -- Only validate for complimentary sessions
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
        AND EXTRACT(YEAR FROM s.date) = session_year
        AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
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

-- Seed data for development
INSERT INTO age_groups (id, name, min_age, max_age) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'U-12', 10, 12),
    ('550e8400-e29b-41d4-a716-446655440002', 'U-16', 13, 16);

-- Insert coaches (password is 'password123' hashed with bcrypt)
INSERT INTO coaches (id, username, password_hash, name, email, age_group_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 'john_doe', '$2b$10$rQZ8kHWKtGOuGwkWvdqNKOvRl5r5r5r5r5r5r5r5r5r5r5r5r5r5r', 'John Doe', 'john@academy.com', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440004', 'jane_smith', '$2b$10$rQZ8kHWKtGOuGwkWvdqNKOvRl5r5r5r5r5r5r5r5r5r5r5r5r5r5r', 'Jane Smith', 'jane@academy.com', '550e8400-e29b-41d4-a716-446655440002');
