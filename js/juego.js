const { Engine, Render, Runner, Bodies, Composite, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1.1;

const container = document.getElementById('canvas-container');
let width = window.innerWidth;
let height = window.innerHeight;

const render = Render.create({
    element: container,
    engine: engine,
    options: {
        width: width,
        height: height,
        background: 'transparent',
        wireframes: false
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

let score = 0;
const scoreElement = document.getElementById('score');

// --- VARIABLES DE POSICIONAMIENTO ADAPTATIVAS ---
let pisoY, hoopX, hoopY, anchorPosition;

function actualizarMedidas() {
    width = window.innerWidth;
    height = window.innerHeight;
    
    // Detectamos si es un celular en modo horizontal (Landscape: ancho mayor que alto y altura reducida)
    let isLandscapeMobile = (height < 600 && width > height);
    let isMobilePortrait = width < 768 && !isLandscapeMobile;

    if (isLandscapeMobile) {
        // VISTA PANORÁMICA ESPECIAL PARA CELULAR HORIZONTAL (Más lejos y amplio)
        pisoY = height * 0.88;
        hoopX = width * 0.86;  // Aro muy a la derecha
        hoopY = height * 0.24; // Aro más arriba para ganar espacio vertical
        anchorPosition = { 
            x: width * 0.14,   // Resortera muy a la izquierda para crear distancia real
            y: height * 0.62 
        };
    } else if (isMobilePortrait) {
        // Celular en modo vertical (Retrato)
        pisoY = height * 0.82;
        hoopX = width * 0.72;
        hoopY = height * 0.32;
        anchorPosition = { x: width * 0.22, y: height * 0.65 };
    } else {
        // Computadora de escritorio (PC)
        pisoY = height * 0.85;
        hoopX = width * 0.82;
        hoopY = height * 0.30;
        anchorPosition = { x: width * 0.16, y: height * 0.62 };
    }
}

actualizarMedidas();

// --- PISO Y LÍMITES DEL ESCENARIO ---
let suelo = Bodies.rectangle(width / 2, pisoY + 50, width * 2, 100, { isStatic: true, restitution: 0.5 });
const paredIzq = Bodies.rectangle(-50, height / 2, 100, height * 2, { isStatic: true });
const paredDer = Bodies.rectangle(width + 50, height / 2, 100, height * 2, { isStatic: true });
Composite.add(world, [suelo, paredIzq, paredDer]);

// --- ESTRUCTURA FÍSICA DE LA CANASTA ---
const poste = Bodies.rectangle(hoopX + 50, hoopY + 140, 12, height, { isStatic: true, render: { visible: false } });
const tablero = Bodies.rectangle(hoopX + 42, hoopY - 30, 10, 90, { isStatic: true, render: { visible: false } });
const aroIzquierda = Bodies.circle(hoopX - 28, hoopY, 5, { isStatic: true, restitution: 0.3, render: { visible: false } });
const aroDerecha = Bodies.circle(hoopX + 22, hoopY, 5, { isStatic: true, restitution: 0.3, render: { visible: false } });

// Sensor de anotación estricto
const sensorGol = Bodies.rectangle(hoopX - 3, hoopY + 8, 40, 6, { isStatic: true, isSensor: true, render: { visible: false } });

Composite.add(world, [poste, tablero, aroIzquierda, aroDerecha, sensorGol]);

// --- POSICIÓN Y CREACIÓN DEL BALÓN ---
let ball;

function createBall() {
    let isLandscapeMobile = (height < 600 && width > height);
    let radius = isLandscapeMobile ? 14 : (width < 768 ? 16 : 20);

    ball = Bodies.circle(anchorPosition.x, anchorPosition.y, radius, {
        isStatic: true, 
        restitution: 0.75,
        friction: 0.01,
        render: { fillStyle: '#f97316', strokeStyle: '#111827', lineWidth: 3 }
    });

    Composite.add(world, ball);
}

createBall();

// --- CÁLCULO DE FUERZA Y TRAYECTORIA ---
function getVelocityVector() {
    const dx = anchorPosition.x - ball.position.x;
    const dy = anchorPosition.y - ball.position.y;
    
    let isLandscapeMobile = (height < 600 && width > height);
    let isMobile = width < 768 && !isLandscapeMobile;
    
    // Factor de impulso adaptado para la mayor distancia en landscape
    const factor = isLandscapeMobile ? 0.24 : (isMobile ? 0.17 : 0.18); 
    return {
        vx: dx * factor,
        vy: dy * factor
    };
}

// --- DIBUJO VECTORIAL (VISTA PANORÁMICA) ---
const canvasCtx = render.context;

Events.on(render, 'afterRender', () => {
    canvasCtx.save();

    // 1. DIBUJAR PISO DE DUELA
    canvasCtx.fillStyle = '#d97706';
    canvasCtx.fillRect(0, pisoY, width, height - pisoY);

    canvasCtx.fillStyle = 'rgba(180, 83, 9, 0.25)';
    for (let i = 0; i < width; i += 40) {
        canvasCtx.fillRect(i, pisoY, 20, height - pisoY);
    }

    canvasCtx.strokeStyle = '#0f172a';
    canvasCtx.lineWidth = 4;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, pisoY);
    canvasCtx.lineTo(width, pisoY);
    canvasCtx.stroke();

    // 2. POSTE, TABLERO Y ARO
    canvasCtx.fillStyle = '#1e293b';
    canvasCtx.fillRect(hoopX + 40, hoopY - 75, 12, pisoY - (hoopY - 75));

    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(hoopX + 35, hoopY - 75, 10, 90);
    canvasCtx.strokeStyle = '#0f172a';
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeRect(hoopX + 35, hoopY - 75, 10, 90);

    canvasCtx.strokeStyle = '#ef4444';
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeRect(hoopX + 37, hoopY - 45, 4, 30);

    // Red
    canvasCtx.strokeStyle = '#e2e8f0';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(hoopX - 28, hoopY); canvasCtx.lineTo(hoopX - 12, hoopY + 35);
    canvasCtx.moveTo(hoopX + 22, hoopY); canvasCtx.lineTo(hoopX + 8, hoopY + 35);
    canvasCtx.moveTo(hoopX - 18, hoopY + 12); canvasCtx.lineTo(hoopX + 10, hoopY + 35);
    canvasCtx.moveTo(hoopX + 18, hoopY + 12); canvasCtx.lineTo(hoopX - 10, hoopY + 35);
    canvasCtx.stroke();

    // Aro
    canvasCtx.fillStyle = '#ef4444';
    canvasCtx.beginPath();
    canvasCtx.ellipse(hoopX - 3, hoopY, 26, 6, 0, 0, Math.PI * 2);
    canvasCtx.fill();
    canvasCtx.strokeStyle = '#991b1b';
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();

    // 3. BASE VISUAL DE LA RESORTERA
    canvasCtx.fillStyle = '#78350f';
    canvasCtx.fillRect(anchorPosition.x - 4, anchorPosition.y + 10, 8, 35);

    // 4. LIGAS Y GUÍA DE TRAYECTORIA AL ESTIRAR
    if (isDragging && !isLaunched) {
        canvasCtx.strokeStyle = '#b45309';
        canvasCtx.lineWidth = 4;
        canvasCtx.beginPath();
        canvasCtx.moveTo(anchorPosition.x - 8, anchorPosition.y);
        canvasCtx.lineTo(ball.position.x, ball.position.y);
        canvasCtx.lineTo(anchorPosition.x + 8, anchorPosition.y);
        canvasCtx.stroke();

        const vel = getVelocityVector();
        let simX = ball.position.x;
        let simY = ball.position.y;
        let simVx = vel.vx; 
        let simVy = vel.vy; 

        canvasCtx.fillStyle = '#f97316';

        for (let i = 0; i < 35; i++) {
            simVx *= 0.99; 
            simVy += 0.55; 
            simX += simVx;
            simY += simVy;

            if (simY > pisoY) break;

            canvasCtx.beginPath();
            canvasCtx.arc(simX, simY, Math.max(2, 5 - (i * 0.12)), 0, Math.PI * 2);
            canvasCtx.fill();
        }
    }

    canvasCtx.restore();
});

// --- CONTROLES TÁCTILES Y MOUSE ---
let isDragging = false;
let isLaunched = false;

function getCoords(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function startDrag(e) {
    if (isLaunched) return;
    const coords = getCoords(e);
    const dist = Math.hypot(coords.x - ball.position.x, coords.y - ball.position.y);

    if (dist < 70) {
        isDragging = true;
        if (e.cancelable) e.preventDefault();
    }
}

function moveDrag(e) {
    if (!isDragging || isLaunched) return;
    const coords = getCoords(e);

    let dragX = coords.x;
    let dragY = coords.y;

    let isLandscapeMobile = (height < 600 && width > height);
    const maxPull = isLandscapeMobile ? 140 : (width < 768 ? 120 : 150);
    const dx = dragX - anchorPosition.x;
    const dy = dragY - anchorPosition.y;
    const dist = Math.hypot(dx, dy);

    if (dist > maxPull) {
        dragX = anchorPosition.x + (dx / dist) * maxPull;
        dragY = anchorPosition.y + (dy / dist) * maxPull;
    }

    if (dragX > anchorPosition.x + 5) {
        dragX = anchorPosition.x + 5;
    }

    Body.setPosition(ball, { x: dragX, y: dragY });
    if (e.cancelable) e.preventDefault();
}

function endDrag(e) {
    if (!isDragging || isLaunched) return;
    isDragging = false;
    isLaunched = true;

    Body.setStatic(ball, false);

    const vel = getVelocityVector();
    Body.setVelocity(ball, {
        x: vel.vx,
        y: vel.vy
    });

    setTimeout(() => {
        Composite.remove(world, ball);
        createBall();
        isLaunched = false;
    }, 3500);
}

window.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', moveDrag);
window.addEventListener('mouseup', endDrag);

window.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', moveDrag, { passive: false });
window.addEventListener('touchend', endDrag);

// --- DETECCIÓN DE PUNTOS ---
let scoredThisShot = false;

Events.on(engine, 'beforeUpdate', () => {
    if (!isLaunched) scoredThisShot = false;
});

Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        const isBallAndSensor = (pair.bodyA === ball && pair.bodyB === sensorGol) || (pair.bodyB === ball && pair.bodyA === sensorGol);
        
        if (isBallAndSensor && !scoredThisShot) {
            if (ball.velocity.y > 0) {
                scoredThisShot = true;
                score += 3;
                scoreElement.innerText = score;
                ball.render.fillStyle = '#22c55e'; 
            }
        }
    });
});

// --- RESPONSIVIDAD DINÁMICA ---
window.addEventListener('resize', () => {
    actualizarMedidas();
    render.canvas.width = width;
    render.canvas.height = height;
});