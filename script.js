const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WORDS = ['signal','orbit','prism','quartz','ember','velvet','nebula','cipher','harbor','lantern','meadow','river','zephyr','compass','glacier','anchor','pixel','matrix','tundra','vortex'];

const HARD_WORDS = ['telescope','horizon','labyrinth','spectrum','paradox','symphony','crescendo','ephemeral','kaleidoscope','luminescent','metamorphosis','quintessential','resonance','serendipity','transcendence'];

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();
let actx = null;
let muted = false;
function initAudio()
{
    if (!actx)
    {
        try {
            actx = new(window.AudioContext || window.webkitAudioContext)();
        } catch (e) 
        {
            
        }
        
    }
    if (actx && actx.state === 'suspended')
{
        actx.resume();
    }
}
function tone(freq, dur = 0.12, type = 'sine', vol = 0.12, endFreq = freq, delay = 0)
{
    if (!actx || muted)
        { return;
}
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
}
const note = n => 261.63 * Math.pow(2,n/12);
const PENTA = [0,2,4,7,9];
const comboNote = c => 
{
    const i = Math.min(c,14);
    return note(PENTA[i % 5] + 12 * Math.floor(i/5));
};

let words = [];
let input = '';
let spawnTimer = 0;
let START_LIVES = 8;
let lives = START_LIVES;
let gameOver = false;
let scene = 'menu';
const DIFFS = {
    1: {name: 'CHILL', spawn: 1.3, speed: 0.75, lives: 10, normal: 12, mirror: 6},
    2: {name: 'NORMAL', spawn: 1, speed: 1, lives: 8, normal: 12, mirror: 6},
    3: {name: 'HARD', spawn: 0.8, speed: 1.25, lives: 5, normal: 9, mirror: 6},
};
let diffKey = 2;
let diff = DIFFS[2];
let high = 0;
try
{
    high = +localStorage.getItem('mirror-typing-best') || 0;

}
 catch(e)
 {
    console.error('Error loading high score:', e);
}
let newBest = false;
const stats = {
    words: 0,
    bestCombo: 0,
    keys:0,
    typos: 0,
};
let score = 0;
let combo = 0;
let mirror = false;
let NORMAL_TIMER = 12;
let MIRROR_TIME = 6;
let phaseTimer = NORMAL_TIMER;

const reverse = s => s.split('').reverse().join('');

function target(w) 
{
    return mirror ? reverse(w.text) : w.text;
}

function spawn() 
{
    let text;
    do
    {
        const pool = level >= 3 ? WORDS.concat(HARD_WORDS) : WORDS;
        text = pool[Math.floor(Math.random() * pool.length)];
    }
    while(words.some(w=>w.text === text));
    {
        const r = Math.random();
        const kind = r < 0.05 ? 'ice' : r < 0.09 ? 'bomb' : r < 0.13 ? 'shield' : null;

       words.push({ text, x: Math.random() * (canvas.width - text.length * CHAR_W - 20), y: -30, age:0, gold: !kind && Math.random() < 0.1, kind });


    }
}
const CHAR_W = 15.6;
let particles = [];
let popups = [];
let rings = [];
let banner = {text: '', life: 0, color: '#fff'};
let phaseMix = 0;//adjust remaining(remainder)
let lastTick = 0;
let perfect = 0;
let shield = 0;
let paused = false;
let runTime = 0;
let level = 1;
let musicTimer = 0;
let musicStep = 0;
let heartTimer = 0;
let freezeTimer = 0;
let fever = 0;  
let feverTimer = 0;
const FEVER_TIME = 8;
const stars = Array.from({length: 90},() => ({x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8}));
let shake = 0;
let flash = 0;
let flashColor = '255,77,77';
let badTimer = 0;
let scorePulse = 0;
let shownScore = 0;

