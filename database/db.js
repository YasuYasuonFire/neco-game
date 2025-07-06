const { sql } = require('@vercel/postgres');

class Database {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize database schema
            await this.createTables();
            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async createTables() {
        // Characters table
        await sql`
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
            )
        `;

        // Users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Scores table
        await sql`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                character_key VARCHAR(50) NOT NULL,
                time DECIMAL(10,3) NOT NULL,
                stage INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_characters_character_key ON characters(character_key)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scores_character_key ON scores(character_key)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scores_time ON scores(time)`;

        // Insert default characters
        await this.insertDefaultCharacters();
    }

    async insertDefaultCharacters() {
        const characters = [
            {
                character_key: 'shirotama',
                name: 'しろたまちゃん',
                color: '#FFFFFF',
                ability: 'leader',
                max_speed: 5.0,
                acceleration: 0.5,
                description: 'リーダーシップを発揮する白い猫'
            },
            {
                character_key: 'chatarou',
                name: 'ちゃたろう',
                color: '#D2691E',
                ability: 'mischief',
                max_speed: 6.0,
                acceleration: 0.6,
                description: 'いたずら好きな茶色い猫'
            },
            {
                character_key: 'kuromame',
                name: 'くろまめ',
                color: '#000000',
                ability: 'night',
                max_speed: 5.5,
                acceleration: 0.4,
                description: '夜行性の黒い猫'
            },
            {
                character_key: 'mikemi',
                name: 'みけみ',
                color: '#FF8C00',
                ability: 'fashion',
                max_speed: 4.8,
                acceleration: 0.7,
                description: 'おしゃれな三毛猫'
            },
            {
                character_key: 'shio',
                name: 'しお',
                color: '#808080',
                ability: 'steady',
                max_speed: 4.5,
                acceleration: 0.3,
                description: '安定感のある灰色の猫'
            },
            {
                character_key: 'tama',
                name: 'たま',
                color: '#F5F5DC',
                ability: 'baby',
                max_speed: 5.8,
                acceleration: 0.8,
                description: '元気いっぱいの子猫'
            }
        ];

        for (const char of characters) {
            await sql`
                INSERT INTO characters (character_key, name, color, ability, max_speed, acceleration, description)
                VALUES (${char.character_key}, ${char.name}, ${char.color}, ${char.ability}, ${char.max_speed}, ${char.acceleration}, ${char.description})
                ON CONFLICT (character_key) DO UPDATE SET
                    name = EXCLUDED.name,
                    color = EXCLUDED.color,
                    ability = EXCLUDED.ability,
                    max_speed = EXCLUDED.max_speed,
                    acceleration = EXCLUDED.acceleration,
                    description = EXCLUDED.description,
                    updated_at = CURRENT_TIMESTAMP
            `;
        }
    }

    // Character operations
    async getAllCharacters() {
        const result = await sql`
            SELECT character_key, name, color, ability, max_speed, acceleration, description
            FROM characters
            ORDER BY character_key
        `;
        return result.rows;
    }

    async getCharacterByKey(characterKey) {
        const result = await sql`
            SELECT character_key, name, color, ability, max_speed, acceleration, description
            FROM characters
            WHERE character_key = ${characterKey}
        `;
        return result.rows[0];
    }

    // User operations
    async createUser(username) {
        const result = await sql`
            INSERT INTO users (username)
            VALUES (${username})
            ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
            RETURNING id, username, created_at
        `;
        return result.rows[0];
    }

    async getUserByUsername(username) {
        const result = await sql`
            SELECT id, username, created_at
            FROM users
            WHERE username = ${username}
        `;
        return result.rows[0];
    }

    async getUserById(userId) {
        const result = await sql`
            SELECT id, username, created_at
            FROM users
            WHERE id = ${userId}
        `;
        return result.rows[0];
    }

    // Score operations
    async saveScore(userId, characterKey, time, stage = 1) {
        const result = await sql`
            INSERT INTO scores (user_id, character_key, time, stage)
            VALUES (${userId}, ${characterKey}, ${time}, ${stage})
            RETURNING id, user_id, character_key, time, stage, created_at
        `;
        return result.rows[0];
    }

    async getLeaderboard(limit = 100) {
        const result = await sql`
            SELECT 
                s.time,
                s.stage,
                s.created_at,
                u.username,
                c.name as character_name,
                c.color as character_color
            FROM scores s
            JOIN users u ON s.user_id = u.id
            JOIN characters c ON s.character_key = c.character_key
            ORDER BY s.time ASC
            LIMIT ${limit}
        `;
        return result.rows;
    }

    async getUserScores(userId) {
        const result = await sql`
            SELECT 
                s.time,
                s.stage,
                s.created_at,
                c.name as character_name,
                c.color as character_color
            FROM scores s
            JOIN characters c ON s.character_key = c.character_key
            WHERE s.user_id = ${userId}
            ORDER BY s.time ASC
        `;
        return result.rows;
    }
}

module.exports = new Database();