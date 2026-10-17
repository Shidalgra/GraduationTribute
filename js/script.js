// ==========================================================================
// CONFIGURACIÓN DEL MOTOR DE FÍSICA (Matter.js)
// ==========================================================================
const { Engine, Render, Runner, Bodies, Composite, Vector, Body } = Matter;

// 1. Inicializar el motor y el mundo virtual
const engine = Engine.create();
const world = engine.world;

// Ajustamos la gravedad del mundo para que se sienta realista (estilo NBA)
engine.gravity.y = 1.2; 

// 2. Crear el lienzo (Canvas) adaptable al tamaño de la pantalla
const contenedor = document.getElementById('canvas-container');
const render = Render.create({
    element: contenedor,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: 'transparent', // Transparente para no tapar nuestro hermoso fondo CSS
        wireframes: false // Falso para poder aplicar colores sólidos a los balones
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// ==========================================================================
// CREACIÓN DE BARRERAS INVISIBLES (Suelo y Paredes Coincidentes)
// ==========================================================================
let suelo, paredIzquierda, paredDerecha;
const grosorBarrera = 100; // Grosor para evitar que los balones atraviesen los bordes

function crearBarrerasMundo() {
    // Si ya existían barreras (por un cambio de tamaño), las removemos primero
    if (suelo) Composite.remove(world, [suelo, paredIzquierda, paredDerecha]);

    const ancho = window.innerWidth;
    const alto = window.innerHeight;

    // Suelo justo abajo de la pantalla visible
    suelo = Bodies.rectangle(ancho / 2, alto + grosorBarrera / 2, ancho * 2, grosorBarrera, { 
        isStatic: true,
        restitution: 0.8 // Hace que el suelo sea responsivo al rebote
    });

    // Pared izquierda fuera del margen izquierdo
    paredIzquierda = Bodies.rectangle(-grosorBarrera / 2, alto / 2, grosorBarrera, alto * 2, { 
        isStatic: true 
    });

    // Pared derecha fuera del margen derecho
    paredDerecha = Bodies.rectangle(ancho + grosorBarrera / 2, alto / 2, grosorBarrera, alto * 2, { 
        isStatic: true 
    });

    // Añadir los límites al mundo
    Composite.add(world, [suelo, paredIzquierda, paredDerecha]);
}

// Inicializamos las barreras por primera vez
crearBarrerasMundo();

// ==========================================================================
// DISPARADOR DE BALONES INTERACTIVOS
// ==========================================================================
window.addEventListener('click', (event) => {
    // Obtener las coordenadas exactas de donde tocó con el mouse o dedo
    const x = event.clientX;
    const y = event.clientY;

    // Hacemos el tamaño del balón responsivo (más chico en celulares, mediano en PC)
    const radioBalon = window.innerWidth < 600 ? 18 : 26; 

    // Creamos el cuerpo esférico del balón
    const balon = Bodies.circle(x, y, radioBalon, {
        restitution: 0.85, // Elasticidad: 0.85 significa que retiene el 85% de su fuerza al rebotar
        friction: 0.005,   // Fricción con el aire baja para que ruede suave
        density: 0.001,
        render: {
            fillStyle: '#f97316',   // Color oficial Naranja Basketball
            strokeStyle: '#111827', // Líneas oscuras texturizadas
            lineWidth: 3
        }
    });

    // Añadimos un impulso físico aleatorio para que los balones salgan con efecto dinámico
    const fuerzaImpulso = 0.03;
    const fuerzaX = (Math.random() - 0.5) * fuerzaImpulso;
    const fuerzaY = -Math.random() * fuerzaImpulso; // Impulso hacia arriba inicial
    
    Body.applyForce(balon, balon.position, { x: fuerzaX, y: fuerzaY });

    // Sumamos el balón al escenario
    Composite.add(world, balon);

    // Sistema de limpieza automático: borra el balón a los 7 segundos para optimizar memoria
    setTimeout(() => {
        Composite.remove(world, balon);
    }, 7000);
});

// ==========================================================================
// CONTROL RESPONSIVO DE CAMBIO DE PANTALLA (RESIZE)
// ==========================================================================
window.addEventListener('resize', () => {
    // Actualizamos el tamaño del lienzo de renderizado
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    
    // Re-calculamos la posición de las paredes y suelo invisibles
    crearBarrerasMundo();
});