function burst(x, y, color, n=18)
{
    for (let i=0; i < n; i++)
    {
        const a = Math.random() * Math.PI * 2;
        const s = 80 + Math.random() * 260;
        particles.push(
            {
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) *s - 80, life: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 4, color
            }
        );
    }
}
function popup(x, y, text, color = '#ffe14d', size = 26)
{
    popups.push({x,y,text,color,size,life: 0.9});
}
function mixColor(a, b)
{
    return 'rgb(' + a.map((v, i) => Math.round(v +(b[i] - v) * phaseMix)).join(',') + ')';
}
function drawStars()
{
    ctx.fillStyle = mirror ? '#ffb3ec' : '#cfe3ff';
    for (const s of stars)
    {
        ctx.globalAlpha = 0.25 + s.z * 0.5;
        ctx.fillRect(s.x * canvas.width, s.y * canvas.height, s.z * 2.5,s.z*2.5);
    }
    ctx.globalAlpha = 1;
}
function drawHeart(x,y,s,color)
{
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x,y + s * 0.9);
    ctx.bezierCurveTo(x-s * 1.4,y-s * 0.2, x-s * 0.6, y-s *1.1,x,y-s*0.3);
    ctx.bezierCurveTo(x+s * 0.6,y-s * 1.1, x+s * 1.4, y-s *0.2,x,y+s*0.9);
    ctx.fill();

}
function drawBanner()
{
    ctx.textAlign = 'center';
    if (banner.life)
    {
       ctx.globalAlpha = Math.min(1,banner.life * 1.5);
       ctx.fillStyle = banner.color; 
       ctx.shadowColor = banner.color;
       ctx.shadowBlur = 30;
       ctx.font = 'bold ' + Math.round(70 + (1.4-banner.life) * 30) + 'px monospace';
       ctx.fillText(banner.text, canvas.width/2,canvas.height/2 + 60);

    }
    if(!gameOver && phaseTimer <= 3)
    {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 0;
        ctx.font = 'bold 40px monospace';
        ctx.fillText((mirror ? 'NORMAL IN ' : 'MIRROR IN ') + Math.ceil(phaseTimer) , canvas.width/2,canvas.height/2 + 60);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

function updateFx(dt)
{
    phaseMix +=((mirror ? 1:0) - phaseMix) * Math.min(1,dt * 3);
    banner.life = Math.max(0,banner.life - dt);
    freezeTimer = Math.max(0,freezeTimer - dt);
    if (feverTimer > 0)
    {
        feverTimer -= dt;
        fever = Math.max(0,feverTimer / FEVER_TIME);
        if (feverTimer <= 0)
        {
            feverTimer = 0;
            fever = 0;
        }
    }
    for(const r of rings)
    {
        r.life -= dt;
        r.r += 500 * dt;
    }
    rings = rings.filter(r => r.life > 0);
    for(const s of stars)
    {
        s.y += (mirror ? -1 : 1) * s.z * dt * 0.08;
        if (s.y > 1) {
            s.y -= 1;
        }
        if (s.y < 0) {
            s.y += 1;
        }
    }
    
    shake *= Math.pow(0.002, dt);
    if (shake < 0.1) {
        shake = 0;
    }
        
        flash = Math.max(0,flash - dt * 2.5);
        badTimer = Math.max(0,badTimer - dt);
        scorePulse = Math.max(0, scorePulse - dt * 4);
        shownScore += (score - shownScore) * Math.min(1,dt * 10);
        if (Math.abs(score - shownScore) < 0.5)
             {
            shownScore = score;
        }
    
    for(const p of particles)
    {
        p.life -= dt;
        p.vy += 600 * dt;
        p.x += p.vx *dt;
        p.y += p.vy *dt;
    }
    particles = particles.filter(p=>p.life > 0);
    for (const p of popups)
    {
        p.life -= dt;
        p.y -= 60 * dt;
    }
    popups = popups.filter(p =>p.life > 0);
}
function drawFx(dt)
{

    for(const r of rings)
    {
        ctx.globalAlpha = Math.max(0,r.life * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x,r.y,r.r,0,Math.PI * 2);
        ctx.stroke();
    }
    for(const p of particles)
    {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
    }
    for(const p of popups)
    {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.font = 'bold ' + p.size + 'px monospace';
        ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
}
function centerText(text,x,y, size, color)
{
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
}
function drawMenu()
{
    const cx = canvas.width/2, cy = canvas.height/2;
    const bob = Math.sin(performance.now() / 500) * 6;
    ctx.shadowColor = '#6bd6ff';
    ctx.shadowBlur = 24;
    centerText('MIRROR TYPING', cx, cy - 110 + bob, 64, '#e6f4ff');
    ctx.shadowBlur = 0;
    centerText('type the falling words - when the screen turns pink, they flip!', cx, cy - 65 , 20, '#aaa');
    for(const k in DIFFS)
    {
        const on = +k === diffKey;
        centerText((on ? '> ' : ' ') + k + ' ' + DIFFS[k].name, cx, cy + 10 + k*38,28, on ? '#4dff88' : '#e6f4ff');
        
    }
    centerText('press 1 / 2 / 3   (Enter = ' + DIFFS[diffKey].name + ')', cx, cy + 170, 18, '#aaa');
    centerText('best score: ' + high, cx, cy + 205, 20, '#ffd700');

}
const RANK_COLORS = { S: '#ffd700' , A: '#4dff88', B: '#6bd6ff', C:'#aaaaaa'};
function calcWpm()
{
    return runTime < 5 ? 0 : Math.round((stats.keys / 5) / (runTime / 60));

}
function calcAcc()
{
    const total = stats.keys + stats.typos;
    return total ? Math.round(100 * stats.keys / total) : 100;
}
function calcRank()
{
    const a = calcAcc();
    if (score >= 3000 && a>= 95)
         {
        return 'S';
    }
    if (score >= 1500 && a>= 90)
         {
        return 'A';
    }
    if (score >= 600)
         {
        return 'B';
    }
    return 'C';
}
function startGame(key)
{
    diffKey = key;
    diff = DIFFS[diffKey];
    START_LIVES = diff.lives;
    NORMAL_TIMER = diff.normal;
    MIRROR_TIME = diff.mirror;
    scene = 'play';
    reset();
}
function reset() 
{
       newBest = false;
   stats.words = 0;
   stats.bestCombo = 0;
   stats.keys = 0;
   stats.typos = 0;
   runTime = 0;
    words = [];
    particles = [];
    popups = [];
    rings = [];
    banner.life = 0;
    phaseMix = 0;
    document.body.classList.remove('mirror');
    shake = flash = badTimer = scorePulse = shownScore = 0;
    fever = feverTimer = 0;
    perfect = 0;
    shield = 0;
    paused = false;
    level = 1;
    musicTimer = musicStep = heartTimer = 0;
    freezeTimer = 0;

    input = '';
    spawnTimer = 0;
    lives = START_LIVES;
    gameOver = false;
    score = 0;
    combo = 0;
    mirror = false;
    phaseTimer = NORMAL_TIMER;
}

function active()
{
    let best = null;
    for(const w of words)
    {
        if (input && target(w).startsWith(input) && (!best || w.y >best.y)) 
            {
            best = w;
        }
        
    }
    return best;
}
function startFever()
{
    feverTimer = FEVER_TIME;
    fever = 1;
    banner = { text: 'FEVER!', life: 1.4, color: '#ffd700'};
    flash = 0.6;
    flashColor = '255,215,0';
    shake = 20;
    rings.push({ x: canvas.width/2, y: canvas.height/2, r: 20, life: 0.9, color: '#ffd700'});
    [0,4,7,12,16,19].forEach((n,i) => tone(note(n+12), 0.3, 'triangle', 0.09, undefined, i*0.05));

}
function levelUp(n)
{
level = n;
if ( lives < START_LIVES)
{
    lives++;
}
banner = { text: 'LEVEL ' + n, life: 1.4, color: '#4dff88'};
rings.push({ x: canvas.width/2, y: canvas.height/2, r: 20, life: 0.9, color: '#4dff88'});
flash = 0.4;
flashColor = '77,255,136';
shake = 16;
[0, 4, 7, 12].forEach((m,i) => tone(note(m+12), 0.2, 'triangle', 0.1, undefined, i * 0.07));

}
function killWord(w)
{
    const t = target(w);
    let pts = (mirror ? 25 : 10) * (1+Math.floor(combo/5)) * (w.gold ? 5 : 1);
    if(feverTimer > 0)
    {
        pts *= 2;
    }
    const cx = w.x + t.length * CHAR_W/2;
    burst(cx, w.y - 9,mirror ? '#ff6bd6' : '#4dff88', 22);
    popup(cx - 20, w.y - 30, '+' + pts, '#ffe14d',26);
    rings.push(
        {
            x:cx, y: w.y - 9, r: 10, life: 0.4, color: mirror ? '#ff6bd6' : '#4dff88'
        }
    );
    words.splice(words.indexOf(w), 1);
    score += pts;
    if (w.y < canvas.height * 0.3) 
    {
      score+=5;
      popup(cx - 20, w.y - 55, 'FAST + 5', '#6bd6ff', 20);    
    }
    if(w.gold)
    {
        if(lives < START_LIVES)
        {
            lives++;
        }
        burst(cx, w.y - 9, '#ffd700', 40);
        popup(cx - 40, w.y - 60, 'BONUS +1 LIFE', '#ffd700',24);
        [0, 4, 7, 12].forEach((n,i) => tone(note(n+12), 0.2, 'triangle', 0.09, undefined, i*0.05));

    }
    scorePulse = 1;
    if (w.kind === 'shield') 
    {
      shield = Math.min(shield + 1,3);
      popup(cx - 40, w.y - 60, 'SHIELD + 1', '#7dffb0', 28);
      burst(cx, w.y - 9, '#7dffb0', 30);
      [0,7,12].forEach((n,i) => tone(note(n+ 12), 0.2, 'sine', 0.1, undefined, i * 0.06));  
    }
    shake = Math.min(shake + 3,14);
    if(w.kind === 'ice')
    {
        freezeTimer = 4;
        popup(cx - 40, w.y - 60, 'FREEZE!', '#6bd6ff', 30);
        burst(cx, w.y - 9, '#9be8ff', 40);
        [12,9,5,0].forEach((n,i) => tone(note(n+12), 0.25, 'sine', 0.1, undefined, i*0.06));

    }
       if(w.kind === 'bomb')
   {
       const n = words.length;
       for(const v of words)
       {
           burst(v.x + 40, v.y - 9, '#ff9f1c', 18);
       }
       score += n*10;
       stats.words += n;
       popup(canvas.width/2 - 80, canvas.height/2 - 60, 'BOOM! +' + n*10, '#ff9f1c', 40);
       words = [];
       shake = 30;
       flash = 0.7;
       flashColor = '255,159,28';
       tone(80, 0.5, 'sawtooth', 0.2, 30);
   }
    combo ++;
    perfect ++;
    if (perfect % 5 === 0) 
    {
      score += 50;
      popup(canvas.width / 2 - 120, canvas.height / 2 + 50, 'PERFECT x' + perfect + '  +50', '#4dff88', 30);
    }
    if(feverTimer <= 0)
    {
        fever = Math.min(1,fever + 0.08);
        if(fever >= 1)
        {
            startFever();
        }
    }
    stats.words++;
    stats.bestCombo = Math.max(stats.bestCombo, combo);
    const newLevel = 1+ Math.floor(stats.words / 12);   
    if (newLevel > level)
        {
            levelUp(newLevel);
        }                
    tone(comboNote(combo), 0.18, 'square',0.07);
    tone(comboNote(combo) * 2,0.12,'sine', 0.06, undefined, 0.05);
    input = '';
    if (combo % 5 === 0)
     {
    popup(canvas.width/2-90,canvas.height/2,'COMBO ' + combo + '!', '#ff9f1c', 44);   
    [0,4,7,12].forEach((n,i) => tone(note(n+12), 0.25, 'triangle', 0.08, undefined, i*0.06));
    shake = 14;
    flash = 0.5;
    flashColor = '255,159,28' 
    }
}
addEventListener('keydown', e => 
    {
        initAudio();
        if (e.key === 'Tab')
        {
            e.preventDefault();
            muted = !muted;
            return;
        }
    if (scene === 'menu')
        {
            if(DIFFS[e.key])
            {
                startGame(+e.key);
            }
            else if(e.key === 'Enter')
            {
                startGame(diffKey);
            }
            return;
        }    
    if (gameOver) 
    {
        if (e.key === 'Enter') reset();
        else if (e.key === 'Escape')
        {
               mirror = false;
            phaseMix = 0;
            document.body.classList.remove('mirror');
            scene = 'menu';
        }
        return;
    }
    if (e.key === 'Enter')
    {
        paused = !paused;
        return;
    }
    if (paused) 
    {
      return;  
    }
    
     if (e.key === 'Backspace') 
    {
        input = input.slice(0, -1);
    }
    else if(e.key === 'Escape')
    {
        input = '';
    }
    else if (/^[a-z]$/i.test(e.key)) 
        {
        const next = input + e.key.toLowerCase();
        if (words.some(w => target(w).startsWith(next)))
        {
            input = next;
            stats.keys++;
            tone(520 + input.length * 60,0.06, 'triangle', 0.08);
            const a = active();
            if (a)
                 {
                burst(a.x + (input.length - 0.5) * CHAR_W, a.y - 9, '#4dff88',4);
            }
            const hit = words.find(w => target(w) === input);
            if (hit) {
                killWord(hit);
            }
        }
        else
            {
                shake = Math.min(shake + 4,12);
                badTimer = 0.25;
                perfect = 0;
                stats.typos ++;
                tone(110,0.12,'sawtooth',0.08,80);
            }
        
    }
});
addEventListener ('blur', () =>
{
    if (scene === 'play' && !gameOver) 
    {
    paused = true;    
    }
})
function updateMusic(dt)
{
    heartTimer -= dt;
   if (lives > 0 && lives <= 2 && heartTimer <= 0)
   {
       heartTimer = 0.8;
       tone(55, 0.12, 'sine', 0.25, 40);
       tone(55, 0.12, 'sine', 0.2, 40, 0.18);
   }
    musicTimer -= dt;
    if (musicTimer > 0)
    {
        return;
    }
    const bpm = 100 + Math.min(combo, 20) * 3 + (mirror ? 10: 0) + (feverTimer > 0 ? 20 : 0);
    musicTimer = 60 / bpm / 2;
    const s = musicStep ++ % 16;
    const bass = mirror ? [0,0,3,0,5,3,0,7] : [0,0,7,0,5,0,3,5];
    if (s % 4 === 0)
    {
        tone(60, 0.15, 'sine', 0.18, 35);
    }
    if (s % 2 === 1)
    {
        tone(7000, 0.03, 'square', 0.012);
    }
    if(s% 2 === 0)
    {
        tone(note(bass[(s/2) % 8] - 24), 0.18, 'triangle', 0.08);

    }
    if (combo >= 5 && s% 2 === 1)
    {
        tone(note(PENTA[s % 5] + 12), 0.08, 'square', 0.025);

    }
}

function update(dt) 
{
    updateFx(dt);
    if (gameOver || scene === 'menu' || paused)
        {
            return;
        }
updateMusic(dt);
    phaseTimer -= dt;
    runTime += dt;
    const tick = Math.ceil(phaseTimer);
    if (tick <= 3 && tick !=lastTick)
         {
        lastTick = tick;
        tone(880,0.08,'square',0.06);
    }
    if (phaseTimer <= 0) 
    {
        mirror = !mirror;
        input = '';
        document.body.classList.toggle('mirror',mirror);
        rings.push(
            {
                x:canvas.width/2,y: canvas.height/2,r:20,life:0.9, color:mirror? '#ff6bd6' : '#6bd6ff'
            }
        );
        banner = {text:mirror ? 'MIRROR!' : 'NORMAL',life : 1.4,color: mirror? '#ff6bd6' : '#6bd6ff'};
        canvas.classList.remove('pop');
        void canvas.offsetWidth;
        canvas.classList.add('pop');
        tone(mirror ? 200:700, 0.5, 'sine', 0.15,mirror ? 900 : 150);
        phaseTimer = mirror ? MIRROR_TIME : NORMAL_TIMER;
    }

    spawnTimer -= freezeTimer > 0 ? 0 : dt;
    if (spawnTimer <= 0) 
    {
        spawn();
        spawnTimer = Math.max(1.3, 2.6 - score / 600) * diff.spawn;

    }

    const speed = (32 + Math.min(score * 0.05, 40)) * diff.speed * Math.min(1.6,1 + 0.04 * (level - 1)) * (freezeTimer > 0 ? 0 : 1);
    for (const w of words)
       { 
         w.y += speed * dt;
         w.age += dt;
       }
    const floor = canvas.height - 100;
    const lost = words.filter(w=>w.y>=floor);
    
    words = words.filter(w => w.y < floor);
    const missed = lost.length;
    for(const w of lost)
    {
        burst(w.x + 40, floor, '#ff4d4d',16);

    }
    if (missed) 
    {
        let absorbed = 0;
        while(shield > 0 && absorbed < missed)
        {
            shield--;
            absorbed++;
        }
        lives -= missed - absorbed;
        if (combo >= 5) popup(canvas.width / 2 - 110, canvas.height / 2, 'COMBO LOST', '#ff4d4d', 40);
        if (absorbed) 
        {
            popup(canvas.width/2 - 100, canvas.height / 2-60, 'SHIELD BLOCKED!', '#7dffb0', 30);
        }
        
        combo = 0;
        shake = 26;
        if(feverTimer <= 0)
        {
            fever = Math.max(0,fever - 0.3 );
        }
        flash = 0.6;
        flashColor = '255,77,77';
        popup(canvas.width-150,70,(missed > absorbed ? '-' + (missed - absorbed) + ' LIFE' : ''), '#ff4d4d',24);
        tone(160,0.4,'sawtooth',0.15,45); 
    }
    if (lives <= 0) 
    {
        lives = 0;
        gameOver = true;
        if (score > high)
        {
            high = score;
            newBest = true;
            try
            {
                localStorage.setItem('mirror-typing-best', high);
            }
            catch(e)
            {
                console.error('Error saving high score:', e);
                newBest = false;
            }
        }
        [400,300,220,150].forEach((f,i) => tone(f,0.3,'sawtooth',0.1, f*0.7, i*0.18));
    }
}

function draw() 
{
    const sky = ctx.createLinearGradient(0,0,0,canvas.height);
    sky.addColorStop(0,mixColor([5,8,22], [42,8,58]));
    sky.addColorStop(1,mixColor([16,26,58],[74,16,64]));
    ctx.fillStyle = sky;
    ctx.fillRect (0,0,canvas.width,canvas.height);
    drawStars();
    if (scene === 'menu')
    {
        drawMenu();
        return;
    }
    //ctx.fillStyle = mirror ? '#333' : 'black';
    
    ctx.save();
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.fillStyle = '#888';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 2);
    ctx.fillStyle = 'white';
    ctx.font = '26px monospace';
    const floorY = canvas.height - 100;
    const act = active();
    ctx.shadowBlur = 14;
    for(const w of words)
    {
        const t = target(w);
        const danger = w.y > floorY - 160;
           const base = w.kind === 'ice' ? '#8fe3ff' : w.kind === 'bomb' ? '#ff9f1c' : w.kind === 'shield' ? '#7dffb0' : w.gold ? '#ffd700' : danger ? '#ff8080' : feverTimer > 0 ? 'hsl(' + Math.floor((performance.now() / 5 + w.x) % 360) + ',100%,75%)' : (mirror ? '#ffd9f7' : '#e6f4ff');


        ctx.shadowColor = w.kind === 'ice' ? '#8fe3ff' : w.kind === 'bomb' ? '#ff9f1c' : w.kind === 'shield' ? '#7dffb0' : w.gold ? '#ffd700' : danger ? '#ff4d4d' : (mirror ? '#ff6bd6' : '#6bd6ff');

        ctx.globalAlpha = Math.min(1,w.age * 3);
        if (w.kind)
        {
            ctx.font = '12px monospace';
            ctx.fillStyle = base;
            ctx.fillText({ ice: 'FREEZE', bomb: 'BOMB', shield: 'SHIELD' }[w.kind], w.x, w.y - 30);
            ctx.font = '26px monospace';
        }

        if(w === act)
        {
            const typed = t.slice(0, input.length);
            ctx.fillStyle = '#4dff88';
            ctx.fillText(typed, w.x, w.y);

            ctx.fillStyle = base;
            ctx.fillText(t.slice(input.length), w.x + ctx.measureText(typed).width, w.y);

        }
        else
        {
            ctx.fillStyle = base;
            ctx.fillText(t,w.x, w.y);
        }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.fillStyle = badTimer > 0 ? '#ff4d4d' : 'white';
    ctx.fillText(input + '_', 40, canvas.height - 40);
    ctx.fillStyle = 'white';
    ctx.font = (20+scorePulse*12) +'px monospace';
    ctx.fillText('SCORE: ' + Math.round(shownScore), 20, 40);
    ctx.font = '20px monospace';
    ctx.fillText('COMBO: ' + combo + ' x' + (1+Math.floor(combo/5)),20, 70);
    ctx.fillStyle = '#333';
    ctx.fillRect(20,78,160,6);
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(20,78,160 * (combo % 5)/ 5,6);
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width - 180,56,160,6);
    ctx.fillStyle = feverTimer > 0 ? '#ffd700' : '#ff4dd2';
    ctx.fillRect(canvas.width - 180,56,160 * fever,6);
    ctx.font = '14px monospace';
    ctx.fillText(feverTimer > 0 ? 'FEVER x2' : 'FEVER', canvas.width - 180, 78);
    ctx.font = '20px monospace';
    ctx.fillStyle = 'white';
    for(let i = 0; i < START_LIVES; i++)
    {
        drawHeart(canvas.width - 20 - START_LIVES * 26 + i * 26,36,9,i < lives ? '#ff4d6d' : '#3a2a30');

    }
    ctx.fillStyle = 'white';
    
    ctx.fillText(mirror ? 'MIRROR PHASE: TYPE IT BACKWARDS' : 'NORMAL PHASE', 20, 100);
    ctx.fillText((mirror ? 'back to normal in: ' : 'mirror phase in: ') + Math.ceil(phaseTimer) + 's', 20, 125);
    ctx.fillText('[TAB] sound: ' + (muted ? 'OFF' : 'ON') + '  [ENTER] pause',20,150);
    ctx.fillText('LEVEL: ' + level + '  WPM ' + calcWpm(), 20, 175);
    drawFx();
    if (shield > 0)                                    // shield bubbles
    {
        ctx.strokeStyle = '#7dffb0';
        ctx.lineWidth = 3;
        for (let i = 0; i < shield; i++)
        {
            ctx.beginPath();
            ctx.arc(canvas.width / 2 - 30 + i * 30, canvas.height - 50, 11, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.font = '14px monospace';
        ctx.fillStyle = '#7dffb0';
        ctx.fillText('SHIELD', canvas.width / 2 - 110, canvas.height - 45);
        ctx.font = '20px monospace';
        ctx.fillStyle = 'white';
    }
    drawBanner();
    if (freezeTimer > 0)
    {
        ctx.fillStyle = 'rgba(120,200,255,' + Math.min(0.18,freezeTimer * 0.1)  + ')';
        ctx.fillRect(-20, -20,canvas.width + 40, canvas.height + 40);
        centerText('FROZEN ' + freezeTimer.toFixed(1), canvas.width/2, 40, 22, '#9be8ff');
    }
    ctx.restore();
    if(lives > 0 && lives <= 2)
    {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
        const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2,canvas.height / 2, canvas.height * 0.95);
        g.addColorStop(0, 'rgba(255,0,0,0)');
        g.addColorStop(1, 'rgba(255,0,0,' + (0.15 + pulse * 0.25) + ')');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    if (paused) 
    {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      centerText('PAUSED',canvas.width / 2, canvas.height / 2, 64, '#e6f4ff');
      centerText('Enter = resume', canvas.width / 2, canvas.height / 2 + 40, 20, '#aaa');
    }
    if (flash > 0)
         {
        ctx.fillStyle = 'rgba(' + flashColor + ',' + (flash * 0.35) + ')';
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    if (gameOver) 
    {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx = canvas.width / 2, cy = canvas.height / 2;
        centerText('GAME OVER', cx, cy - 70, 56, '#ff4d6d');
        centerText('score ' + score + '    best combo ' + stats.bestCombo + '    words ' + stats.words, cx, cy - 20, 22, 'white');
        centerText(newBest ? 'NEW BEST!  ' + high : 'best ' + high, cx, cy + 20, 26, newBest ? '#ffd700' : '#aaa');
        centerText('Enter = retry      Esc = menu', cx, cy + 70, 20, 'white');
        centerText('WPM ' + calcWpm() + '   accuracy ' + calcAcc() + '% level ' + level,cx, cy + 105, 20, '#aaa');
        centerText(calcRank(), cx, cy- 150, 90, RANK_COLORS[calcRank()]);
    }
}

let last = performance.now();
function loop(now) 
{
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);