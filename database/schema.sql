-- Vercel Postgres schema for neco-game

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    character_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    ability VARCHAR(50) NOT NULL,
    max_speed DECIMAL(4,2) NOT NULL,
    acceleration DECIMAL(4,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default characters
INSERT INTO characters (character_key, name, color, ability, max_speed, acceleration, description) VALUES
('shirotama', 'しろたまちゃん', '#FFFFFF', 'leader', 5.0, 0.5, 'リーダーシップを発揮する白い猫'),
('chatarou', 'ちゃたろう', '#D2691E', 'mischief', 6.0, 0.6, 'いたずら好きな茶色い猫'),
('kuromame', 'くろまめ', '#000000', 'night', 5.5, 0.4, '夜行性の黒い猫'),
('mikemi', 'みけみ', '#FF8C00', 'fashion', 4.8, 0.7, 'おしゃれな三毛猫'),
('shio', 'しお', '#808080', 'steady', 4.5, 0.3, '安定感のある灰色の猫'),
('tama', 'たま', '#F5F5DC', 'baby', 5.8, 0.8, '元気いっぱいの子猫')
ON CONFLICT (character_key) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    ability = EXCLUDED.ability,
    max_speed = EXCLUDED.max_speed,
    acceleration = EXCLUDED.acceleration,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Users table (existing)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scores table (existing, but update to reference characters table)
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    character_key VARCHAR(50) NOT NULL REFERENCES characters(character_key),
    time DECIMAL(10,3) NOT NULL,
    stage INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_character_key ON characters(character_key);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_character_key ON scores(character_key);
CREATE INDEX IF NOT EXISTS idx_scores_time ON scores(time);