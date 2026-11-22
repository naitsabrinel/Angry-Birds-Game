const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const background = new Image();
background.src = "assets/background.png";

const backgroundMusic = document.getElementById("backgroundMusic");

backgroundMusic.volume = 0.25;

let musicStarting = false;

function startMusic(event) {
    if (event.type === "keydown" && event.key !== "Enter") return;
    if (musicStarting || !backgroundMusic.paused) return;

    musicStarting = true;
    backgroundMusic.play().then(() => {
        document.removeEventListener("click", startMusic);
        document.removeEventListener("keydown", startMusic);
    }).catch(error => {
        musicStarting = false;
        console.error("La musique n'a pas pu démarrer.", error);
    });
}

document.addEventListener("click", startMusic);
document.addEventListener("keydown", startMusic);

// 1. BOX2D CONFIGURATION

const b2Vec2 = Box2D.Common.Math.b2Vec2;
const b2World = Box2D.Dynamics.b2World;
const b2BodyDef = Box2D.Dynamics.b2BodyDef;
const b2Body = Box2D.Dynamics.b2Body;
const b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
const b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
const b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

const SCALE = 30;                       // 30 pixels = 1 meter
const world = new b2World(new b2Vec2(0, 9.8), true);

// 2. IMAGES (dossier assets)

function loadImage(name) {
    const img = new Image();
    img.src = "assets/" + name;
    return img;
}

const IMG = {
    bird:      loadImage("red.png"),
    pig:          loadImage("target.png"),               // cochon normal
    pigSurprised: loadImage("pig_golden.png"),           // touché par l'oiseau
    pigKO:        loadImage("pig_crown_surprised.png"),  // tombé au sol (Bravo)
    pigHead:      loadImage("pig_head.png"),             // petits cochons
    woodBar:   loadImage("wood_bar.png"),
    woodBox:   loadImage("wood_box.png"),
    woodBall:  loadImage("wood_ball.png"),
    iceBar:    loadImage("ice_bar.png"),
    iceBox:    loadImage("ice_box.png"),
    iceBall:   loadImage("ice_ball.png"),
    rockBar:   loadImage("rock_bar.png"),
    rockBox:   loadImage("rock_box.png"),
    rockBall:  loadImage("rock_ball.png")
};

// 3. MATERIALS (propriétés physiques)
 
const MAT = {
    wood: { density: 1.0, friction: 0.5, restitution: 0.2 },
    ice:  { density: 0.6, friction: 0.1, restitution: 0.1 },   // léger et glissant
    rock: { density: 2.0, friction: 0.7, restitution: 0.05 },  // lourd
    bird: { density: 2.0, friction: 0.5, restitution: 0.3 }
};

const objects = [];   // tous les objets à dessiner

// 4. CREATE BODIES
 
function createBox(x, y, width, height, type, color, image, mat) {

    mat = mat || MAT.wood;

    const bodyDef = new b2BodyDef();
    bodyDef.type = type;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    const fixtureDef = new b2FixtureDef();
    fixtureDef.density = mat.density;
    fixtureDef.friction = mat.friction;
    fixtureDef.restitution = mat.restitution;

    fixtureDef.shape = new b2PolygonShape();
     fixtureDef.shape.SetAsBox(width / 2 / SCALE, height / 2 / SCALE);

    const body = world.CreateBody(bodyDef);
    body.CreateFixture(fixtureDef);

    objects.push({
        body: body, width: width, height: height,
        color: color, image: image, type: "box"
    });

    return body;
}

function createCircle(x, y, radius, image, mat) {

    mat = mat || MAT.wood;

    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(x / SCALE, y / SCALE);

    const fixtureDef = new b2FixtureDef();
    fixtureDef.density = mat.density;
    fixtureDef.friction = mat.friction;
    fixtureDef.restitution = mat.restitution;
    fixtureDef.shape = new b2CircleShape(radius / SCALE);

    const body = world.CreateBody(bodyDef);
    body.CreateFixture(fixtureDef);

    objects.push({ body: body, radius: radius, image: image, type: "circle" });

    return body;
}

// 5. GROUND AND WALLS
 
const STATIC = b2Body.b2_staticBody;
const DYN = b2Body.b2_dynamicBody;

// Ground : top at y = 460
const ground = createBox(400, 480, 800, 40, STATIC, "green");

// Side walls (invisible)
createBox(0, 250, 20, 500, STATIC, "transparent");
createBox(800, 250, 20, 500, STATIC, "transparent");

// 6. BIRD, OBSTACLES AND PIG

const bird = createCircle(150, 435, 24, IMG.bird, MAT.bird);

