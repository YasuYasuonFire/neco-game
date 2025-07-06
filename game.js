class NekoRaceGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.selectedCharacter = null;
        this.gameState = 'menu';
        this.score = 0;
        this.gameStartTime = 0;
        this.elapsedTime = 0;

        this.worldWidth = 3000;
        this.goalX = this.worldWidth - 150;
        this.cameraX = 0;

        this.winner = null;
        this.playerRank = 0;
        
        this.characters = {};
        this.charactersLoaded = false;
        
        this.player = null;
        this.npcs = [];
        this.obstacles = [];
        this.items = [];
        this.particles = [];
        
        this.keys = {};
        this.setupEventListeners();
        this.loadCharacters();
        this.gameLoop();
    }
    
    async loadCharacters() {
        try {
            const response = await fetch('/api/characters');
            const characters = await response.json();
            
            this.characters = {};
            characters.forEach(char => {
                this.characters[char.character_key] = {
                    name: char.name,
                    color: char.color,
                    ability: char.ability,
                    maxSpeed: parseFloat(char.max_speed),
                    acceleration: parseFloat(char.acceleration),
                    description: char.description,
                    x: 50,
                    y: 400
                };
            });
            
            this.charactersLoaded = true;
            console.log('Characters loaded from database:', this.characters);
        } catch (error) {
            console.error('Failed to load characters from database:', error);
            // Fallback to hardcoded characters
            this.loadFallbackCharacters();
        }
    }
    
    loadFallbackCharacters() {
        this.characters = {
            shirotama: { name: 'しろたまちゃん', color: '#FFFFFF', ability: 'leader', maxSpeed: 5, acceleration: 0.5, x: 50, y: 400 },
            chatarou: { name: 'ちゃたろう', color: '#D2691E', ability: 'mischief', maxSpeed: 6, acceleration: 0.6, x: 50, y: 430 },
            kuromame: { name: 'くろまめ', color: '#000000', ability: 'night', maxSpeed: 5.5, acceleration: 0.4, x: 50, y: 460 },
            mikemi: { name: 'みけみ', color: '#FF8C00', ability: 'fashion', maxSpeed: 4.8, acceleration: 0.7, x: 50, y: 490 },
            shio: { name: 'しお', color: '#808080', ability: 'steady', maxSpeed: 4.5, acceleration: 0.3, x: 50, y: 520 },
            tama: { name: 'たま', color: '#F5F5DC', ability: 'baby', maxSpeed: 5.8, acceleration: 0.8, x: 50, y: 550 }
        };
        this.charactersLoaded = true;
        console.log('Using fallback characters');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing' && (e.key === ' ' || e.code === 'Space')) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });
        
        document.querySelectorAll('.character-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.character-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedCharacter = btn.dataset.character;
                document.getElementById('selectedCharacter').textContent = this.characters[this.selectedCharacter].name;
            });
        });
        
        document.getElementById('startBtn').addEventListener('click', (e) => {
            if (this.selectedCharacter) {
                this.startGame();
                e.target.blur();
            } else {
                alert('キャラクターを選択してください！');
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameStartTime = Date.now();
        this.setupRace();
    }
    
    setupRace() {
        this.player = { 
            ...this.characters[this.selectedCharacter], 
            x: 50, 
            y: 300,
            vx: 0,
            vy: 0,
            onGround: true,
            specialCooldown: 0,
            jumpPressed: false,
            jumpTime: 0,
            maxJumpTime: 20,
            friction: 0.85,
            groundFriction: 0.8
        };
        
        this.npcs = [];
        const npcKeys = Object.keys(this.characters).filter(key => key !== this.selectedCharacter);
        
        for (let i = 0; i < 3; i++) {
            const npcKey = npcKeys[i];
            if (npcKey) {
                this.npcs.push({
                    ...this.characters[npcKey],
                    x: 50 + Math.random() * 30,
                    y: 330 + i * 30,
                    vx: 0,
                    vy: 0,
                    onGround: true,
                    ai: true,
                    friction: 0.85,
                    groundFriction: 0.8
                });
            }
        }
        
        this.generateObstacles();
        this.generateItems();
    }
    
    generateObstacles() {
        this.obstacles = [];
        // 地面の障害物
        for (let i = 0; i < this.worldWidth / 200; i++) {
            this.obstacles.push({
                x: 400 + i * 200 + Math.random() * 80,
                y: 490,
                width: 30,
                height: 30,
                type: 'box'
            });
        }
        // 空中のプラットフォーム
        for (let i = 0; i < this.worldWidth / 300; i++) {
            this.obstacles.push({
                x: 300 + i * 300 + Math.random() * 100,
                y: 350 + Math.random() * 100,
                width: 80,
                height: 20,
                type: 'platform'
            });
        }
    }

    generateItems() {
        this.items = [];
        for (let i = 0; i < this.worldWidth / 150; i++) {
            this.items.push({
                x: 250 + i * 150 + Math.random() * 50,
                y: 250 + Math.random() * 200,
                width: 20,
                height: 20,
                type: ['speed', 'jump', 'star'][Math.floor(Math.random() * 3)],
                collected: false
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;

        this.elapsedTime = (Date.now() - this.gameStartTime) / 1000;

        this.updatePlayer();
        this.updateNPCs();
        this.updateCamera();
        this.updateParticles();
        this.checkCollisions();
        this.checkGoal();
    }

    checkGoal() {
        const characters = [this.player, ...this.npcs];
        let finishedCharacter = null;

        for (const char of characters) {
            if (char.x >= this.goalX) {
                finishedCharacter = char;
                break;
            }
        }

        if (finishedCharacter) {
            this.gameState = 'finished';
            this.winner = finishedCharacter;

            // 順位の計算
            const sortedCharacters = [...characters].sort((a, b) => b.x - a.x);
            this.playerRank = sortedCharacters.findIndex(c => c === this.player) + 1;
        }
    }
    
    updatePlayer() {
        if (!this.player) return;
        
        // 左右移動（マリオ風の加速・減速）
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.vx -= this.player.acceleration;
            if (this.player.vx < -this.player.maxSpeed) {
                this.player.vx = -this.player.maxSpeed;
            }
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.vx += this.player.acceleration;
            if (this.player.vx > this.player.maxSpeed) {
                this.player.vx = this.player.maxSpeed;
            }
        } else {
            // 何も押していない時の摩擦
            if (this.player.onGround) {
                this.player.vx *= this.player.groundFriction;
            } else {
                this.player.vx *= this.player.friction;
            }
        }
        
        // ジャンプ（長押しで高くジャンプ）
        const jumpKey = this.keys[' '] || this.keys['Space'];
        
        if (jumpKey && !this.player.jumpPressed && this.player.onGround) {
            this.player.vy = -15;
            this.player.onGround = false;
            this.player.jumpPressed = true;
            this.player.jumpTime = 0;
        }
        
        if (jumpKey && this.player.jumpPressed && this.player.jumpTime < this.player.maxJumpTime && this.player.vy < 0) {
            this.player.vy -= 0.8;
            this.player.jumpTime++;
        }
        
        if (!jumpKey) {
            this.player.jumpPressed = false;
        }
        
        // 特殊能力
        if (this.keys['Shift'] && this.player.specialCooldown <= 0) {
            this.useSpecialAbility();
            this.player.specialCooldown = 180;
        }
        
        if (this.player.specialCooldown > 0) {
            this.player.specialCooldown--;
        }
        
        // 重力
        this.player.vy += 0.8;
        
        // 最大落下速度の制限
        if (this.player.vy > 15) {
            this.player.vy = 15;
        }
        
        // 位置更新
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // 地面判定
        if (this.player.y > 520) {
            this.player.y = 520;
            this.player.vy = 0;
            this.player.onGround = true;
            this.player.jumpPressed = false;
        }
        
        // 画面端判定
        this.player.x = Math.max(0, Math.min(this.worldWidth - 30, this.player.x));
    }

    updateCamera() {
        if (!this.player) return;

        const targetCameraX = this.player.x - this.canvas.width / 3;
        
        // カメラのスムーズな移動
        const easing = 0.1;
        this.cameraX += (targetCameraX - this.cameraX) * easing;

        // カメラがワールドの範囲外に出ないように制限
        this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));
    }
    
    updateNPCs() {
        this.npcs.forEach(npc => {
            // NPCの簡単なAI
            if (!npc.vx) npc.vx = 0;
            if (!npc.vy) npc.vy = 0;
            if (!npc.onGround) npc.onGround = true;
            
            // 前進
            npc.vx += 0.2;
            if (npc.vx > npc.maxSpeed * 0.8) {
                npc.vx = npc.maxSpeed * 0.8;
            }
            
            // ランダムジャンプ
            if (Math.random() < 0.008 && npc.onGround) {
                npc.vy = -12;
                npc.onGround = false;
            }
            
            // 重力
            npc.vy += 0.8;
            
            // 最大落下速度の制限
            if (npc.vy > 15) {
                npc.vy = 15;
            }
            
            // 位置更新
            npc.x += npc.vx;
            npc.y += npc.vy;
            
            // 地面判定
            if (npc.y > 520) {
                npc.y = 520;
                npc.vy = 0;
                npc.onGround = true;
            }
            
            // 画面端判定
            npc.x = Math.max(0, Math.min(this.canvas.width - 30, npc.x));
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    useSpecialAbility() {
        const ability = this.player.ability;
        
        switch (ability) {
            case 'leader':
                this.player.speed *= 1.5;
                setTimeout(() => this.player.speed /= 1.5, 3000);
                break;
            case 'mischief':
                this.score += 50;
                break;
            case 'night':
                this.player.speed *= 1.3;
                setTimeout(() => this.player.speed /= 1.3, 4000);
                break;
            case 'fashion':
                this.score += 30;
                break;
            case 'steady':
                this.player.vx = this.player.speed;
                break;
            case 'baby':
                this.player.speed *= 2;
                setTimeout(() => this.player.speed /= 2, 2000);
                break;
        }
        
        this.createParticles(this.player.x, this.player.y, this.player.color);
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + 15,
                y: y + 15,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: color,
                life: 30
            });
        }
    }
    
    checkCollisions() {
        this.items.forEach(item => {
            if (!item.collected && this.isColliding(this.player, item)) {
                item.collected = true;
                this.score += 100;
                this.createParticles(item.x, item.y, '#FFD700');
            }
        });
        
        this.obstacles.forEach(obstacle => {
            if (this.isColliding(this.player, obstacle)) {
                if (obstacle.type === 'platform') {
                    // プラットフォームの上に乗る
                    if (this.player.vy > 0 && this.player.y < obstacle.y) {
                        this.player.y = obstacle.y - 30;
                        this.player.vy = 0;
                        this.player.onGround = true;
                        this.player.jumpPressed = false;
                    }
                } else {
                    // 通常の障害物
                    if (this.player.vx > 0) {
                        this.player.x = obstacle.x - 30;
                    } else if (this.player.vx < 0) {
                        this.player.x = obstacle.x + obstacle.width;
                    }
                    this.player.vx = 0;
                }
            }
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + 30 > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + 30 > obj2.y;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        this.drawBackground();

        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing' || this.gameState === 'finished') {
            this.drawGame();
        } 

        this.ctx.restore();

        if (this.gameState === 'finished') {
            this.drawGameOver();
        } else {
            this.drawRaceInfo();
        }
    }
    
    drawBackground() {
        // 背景色
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(this.cameraX, 0, this.canvas.width, this.canvas.height);

        // 遠景（動かない）
        this.ctx.fillStyle = '#B0E0E6';
        for (let i = 0; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 300, 400 + Math.sin(i) * 50);
            this.ctx.lineTo(i * 300 + 300, 400 + Math.cos(i) * 50);
            this.ctx.lineTo(i * 300 + 150, 300 + Math.sin(i*2) * 50);
            this.ctx.fill();
        }

        // 中景（少し動く）
        const midgroundX = this.cameraX * 0.5;
        this.ctx.fillStyle = '#98FB98';
        for (let i = 0; i < this.worldWidth / 200; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(i * 200 - midgroundX % 200, 500, 100, 50, 0, Math.PI, 0);
            this.ctx.fill();
        }

        // 地面
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 540, this.worldWidth, 60);

        // ゴールライン
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.goalX, 0, 10, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GOAL', this.goalX + 5, 50);
    }
    
    drawMenu() {
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.font = "48px 'Fredoka One', cursive";
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ゲーム開始を押してね！', this.cameraX + this.canvas.width / 2, this.canvas.height / 2);
    }
    
    drawGame() {
        this.drawObstacles();
        this.drawItems();
        this.drawCharacters();
        this.drawParticles();
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'platform') {
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                // プラットフォームの縁取り
                this.ctx.strokeStyle = '#228B22';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
    }
    
    drawItems() {
        this.items.forEach(item => {
            if (!item.collected) {
                this.ctx.fillStyle = item.type === 'speed' ? '#FFD700' : 
                                   item.type === 'jump' ? '#00FF00' : '#FF69B4';
                this.ctx.fillRect(item.x, item.y, item.width, item.height);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                const symbol = item.type === 'speed' ? '⚡' : 
                              item.type === 'jump' ? '↑' : '★';
                this.ctx.fillText(symbol, item.x + 10, item.y + 15);
            }
        });
    }
    
    drawCharacters() {
        if (this.player) {
            this.drawCharacter(this.player, true);
        }
        
        this.npcs.forEach(npc => {
            this.drawCharacter(npc, false);
        });
    }
    
    drawCharacter(character, isPlayer) {
        const x = character.x;
        const y = character.y;
        const size = 30;
        
        // 猫の体（楕円形）
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/2, size/2, size/2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫の頭（円形）
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/3, size/2.2, size/2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫の耳（三角形）
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + 8);
        this.ctx.lineTo(x + 12, y - 2);
        this.ctx.lineTo(x + 15, y + 8);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 8);
        this.ctx.lineTo(x + 22, y - 2);
        this.ctx.lineTo(x + 25, y + 8);
        this.ctx.fill();
        
        // 耳の内側（ピンク）
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 7, y + 6);
        this.ctx.lineTo(x + 11, y + 2);
        this.ctx.lineTo(x + 13, y + 6);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 17, y + 6);
        this.ctx.lineTo(x + 21, y + 2);
        this.ctx.lineTo(x + 23, y + 6);
        this.ctx.fill();
        
        // 猫の目
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 9, y + 12, 3, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + 21, y + 12, 3, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 目の光
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 10, y + 10, 1, 1.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + 22, y + 10, 1, 1.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 猫の鼻（三角形）
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 16);
        this.ctx.lineTo(x + 13, y + 19);
        this.ctx.lineTo(x + 17, y + 19);
        this.ctx.fill();
        
        // 猫の口
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 19);
        this.ctx.lineTo(x + 12, y + 22);
        this.ctx.moveTo(x + 15, y + 19);
        this.ctx.lineTo(x + 18, y + 22);
        this.ctx.stroke();
        
        // ひげ
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 2, y + 15);
        this.ctx.lineTo(x + 8, y + 16);
        this.ctx.moveTo(x + 2, y + 18);
        this.ctx.lineTo(x + 8, y + 18);
        this.ctx.moveTo(x + 22, y + 16);
        this.ctx.lineTo(x + 28, y + 15);
        this.ctx.moveTo(x + 22, y + 18);
        this.ctx.lineTo(x + 28, y + 18);
        this.ctx.stroke();
        
        // 猫の尻尾
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(x + 5, y + 22, 3, 8, -0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // プレイヤーの場合は枠を描画
        if (isPlayer) {
            this.ctx.strokeStyle = '#FF1493';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x - 2, y - 2, 34, 34);
        }
        
        // 名前表示
        this.ctx.fillStyle = '#333333';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name, x + 15, y - 5);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawRaceInfo() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = "24px 'Fredoka One', cursive";
        this.ctx.textAlign = 'left';

        // 経過時間
        this.ctx.fillText(`Time: ${this.elapsedTime.toFixed(2)}`, 20, 40);

        // ゴールまでのプログレスバー
        const progress = this.player ? this.player.x / this.goalX : 0;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.canvas.width / 4, 20, this.canvas.width / 2, 20);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.canvas.width / 4, 20, (this.canvas.width / 2) * progress, 20);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.strokeRect(this.canvas.width / 4, 20, this.canvas.width / 2, 20);

        // プレイヤーアイコン
        if (this.player) {
            this.ctx.fillStyle = this.player.color;
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width / 4 + (this.canvas.width / 2) * progress, 30, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.cameraX, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = "48px 'Fredoka One', cursive";
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FINISH!', this.cameraX + this.canvas.width / 2, this.canvas.height / 2 - 100);

        if (this.winner) {
            this.ctx.font = "36px 'Fredoka One', cursive";
            this.ctx.fillText(`Winner: ${this.winner.name}`, this.cameraX + this.canvas.width / 2, this.canvas.height / 2 - 20);
        }

        this.ctx.font = "28px 'Nunito', sans-serif";
        this.ctx.fillText(`Your Rank: ${this.playerRank}位`, this.cameraX + this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.font = "20px 'Nunito', sans-serif";
        this.ctx.fillText(`Time: ${this.elapsedTime.toFixed(2)}s`, this.cameraX + this.canvas.width / 2, this.canvas.height / 2 + 100);

        this.ctx.font = "20px 'Nunito', sans-serif";
        this.ctx.fillText('F5キーでリロードしてもう一度！', this.cameraX + this.canvas.width / 2, this.canvas.height / 2 + 150);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NekoRaceGame();
});