createBox(600, 410, 16, 100, DYN, "#888", IMG.rockBar, MAT.rock);   // bottom legs: rock
createBox(700, 410, 16, 100, DYN, "#888", IMG.rockBar, MAT.rock);
createBox(650, 352, 116, 16, DYN, "#c99b48", IMG.woodBar, MAT.wood); // middle plank: wood
createBox(600, 309, 16, 70, DYN, "#9fd8e8", IMG.iceBar, MAT.ice);    // top legs: ice
createBox(700, 309, 16, 70, DYN, "#9fd8e8", IMG.iceBar, MAT.ice);
createBox(650, 266, 116, 16, DYN, "#c99b48", IMG.woodBar, MAT.wood); // top plank: wood

createBox(650, 440, 40, 40, DYN, "#888", IMG.rockBox, MAT.rock);
createCircle(650, 402, 18, IMG.iceBall, MAT.ice);

createBox(420, 440, 40, 40, DYN, "#888", IMG.rockBox, MAT.rock);
createBox(420, 400, 40, 40, DYN, "#c99b48", IMG.woodBox, MAT.wood);

createCircle(520, 440, 20, IMG.woodBall, MAT.wood);
createBox(760, 440, 40, 40, DYN, "#9fd8e8", IMG.iceBox, MAT.ice);

const pig = createCircle(650, 232, 25, IMG.pig, MAT.wood);
const pigObj = objects.find(o => o.body === pig);   // pour changer son image

const minions = [
    { body: createCircle(420, 362, 18, IMG.pigHead, MAT.wood), onGround: false },

    { body: createCircle(650, 292, 18, IMG.pigHead, MAT.wood), onGround: false }
];

// 7. SLINGSHOT SYSTEM
 
const anchorX = 150;
const anchorY = 435;

let dragging = false;
let launched = false;
let dragX = anchorX;
let dragY = anchorY;
let attempts = 1;

function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener("mousedown", function(event) {

    if (launched) return;

    const mouse = getMousePosition(event);
    const pos = bird.GetPosition();

    const distance = Math.sqrt(
        (mouse.x - pos.x * SCALE) ** 2 +
        (mouse.y - pos.y * SCALE) ** 2
    );

    if (distance < 40) {
        dragging = true;
        bird.SetAwake(false);                        
        bird.SetLinearVelocity(new b2Vec2(0, 0));
        bird.SetAngularVelocity(0);
    }
});

window.addEventListener("mousemove", function(event) {

    if (!dragging) return;

    const mouse = getMousePosition(event);

    let dx = mouse.x - anchorX;
    let dy = mouse.y - anchorY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 100) {                            
        dx = dx / distance * 100;
        dy = dy / distance * 100;
    }

    dragX = anchorX + dx;
    dragY = anchorY + dy;

    bird.SetPosition(new b2Vec2(dragX / SCALE, dragY / SCALE));
});

window.addEventListener("mouseup", function() {

    if (!dragging) return;

    dragging = false;
    launched = true;

     const velocityX = (anchorX - dragX) * 0.15;
    const velocityY = (anchorY - dragY) * 0.15;

    bird.SetPosition(new b2Vec2(anchorX / SCALE, anchorY / SCALE));
    bird.SetAwake(true);
    bird.SetLinearVelocity(new b2Vec2(velocityX, velocityY));

     setTimeout(resetBird, 5000);
});

function resetBird() {
    bird.SetPosition(new b2Vec2(anchorX / SCALE, anchorY / SCALE));
    bird.SetAngle(0);
    bird.SetLinearVelocity(new b2Vec2(0, 0));
    bird.SetAngularVelocity(0);
    bird.SetAwake(true);
    launched = false;
    attempts++;
}

// 8. COLLISION DETECTION (pig / ground)
 
let pigHitGround = false;

 const PIG_REWARD = 500;        
const MINION_REWARD = 100;     
const REMOVE_DELAY = 600;      
let money = 0;      
let toRemove = [];             
let puffs = [];                
let floatTexts = [];          

function loadMoney() {
    try { return parseInt(localStorage.getItem("angry_money")) || 0; }
    catch (e) { return 0; }
}

function saveMoney() {
    try { localStorage.setItem("angry_money", money); }
    catch (e) { /* stockage indisponible : on ignore */ }
}

  function scheduleRemoval(body, reward) {
    toRemove.push({
        body: body,
        reward: reward,
        removeAt: performance.now() + REMOVE_DELAY
    });
}

function processRemovals() {

    const now = performance.now();

    toRemove = toRemove.filter(item => {

        if (now < item.removeAt) return true;   
        const p = item.body.GetPosition();
        const x = p.x * SCALE;
        const y = p.y * SCALE;

        puffs.push({ x: x, y: y, life: 1 });
        floatTexts.push({ x: x, y: y, text: "+" + item.reward, life: 1 });

        money += item.reward;
        saveMoney();

        world.DestroyBody(item.body);            

        const i = objects.findIndex(o => o.body === item.body);
        if (i >= 0) objects.splice(i, 1);        

        return false;                            
    });
}

const contactListener = new Box2D.Dynamics.b2ContactListener();

contactListener.BeginContact = function(contact) {

    const bodyA = contact.GetFixtureA().GetBody();
    const bodyB = contact.GetFixtureB().GetBody();

    if (between(bodyA, bodyB, pig, ground)) {
        if (!pigHitGround) {
            pigHitGround = true;      
            if (isLoaded(IMG.pigKO)) pigObj.image = IMG.pigKO;
            scheduleRemoval(pig, PIG_REWARD);
        }
    } else if (between(bodyA, bodyB, pig, bird) && !pigHitGround) {
        if (isLoaded(IMG.pigSurprised)) pigObj.image = IMG.pigSurprised;
    }

    minions.forEach(m => {
        if (!m.onGround && between(bodyA, bodyB, m.body, ground)) {
            m.onGround = true;
            scheduleRemoval(m.body, MINION_REWARD);
        }
    });
};

 function between(a, b, x, y) {
    return (a === x && b === y) || (a === y && b === x);
}

world.SetContactListener(contactListener);

 // 9. DRAWING
 
function isLoaded(img) {
    return img && img.complete && img.naturalWidth > 0;
}

function drawObjects() {

    objects.forEach(obj => {

        const pos = obj.body.GetPosition();

        ctx.save();
        ctx.translate(pos.x * SCALE, pos.y * SCALE);
        ctx.rotate(obj.body.GetAngle());           

        if (obj.type === "box") {

            if (isLoaded(obj.image)) {
                if (obj.height > obj.width) {
                     ctx.rotate(Math.PI / 2);
                    ctx.drawImage(obj.image,
                        -obj.height / 2, -obj.width / 2,
                        obj.height, obj.width);
                } else {
                    ctx.drawImage(obj.image,
                        -obj.width / 2, -obj.height / 2,
                        obj.width, obj.height);
                }
            } else {
                // fallback: color
                ctx.fillStyle = obj.color;
                ctx.fillRect(-obj.width / 2, -obj.height / 2,
                             obj.width, obj.height);
            }

        } else {

            const size = obj.radius * 2;

            if (isLoaded(obj.image)) {
                ctx.drawImage(obj.image, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    });
}

function drawSlingshot() {

    if (!dragging) return;

    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(dragX, dragY);
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 4;
    ctx.stroke();
}

 function drawEffects() {

    puffs.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#bbbbbb";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20 + (1 - p.life) * 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        p.life -= 0.03;
    });
    puffs = puffs.filter(p => p.life > 0);

    floatTexts.forEach(f => {
        ctx.globalAlpha = f.life;
        ctx.fillStyle = "#e6a800";
        ctx.font = "bold 24px Arial";
        ctx.fillText("💰 " + f.text, f.x - 30, f.y - (1 - f.life) * 60);
        f.life -= 0.012;
    });
    floatTexts = floatTexts.filter(f => f.life > 0);

    ctx.globalAlpha = 1;
}


function drawHUD() {

     function drawPanel(x, y, w, h) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fillStyle = "rgba(15, 35, 58, 0.88)";
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.save();

  
    drawPanel(12, 12, 280, 76);

    ctx.textAlign = "left";

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#a9c9df";
    ctx.fillText("ÉTAT DE LA PARTIE", 27, 31);

    // Indicateur de statut
    ctx.beginPath();
    ctx.arc(31, 51, 5, 0, Math.PI * 2);
    ctx.fillStyle = pigHitGround ? "#43e879" : "#ffbd45";
    ctx.fill();

    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        pigHitGround ? "Bravo ! Target Cochon au sol !" : "Vise les cochons !",
        44, 57
    );

    ctx.font = "13px Arial";
    ctx.fillStyle = "#d8eafa";
    ctx.fillText("🎯 Tir n° " + attempts, 27, 77);



    const panelWidth = 155;
    const panelX = canvas.width - panelWidth - 12;

    drawPanel(panelX, 12, panelWidth, 65);

    ctx.textAlign = "center";

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#a9c9df";
    ctx.fillText(
        "ARGENT",
        panelX + panelWidth / 2,
        30
    );

    ctx.font = "bold 23px Arial";
    ctx.fillStyle = "#ffd45c";

    ctx.fillText(
        "💰 " + money,
        panelX + panelWidth / 2,
        59
    );

    ctx.restore();
}


// 10. GAME LOOP


function gameLoop() {

    world.Step(1 / 60, 8, 3);
    world.ClearForces();

    processRemovals();      // destroy pigs AFTER the step (world unlocked)

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (background.complete && background.naturalWidth > 0) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
    drawObjects();
    drawEffects();
    drawSlingshot();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

gameLoop();