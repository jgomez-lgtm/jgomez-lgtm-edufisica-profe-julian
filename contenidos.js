/* CONTENIDOS (portada, herramientas, recursos y retos). Es el archivo que más se edita. — Portal de Educación Física · I.E. Jesús María Rojas Pagola */
/* ====== CONFIG ====== */
// Pega aquí la URL del Web App de Google Apps Script (ver archivo Recolector.gs).
// Si la dejas vacía, el portal funciona igual pero solo permite descargar el comprobante CSV.

/* =====================================================================
   CONTENIDO EDITABLE  —  esto es lo único que necesitas tocar
   =====================================================================
   orden:   el número decide en qué lugar aparece el botón en la portada.
   desc:    la frase que se lee bajo el nombre del botón.
   promesa: lo que se anuncia mientras la página esté en construcción
            ("Pronto encontrarás aquí …"). Desaparece sola en cuanto
            agregues contenido a la lista de esa sección.
   visible: ponlo en false si quieres esconder un botón de la portada.
   Para agregar contenido, copia una de las líneas de ejemplo (las que
   empiezan por //), quítale las dos barras y cambia el texto.
   Respeta las comillas y las comas.
   ===================================================================== */

var SECCIONES = {
  evaluaciones: { orden:1, visible:true, titulo:"Evaluaciones",
    desc:"Presenta la evaluación tipo Saber de tu grado y periodo.",
    promesa:"las evaluaciones de cada periodo, con tu nota y la revisión pregunta por pregunta." },

  recursos: { orden:2, visible:true, titulo:"Recursos",
    desc:"Videos, guías y reglamentos por grado.",
    promesa:"los videos de los gestos técnicos, las guías de clase y los reglamentos de cada deporte, ordenados por grado." },

  herramientas: { orden:3, visible:true, titulo:"Herramientas",
    desc:"Videos, lecturas y reglamentos deportivos con enlaces externos.",
    promesa:"un banco general de herramientas: videos explicativos, lecturas de apoyo y los reglamentos oficiales de los deportes que se trabajan en el área." },

  retos: { orden:4, visible:true, titulo:"Retos",
    desc:"Tu ruta de retos por grado y por periodo.",
    promesa:"un reto de acondicionamiento cada semana —fuerza, flexibilidad y resistencia— con sus pasos, para hacer en casa o en clase." },

  juego: { orden:5, visible:true, titulo:"Juego",
    desc:"Salta conos y balones. ¿Cuál es tu récord?",
    promesa:"un juego rápido de concentración: salta los obstáculos, no te distraigas y deja tu nombre en la tabla de récords." },

  resultados: { orden:6, visible:true, titulo:"Resultados",
    desc:"Desempeño por competencia: grupo, grado y consolidado general.",
    promesa:"el tablero de resultados de las evaluaciones: el desempeño por competencia de tu grupo, de tu grado y el consolidado de todos los que ya presentaron." },

  torneos: { orden:7, visible:true, titulo:"Torneos",
    desc:"Crea y consulta torneos interclases: fixture, resultados y posiciones.",
    promesa:"los torneos interclases de voleibol, microfútbol y baloncesto, con su fixture, resultados y tabla de posiciones." },

  diario: { orden:8, visible:true, titulo:"Diario",
    desc:"Registra tus minutos de actividad física.",
    promesa:"tu diario de movimiento: los minutos de actividad física de cada día y cuánto llevas en la semana." }
};

/* --- HERRAMIENTAS -----------------------------------------------------
   Banco general (no depende del grado) de videos, lecturas y reglamentos
   oficiales, con enlaces externos. tipo: "Video" | "Lectura" | "Reglamento".
   Para agregar uno nuevo, copia una línea y cambia el texto y la url.    */
var HERRAMIENTAS = [

  /* ===== REGLAMENTOS DEPORTIVOS OFICIALES ===== */
  { tipo:"Reglamento", titulo:"Reglas de juego del fútbol — IFAB (Laws of the Game)",
    descripcion:"Documento oficial y vigente con las 17 reglas del fútbol, publicado por el organismo que las regula a nivel mundial.",
    url:"https://www.theifab.com/documents/?documentType=laws-of-the-game" },
  { tipo:"Reglamento", titulo:"Reglas oficiales de baloncesto — FIBA",
    descripcion:"Reglamento oficial y vigente de la Federación Internacional de Baloncesto, con las normas del juego y del equipamiento.",
    url:"https://about.fiba.basketball/es/our-sport/official-basketball-rules" },
  { tipo:"Reglamento", titulo:"Reglas oficiales de voleibol — FIVB",
    descripcion:"Reglamento oficial y vigente de la Federación Internacional de Voleibol, con las normas del juego, la cancha y las rotaciones.",
    url:"https://www.fivb.com/volleyball/the-game/official-volleyball-rules/" },
  { tipo:"Reglamento", titulo:"Ley del Deporte en Colombia (Ley 181 de 1995)",
    descripcion:"Marco legal colombiano que organiza el Sistema Nacional del Deporte, la recreación, la educación física y el aprovechamiento del tiempo libre.",
    url:"https://www.mindeporte.gov.co/mindeporte/sistema-nacional-del-deporte" },

  /* ===== LECTURAS DE APOYO ===== */
  { tipo:"Lectura", titulo:"Lineamientos curriculares de Educación Física, Recreación y Deporte — MEN",
    descripcion:"Documento oficial del Ministerio de Educación Nacional con las orientaciones pedagógicas y las competencias del área en Colombia.",
    url:"https://www.mineducacion.gov.co/1621/article-89869.html" },
  { tipo:"Lectura", titulo:"Ministerio del Deporte de Colombia — Mindeporte",
    descripcion:"Portal oficial de la entidad que formula la política pública del deporte, la recreación y la actividad física en el país.",
    url:"https://www.mindeporte.gov.co/" },
  { tipo:"Lectura", titulo:"Comité Olímpico Colombiano",
    descripcion:"Sitio oficial del organismo que agrupa a las federaciones deportivas colombianas y representa al país en los Juegos Olímpicos.",
    url:"https://www.coc.org.co/" },
  { tipo:"Lectura", titulo:"Guía de calentamiento y vuelta a la calma",
    descripcion:"Recomendaciones generales sobre cómo preparar el cuerpo antes de hacer deporte y cómo recuperarlo después, para prevenir lesiones.",
    url:"https://www.youtube.com/results?search_query=calentamiento+y+vuelta+a+la+calma+educación+física" },

  /* ===== VIDEOS EXPLICATIVOS ===== */
  { tipo:"Video", titulo:"Reglas básicas del baloncesto explicadas",
    descripcion:"Video oficial de la FIBA con las reglas fundamentales del baloncesto, ideal como introducción antes de leer el reglamento completo.",
    url:"https://www.youtube.com/results?search_query=FIBA+reglas+básicas+del+baloncesto" },
  { tipo:"Video", titulo:"Reglas del fútbol explicadas paso a paso",
    descripcion:"Explicación visual de las reglas principales del fútbol: fuera de juego, faltas, tarjetas y saques.",
    url:"https://www.youtube.com/results?search_query=reglas+del+fútbol+explicadas+paso+a+paso" },
  { tipo:"Video", titulo:"Reglas del voleibol explicadas para principiantes",
    descripcion:"Introducción visual a las reglas básicas del voleibol: rotación, toques, saque y sistema de puntos.",
    url:"https://www.youtube.com/results?search_query=reglas+del+voleibol+explicadas+para+principiantes" },
  { tipo:"Video", titulo:"Primeros auxilios básicos para lesiones deportivas",
    descripcion:"Nociones generales sobre qué hacer ante golpes, esguinces y caídas comunes durante la práctica deportiva escolar.",
    url:"https://www.youtube.com/results?search_query=primeros+auxilios+básicos+lesiones+deportivas+escolares" }
];
/* --- RECURSOS -------------------------------------------------------
   grado: agrupa las tarjetas. tipo: Video, Guía, Reglamento, Infografía…
   url: puede quedar vacía ("") si es solo un aviso.                    */
var RECURSOS = [

  /* ===== GRADO 6.° — Gimnasia: rollo adelante y rollo atrás ===== */
  { grado:"6.°", tipo:"Video", titulo:"Rollo adelante paso a paso",
    descripcion:"Las cuatro fases del rollo adelante con pasos metodológicos para hacerlo de forma correcta y segura.",
    url:"https://www.youtube.com/watch?v=vMAUTOgWn9w" },
  { grado:"6.°", tipo:"Video", titulo:"Rollo adelante en gimnasia — movimiento básico",
    descripcion:"Movimiento básico de la gimnasia explicado paso a paso: agrupamiento, apoyo de manos, rodada y recuperación.",
    url:"https://www.youtube.com/watch?v=gRE_kA9zMF8" },
  { grado:"6.°", tipo:"Video", titulo:"Rollo hacia atrás — tutorial completo",
    descripcion:"Tutorial del rollo atrás: posición de manos junto a los hombros, empuje y protección del cuello.",
    url:"https://www.youtube.com/watch?v=Oad1qDCk84s" },
  { grado:"6.°", tipo:"Video", titulo:"Metodología: rollos adelante y atrás en casa",
    descripcion:"Cómo practicar los rollos en casa con seguridad. Ideal para repasar la técnica fuera de clase.",
    url:"https://www.youtube.com/watch?v=2GxBMHJEj5A" },
  { grado:"6.°", tipo:"Guía", titulo:"Pedagogía del rollo adelante — fases y errores comunes",
    descripcion:"Guía escrita con las fases del rollo, los errores frecuentes y cómo corregirlos.",
    url:"http://feliperbejarano.blogspot.com/2016/03/rollo-adelante.html" },

  /* ===== GRADO 7.° — Evolución de los aparatos gimnásticos ===== */
  { grado:"7.°", tipo:"Video", titulo:"Historia de la gimnasia artística",
    descripcion:"Desde los aparatos de madera del siglo XIX hasta los materiales modernos de fibra de vidrio y espuma.",
    url:"https://www.youtube.com/results?search_query=historia+gimnasia+artística+aparatos+evolución" },
  { grado:"7.°", tipo:"Artículo", titulo:"Federación Internacional de Gimnasia (FIG) — sitio oficial",
    descripcion:"Página oficial de la FIG: normas, medidas de aparatos y reglamentos de competencia.",
    url:"https://www.gymnastics.sport/site/" },
  { grado:"7.°", tipo:"Video", titulo:"Restitución elástica en aparatos gimnásticos",
    descripcion:"Cómo los materiales modernos devuelven energía al gimnasta: el concepto de restitución elástica comparado con un resorte.",
    url:"https://www.youtube.com/results?search_query=restitución+elástica+gimnasia+aparatos+modernos" },
  { grado:"7.°", tipo:"Guía", titulo:"Normalización y equidad en competencias de gimnasia",
    descripcion:"Por qué las medidas iguales para todos garantizan equidad y seguridad en los torneos.",
    url:"https://www.gymnastics.sport/site/rules/" },

  /* ===== GRADO 8.° — Análisis táctico: baloncesto y voleibol ===== */
  { grado:"8.°", tipo:"Video", titulo:"Historia del baloncesto — De Naismith a la NBA",
    descripcion:"Cómo James Naismith inventó el baloncesto en 1891 para evitar la violencia del rugby en espacios cerrados.",
    url:"https://www.youtube.com/watch?v=jtvDDeSAFqE" },
  { grado:"8.°", tipo:"Video", titulo:"James Naismith: el profesor que inventó el básquet",
    descripcion:"Biografía de Naismith, las 13 reglas originales y la evolución de la canasta a 3,05 metros.",
    url:"https://www.youtube.com/watch?v=f1rt-7xtA50" },
  { grado:"8.°", tipo:"Video", titulo:"Cómo la línea de tres puntos cambió el baloncesto",
    descripcion:"La línea de tres puntos (NBA 1979, FIBA 1984) reconfiguró la geometría de la cancha y el espaciado ofensivo.",
    url:"https://www.youtube.com/watch?v=-qcf5RRB-KY" },
  { grado:"8.°", tipo:"Video", titulo:"Sistema 5-1 en voleibol — explicación completa",
    descripcion:"Cómo funciona el sistema 5-1: un armador, cinco atacantes, rotaciones y cuándo hay 2 o 3 atacantes delanteros.",
    url:"https://www.youtube.com/watch?v=sL_7vIqcLVs" },
  { grado:"8.°", tipo:"Video", titulo:"Sistemas de juego en voleibol: 6-0, 4-2, 6-2 y 5-1",
    descripcion:"Comparación de los cuatro sistemas de juego desde iniciación hasta alto rendimiento.",
    url:"https://www.youtube.com/watch?v=y8G8DmV0pO8" },
  { grado:"8.°", tipo:"Artículo", titulo:"Rotación en voleibol y el sistema 5-1 — Olympics.com",
    descripcion:"Explicación oficial del sistema 5-1, posiciones, rotaciones y cuándo se produce en un partido.",
    url:"https://www.olympics.com/es/noticias/voleibol-como-funciona-sistema-5-1" },

  /* ===== GRADO 9.° — Análisis reglamentario del fútbol ===== */
  { grado:"9.°", tipo:"Video", titulo:"Diferencias entre fútbol sala y fútbol de salón",
    descripcion:"Julián, jugador profesional, explica las diferencias clave: ente rector, balón, saques y reglas.",
    url:"https://www.youtube.com/watch?v=ERQGCU62MQ0" },
  { grado:"9.°", tipo:"Video", titulo:"Fútbol Sala vs Fútbol de Salón — Diferencias en los reglamentos",
    descripcion:"Comparación visual de las reglas: saques con pie (FIFA) vs. saques con mano (AMF), balón, arquero y posiciones.",
    url:"https://www.youtube.com/watch?v=kMX3cBL40-Y" },
  { grado:"9.°", tipo:"Video", titulo:"Reglas de juego del futsal (FIFA) — enmiendas actualizadas",
    descripcion:"Árbitro internacional explica las reglas del fútbol sala FIFA: reloj detenido, saques con el pie y faltas acumuladas.",
    url:"https://www.youtube.com/watch?v=twylhuWXVYE" },
  { grado:"9.°", tipo:"Artículo", titulo:"Fútbol sala — historia, reglas y diferencias",
    descripcion:"Artículo completo sobre el origen del futsal en Uruguay (1930), reglas AMF vs. FIFA, posiciones y dimensiones.",
    url:"https://concepto.de/futbol-sala/" },
  { grado:"9.°", tipo:"Artículo", titulo:"Fútbol sala — Wikipedia",
    descripcion:"Historia completa, diferencias AMF-FIFA-FIFUSA, medidas de cancha, balón y posiciones tácticas.",
    url:"https://es.wikipedia.org/wiki/F%C3%BAtbol_sala" },
  { grado:"9.°", tipo:"Guía", titulo:"10 diferencias entre fútbol sala y fútbol de salón",
    descripcion:"Tabla comparativa: cancha, balón, saques, arquero, tiempo y ente rector.",
    url:"https://www.zeuspayan.com/2016/01/diferencias-entre-futbol-sala-y-futbol.html" },

  /* ===== GRADO 10.° — Biomecánica del deporte ===== */
  { grado:"10.°", tipo:"Artículo", titulo:"Biomecánica del tiro en suspensión — Baloncesto Educativo",
    descripcion:"Análisis de la cadena cinética del tiro: triple flexión, ápice del salto, quiebre de muñeca y curva fuerza-velocidad.",
    url:"https://jmbaloncestoeducativo.wordpress.com/tag/biomecanica/" },
  { grado:"10.°", tipo:"Artículo", titulo:"Biomecánica del remate en voleibol — efecto de fusta y topspin",
    descripcion:"Artículo científico: fases del remate, torque del tronco, efecto Magnus y por qué el topspin hace caer el balón.",
    url:"https://dialnet.unirioja.es/descarga/articulo/5317973.pdf" },
  { grado:"10.°", tipo:"Artículo", titulo:"Efecto Magnus en voleibol y voley playa",
    descripcion:"Cómo la rotación del balón altera su trayectoria: topspin para ataque, flotante para saque, y su aplicación táctica.",
    url:"https://voleyporelmundo.com/2015/11/02/efecto-magnus-en-voleibol-y-voley-playa-como-utilizar-la-fisica-a-nuestro-favor/" },
  { grado:"10.°", tipo:"Artículo", titulo:"Efecto Magnus explicado — balón de básquet desde 120 metros",
    descripcion:"Explicación visual del principio de Magnus: por qué un balón con rotación curva su trayectoria.",
    url:"https://www.univision.com/explora/efecto-magnus-que-sucede-cuando-arrojas-un-balon-de-basquetbol-desde-120-metros-de-altura" },
  { grado:"10.°", tipo:"Video", titulo:"Prevención de lesiones de rodilla (LCA) en deportistas",
    descripcion:"Valgo dinámico, aterrizajes rígidos y patrones de absorción de carga: cómo prevenir la rotura del ligamento cruzado anterior.",
    url:"https://www.youtube.com/results?search_query=prevención+lesión+LCA+rodilla+deportistas+biomecánica" },

  /* ===== GRADO 11.° — Gestión de torneos y sistemas de competencia ===== */
  { grado:"11.°", tipo:"Artículo", titulo:"Sistemas de competencia: todos contra todos y eliminación directa",
    descripcion:"Fórmulas, ventajas y desventajas de cada sistema. Cuándo usar liga, eliminación o sistema mixto.",
    url:"https://www.youtube.com/results?search_query=sistemas+de+competencia+todos+contra+todos+eliminación+directa+educación+física" },
  { grado:"11.°", tipo:"Video", titulo:"Sistema 5-1 en voleibol — rotaciones explicadas",
    descripcion:"Las 6 rotaciones del sistema 5-1: cuándo el armador está adelante, cuándo atrás, y cómo cambia el ataque.",
    url:"https://www.youtube.com/watch?v=zanhHt8pAvY" },
  { grado:"11.°", tipo:"Video", titulo:"Cómo organizar un torneo deportivo escolar",
    descripcion:"Guía práctica para diseñar un fixture, elegir sistema de competencia, asignar canchas y horarios.",
    url:"https://www.youtube.com/results?search_query=cómo+organizar+torneo+deportivo+escolar+fixture" },
  { grado:"11.°", tipo:"Artículo", titulo:"Introducción a la táctica del voleibol: sistemas de juego",
    descripcion:"Comparación de los sistemas 4-2 y 5-1: estabilidad vs. potencia ofensiva, según el nivel del equipo.",
    url:"https://voleyporelmundo.com/2022/03/15/introduccion-a-la-tactica-2-sistemas-de-juego/" }
];

/* =====================================================================
   RETOS POR GRADO Y PERIODO
   ---------------------------------------------------------------------
   PERIODOS: los tres del año escolar de la JMRP, cada uno con su tema.
   NIVELES:  agrupan los grados que comparten el mismo reto. El estudiante
             elige su grado y el portal le muestra la ruta que le toca.
   RETOS:    cuatro por nivel y por periodo. Puedes agregar más semanas
             copiando una línea y cambiando el número de "semana".
   ===================================================================== */

var PERIODOS = [
  { id:1, nombre:"Periodo 1", tema:"Mi cuerpo se mueve",
    desc:"Reconocer el propio cuerpo, coordinarlo y volver el movimiento un hábito de todos los días." },
  { id:2, nombre:"Periodo 2", tema:"Más fuerte, más ágil",
    desc:"Trabajar fuerza, flexibilidad, velocidad y técnica, y ver el progreso semana a semana." },
  { id:3, nombre:"Periodo 3", tema:"Jugamos juntos",
    desc:"Llevar el movimiento a la familia, al curso y al barrio: cooperar, organizar y compartir." }
];

var NIVELES = [
  { id:"preescolar", nombre:"Preescolar", grados:["Preescolar"],
    nota:"Todos los retos se hacen con papá, mamá o un adulto de la casa, que acompaña y cuida el espacio." },
  { id:"g12", nombre:"1.° y 2.°", grados:["1.°","2.°"],
    nota:"Con un adulto cerca. Busca un espacio despejado, sin muebles ni objetos que estorben." },
  { id:"g34", nombre:"3.° y 4.°", grados:["3.°","4.°"],
    nota:"Calienta siempre antes de empezar y toma agua durante el reto." },
  { id:"g5", nombre:"5.°", grados:["5.°"],
    nota:"Calienta, hidrátate y respeta tu propio ritmo: el reto es contigo, no con los demás." },
  { id:"g67", nombre:"6.° y 7.°", grados:["6.°","7.°"],
    nota:"Antes de cada reto, cinco minutos de calentamiento articular. Si algo duele, para." },
  { id:"g89", nombre:"8.° y 9.°", grados:["8.°","9.°"],
    nota:"Calentamiento y vuelta a la calma en cada sesión. La técnica va primero que la velocidad." },
  { id:"g1011", nombre:"10.° y 11.°", grados:["10.°","11.°"],
    nota:"Registra lo que haces: estos retos son también el insumo de tu proyecto de área." },
  { id:"familias", nombre:"Papás y mamás activos", grados:["Papás y mamás activos"],
    nota:"Empieza por donde estés y sube de a poco. Si tienes alguna condición de salud, consúltalo con tu médico antes de comenzar." }
];

var RETOS = [

/* ================= PREESCOLAR ================= */
{ nivel:"preescolar", periodo:1, semana:1, titulo:"El animal que soy",
  objetivo:"Descubrir distintas formas de moverse imitando animales.",
  pasos:["Elijan juntos cinco animales: rana, oso, cangrejo, culebra y pájaro.",
         "Muévete como cada uno durante un minuto, mientras el adulto adivina cuál eres.",
         "Terminen escogiendo el animal que más les gustó y háganlo los dos juntos."],
  evidencia:"Una foto o un video de 20 segundos imitando tu animal favorito." },

{ nivel:"preescolar", periodo:1, semana:2, titulo:"Semáforo en casa",
  objetivo:"Aprender a arrancar y a frenar el cuerpo cuando toca.",
  pasos:["El adulto dice “verde” y tú corres o caminas rápido en el mismo sitio.",
         "Cuando dice “rojo”, te quedas quieto como estatua.",
         "Con “amarillo”, te mueves muy despacio. Jueguen cinco minutos y cambien de turno."],
  evidencia:"Un video corto del momento “rojo”, cuando quedas hecho estatua." },

{ nivel:"preescolar", periodo:1, semana:3, titulo:"El camino de obstáculos",
  objetivo:"Pasar por encima, por debajo y alrededor de las cosas sin tumbarlas.",
  pasos:["Armen un camino con cojines, sillas y una cuerda o lazo en el piso.",
         "Recórrelo saltando, gateando y caminando en punta de pies.",
         "Háganlo tres veces y cambien un obstáculo de lugar en cada vuelta."],
  evidencia:"Una foto del camino armado o un video recorriéndolo." },

{ nivel:"preescolar", periodo:1, semana:4, titulo:"Pies que sienten",
  objetivo:"Trabajar el equilibrio y descubrir el cuerpo con los pies descalzos.",
  pasos:["Caminen descalzos sobre distintas superficies seguras: cobija, piso, pasto.",
         "Camina por encima de una línea de cinta pegada en el piso, sin salirte.",
         "Quédate parado en un pie mientras cuentan hasta cinco. Cambia de pie."],
  evidencia:"Una foto caminando sobre la línea." },

{ nivel:"preescolar", periodo:2, semana:1, titulo:"Salto de charcos",
  objetivo:"Saltar con los dos pies juntos y caer con seguridad.",
  pasos:["Pongan hojas de papel o periódicos en el piso, como si fueran charcos.",
         "Salta de charco en charco con los dos pies juntos, cayendo con las rodillas blanditas.",
         "Separen un poco los charcos y vuelve a intentarlo."],
  evidencia:"Un video de 15 segundos saltando los charcos." },

{ nivel:"preescolar", periodo:2, semana:2, titulo:"Lanzo y atrapo",
  objetivo:"Coordinar la mirada con las manos.",
  pasos:["Hagan una pelota blandita con medias o con papel y cinta.",
         "Lánzala al adulto y atrápala diez veces seguidas, de cerca.",
         "Ahora sepárense un paso más y vuelvan a intentar diez pases."],
  evidencia:"Un video de tres pases seguidos." },

{ nivel:"preescolar", periodo:2, semana:3, titulo:"Estatuas de equilibrio",
  objetivo:"Sostener el cuerpo quieto en distintas posiciones.",
  pasos:["Párate en un pie con los brazos abiertos y aguanta contando hasta cinco.",
         "Prueba con el otro pie y luego en punta de pies.",
         "Hagan una competencia amable: quién dura más sin moverse."],
  evidencia:"Una foto haciendo tu mejor estatua." },

{ nivel:"preescolar", periodo:2, semana:4, titulo:"El paseo del oso",
  objetivo:"Fortalecer brazos y piernas desplazándose en cuatro apoyos.",
  pasos:["Camina como oso, con manos y pies en el piso, cinco metros de ida y vuelta.",
         "Ahora camina como cangrejo, con la barriga hacia arriba.",
         "Descansen un minuto y repitan la ronda dos veces más."],
  evidencia:"Un video caminando como oso." },

{ nivel:"preescolar", periodo:3, semana:1, titulo:"Baile en familia",
  objetivo:"Disfrutar el movimiento con la música de la casa.",
  pasos:["Escojan tres canciones que le gusten a toda la familia.",
         "Bailen las tres seguidas, sin sentarse.",
         "Inventen un paso nuevo y pónganle un nombre."],
  evidencia:"Un video de 20 segundos del paso que inventaron." },

{ nivel:"preescolar", periodo:3, semana:2, titulo:"El río de la cuerda",
  objetivo:"Saltar, caminar y esquivar siguiendo una regla del juego.",
  pasos:["Pongan una cuerda estirada en el piso: ese es el río.",
         "Salta de lado a lado sin pisar el agua, diez veces.",
         "Ahora camina por la orilla, con un pie delante del otro."],
  evidencia:"Una foto o video saltando el río." },

{ nivel:"preescolar", periodo:3, semana:3, titulo:"Búsqueda del tesoro",
  objetivo:"Moverse con un propósito y seguir instrucciones.",
  pasos:["El adulto esconde tres objetos en la casa o el patio.",
         "Ve por ellos siguiendo pistas: “da cinco saltos hacia la cocina”.",
         "Cuando encuentres los tres, celebren con un baile corto."],
  evidencia:"Una foto con los tres tesoros encontrados." },

{ nivel:"preescolar", periodo:3, semana:4, titulo:"Picnic activo",
  objetivo:"Salir a jugar al aire libre con la familia.",
  pasos:["Vayan al parque, la cancha o un espacio abierto del barrio.",
         "Jueguen media hora: correr, columpiarse, patear una pelota, trepar.",
         "Terminen compartiendo agua o una fruta, sentados en el pasto."],
  evidencia:"Una foto del picnic o del juego en el parque." },

/* ================= 1.° y 2.° ================= */
{ nivel:"g12", periodo:1, semana:1, titulo:"Mi cuerpo por partes",
  objetivo:"Reconocer y mover las articulaciones antes de jugar.",
  pasos:["Mueve en círculos, diez veces cada uno: cuello, hombros, muñecas, cadera, rodillas y tobillos.",
         "Nombra en voz alta cada parte mientras la mueves.",
         "Repite la rutina completa dos veces. Te tomará unos cinco minutos."],
  evidencia:"Un video de 20 segundos haciendo tu calentamiento." },

{ nivel:"g12", periodo:1, semana:2, titulo:"Derecha e izquierda",
  objetivo:"Distinguir los dos lados del cuerpo mientras te mueves.",
  pasos:["Salta diez veces solo con el pie derecho y diez con el izquierdo.",
         "Lanza una pelota con la mano derecha y luego con la izquierda, cinco veces cada una.",
         "Camina tocando con la mano derecha la rodilla izquierda, alternando, veinte pasos."],
  evidencia:"Un video saltando con cada pie." },

{ nivel:"g12", periodo:1, semana:3, titulo:"Camino, troto, corro",
  objetivo:"Sentir la diferencia entre tres ritmos de movimiento.",
  pasos:["Camina rápido dos minutos por el patio o la casa.",
         "Trota suave dos minutos, sin agitarte demasiado.",
         "Corre treinta segundos, descansa un minuto y repite el trote."],
  evidencia:"Una foto o video en el momento del trote." },

{ nivel:"g12", periodo:1, semana:4, titulo:"La cuerda mágica",
  objetivo:"Coordinar el salto con el giro de la cuerda.",
  pasos:["Practica el giro de la cuerda sin saltar, veinte veces.",
         "Haz tres series de diez saltos, descansando entre cada una.",
         "Cuenta cuántos saltos seguidos logras sin enredarte."],
  evidencia:"Un video de tu mejor serie de saltos." },

{ nivel:"g12", periodo:2, semana:1, titulo:"La golosa",
  objetivo:"Saltar con un pie y con dos, controlando la caída.",
  pasos:["Dibuja una golosa con tiza o cinta, con ocho casillas.",
         "Recórrela completa cinco veces, respetando las casillas de un pie.",
         "Intenta una vuelta hacia atrás."],
  evidencia:"Una foto de tu golosa y un video de una vuelta." },

{ nivel:"g12", periodo:2, semana:2, titulo:"Puntería",
  objetivo:"Lanzar con precisión hacia un objetivo.",
  pasos:["Pon un balde o una caja a tres pasos de distancia.",
         "Lanza diez veces con la mano derecha y diez con la izquierda.",
         "Aléjate un paso y cuenta cuántos aciertos consigues de diez."],
  evidencia:"Un video de tres lanzamientos." },

{ nivel:"g12", periodo:2, semana:3, titulo:"Ruedo con cuidado",
  objetivo:"Hacer el rollo adelante protegiendo el cuello.",
  pasos:["Sobre una colchoneta, cobija gruesa o pasto, agrúpate con el mentón al pecho.",
         "Con un adulto al lado, rueda hacia adelante apoyando las manos, no la cabeza.",
         "Haz cinco rollos con descanso entre cada uno."],
  evidencia:"Un video de un rollo, con el adulto acompañando." },

{ nivel:"g12", periodo:2, semana:4, titulo:"El tren de fuerza",
  objetivo:"Fortalecer brazos, piernas y abdomen jugando.",
  pasos:["Camina como oso cinco metros y regresa como cangrejo.",
         "Haz la carretilla con un adulto, cinco metros.",
         "Repite el circuito tres veces, descansando un minuto entre rondas."],
  evidencia:"Un video de la carretilla o del oso." },

{ nivel:"g12", periodo:3, semana:1, titulo:"El juego de mis abuelos",
  objetivo:"Aprender un juego tradicional de la familia.",
  pasos:["Pregunta a un adulto mayor a qué jugaba cuando era niño.",
         "Pídele que te enseñe las reglas y jueguen juntos.",
         "Enséñaselo después a un compañero o hermano."],
  evidencia:"Una foto jugando y el nombre del juego que aprendiste." },

{ nivel:"g12", periodo:3, semana:2, titulo:"Relevos en casa",
  objetivo:"Correr por turnos respetando la regla del relevo.",
  pasos:["Armen dos equipos con la familia, aunque sean de a uno.",
         "Marquen una salida y una meta a diez pasos.",
         "Hagan cinco relevos pasando un objeto de mano en mano."],
  evidencia:"Un video de un relevo completo." },

{ nivel:"g12", periodo:3, semana:3, titulo:"El baile de los números",
  objetivo:"Unir el movimiento con lo que aprendes en clase.",
  pasos:["Cada número del uno al cinco tiene un movimiento: uno es salto, dos es giro…",
         "Un adulto dice un número y tú haces el movimiento.",
         "Ahora dice dos números seguidos y tú haces los dos en orden."],
  evidencia:"Un video haciendo una secuencia de tres números." },

{ nivel:"g12", periodo:3, semana:4, titulo:"Una hora sin pantalla",
  objetivo:"Cambiar tiempo de pantalla por tiempo de juego.",
  pasos:["Elige un día de la semana y apaga las pantallas por una hora.",
         "Usa ese tiempo para jugar afuera o en un espacio despejado.",
         "Cuenta en casa qué fue lo mejor de esa hora."],
  evidencia:"Una foto de lo que hiciste en esa hora." },

/* ================= 3.° y 4.° ================= */
{ nivel:"g34", periodo:1, semana:1, titulo:"Mi propio calentamiento",
  objetivo:"Aprender a preparar el cuerpo antes de la actividad.",
  pasos:["Arma una rutina de seis minutos: movilidad de articulaciones, trote suave y saltos.",
         "Escríbela en el cuaderno en el orden en que la vas a hacer.",
         "Hazla tres días distintos de la semana."],
  evidencia:"Una foto de tu rutina escrita y un video haciendo una parte." },

{ nivel:"g34", periodo:1, semana:2, titulo:"Escucho mi pulso",
  objetivo:"Notar cómo cambia el corazón cuando te mueves.",
  pasos:["Con los dedos en el cuello, cuenta tus pulsaciones durante quince segundos en reposo.",
         "Trota tres minutos y vuelve a contar de inmediato.",
         "Descansa dos minutos y cuenta otra vez. Anota los tres números."],
  evidencia:"Una foto de los tres números anotados." },

{ nivel:"g34", periodo:1, semana:3, titulo:"Diez minutos sin parar",
  objetivo:"Sostener el movimiento continuo sin detenerte.",
  pasos:["Trota suave, camina rápido o baila durante diez minutos seguidos.",
         "Si te cansas, baja el ritmo pero no te detengas.",
         "Hazlo dos veces en la semana."],
  evidencia:"Un video corto y la hora de inicio y fin." },

{ nivel:"g34", periodo:1, semana:4, titulo:"Coordinación con cuerda",
  objetivo:"Mejorar el ritmo del salto.",
  pasos:["Haz cuatro series de veinte saltos con descanso de un minuto.",
         "Prueba saltar alternando los pies, como si trotaras.",
         "Anota tu récord de saltos seguidos."],
  evidencia:"Un video de tu récord." },

{ nivel:"g34", periodo:2, semana:1, titulo:"Fuerza con mi propio peso",
  objetivo:"Trabajar fuerza sin ningún implemento.",
  pasos:["Diez sentadillas cuidando que las rodillas no pasen la punta del pie.",
         "Ocho planchas apoyando las rodillas en el piso.",
         "Quince segundos de puente. Repite el circuito tres veces."],
  evidencia:"Un video de una ronda completa." },

{ nivel:"g34", periodo:2, semana:2, titulo:"Ágil como un gato",
  objetivo:"Mover los pies rápido y con precisión.",
  pasos:["Dibuja con tiza una escalera de ocho cuadros en el piso.",
         "Recórrela con los dos pies dentro de cada cuadro, ida y vuelta, cinco veces.",
         "Ahora hazlo de lado, sin pisar las líneas."],
  evidencia:"Un video de un recorrido." },

{ nivel:"g34", periodo:2, semana:3, titulo:"Contra la pared",
  objetivo:"Lanzar y recibir con las dos manos.",
  pasos:["Lanza una pelota contra la pared y atrápala treinta veces seguidas.",
         "Ahora atrápala solo con la mano derecha y luego con la izquierda.",
         "Aléjate dos pasos y repite la serie."],
  evidencia:"Un video de diez recepciones seguidas." },

{ nivel:"g34", periodo:2, semana:4, titulo:"El reto de la plancha",
  objetivo:"Fortalecer el abdomen y la espalda.",
  pasos:["Sostén la posición de plancha con las rodillas apoyadas, quince segundos.",
         "Descansa un minuto y repite tres veces.",
         "Cada día intenta sumar cinco segundos más."],
  evidencia:"Un video de tu mejor tiempo." },

{ nivel:"g34", periodo:3, semana:1, titulo:"Le enseño a alguien",
  objetivo:"Explicar un juego con sus reglas.",
  pasos:["Escoge un juego que sepas bien.",
         "Enséñaselo a alguien menor de tu casa o del barrio.",
         "Jueguen tres rondas y ajusten una regla entre los dos."],
  evidencia:"Una foto o video enseñando el juego." },

{ nivel:"g34", periodo:3, semana:2, titulo:"Mini torneo familiar",
  objetivo:"Organizar y jugar una competencia sana.",
  pasos:["Elige un juego: ponchados, microfútbol o carreras.",
         "Arma dos equipos y define en cuántos puntos se gana.",
         "Jueguen y anoten el resultado. Al final, saluden a los rivales."],
  evidencia:"Una foto del torneo y el marcador final." },

{ nivel:"g34", periodo:3, semana:3, titulo:"La ruta caminada",
  objetivo:"Caminar treinta minutos en familia.",
  pasos:["Escojan una ruta segura del barrio o la vereda.",
         "Caminen treinta minutos sin parar, conversando.",
         "Al llegar, estiren piernas durante dos minutos."],
  evidencia:"Una foto de la caminata." },

{ nivel:"g34", periodo:3, semana:4, titulo:"Coreografía en equipo",
  objetivo:"Crear una secuencia de movimientos con otros.",
  pasos:["Júntate con dos compañeros o familiares.",
         "Inventen ocho movimientos que se repitan con la música.",
         "Ensáyenla tres veces y preséntenla."],
  evidencia:"Un video de la coreografía." },

/* ================= 5.° ================= */
{ nivel:"g5", periodo:1, semana:1, titulo:"Calentamiento completo",
  objetivo:"Preparar el cuerpo de la cabeza a los pies.",
  pasos:["Haz movilidad articular de arriba hacia abajo, diez repeticiones por articulación.",
         "Trota suave tres minutos.",
         "Termina con veinte saltos y diez sentadillas. Anota el orden."],
  evidencia:"Un video de la parte de movilidad." },

{ nivel:"g5", periodo:1, semana:2, titulo:"Mi punto de partida",
  objetivo:"Registrar cómo estás hoy para comparar más adelante.",
  pasos:["Mide cuánto saltas de largo desde parado, con los pies juntos.",
         "Cuenta cuántas sentadillas haces bien en treinta segundos.",
         "Anota los dos resultados con la fecha. No los compares con nadie más."],
  evidencia:"Una foto de tus registros." },

{ nivel:"g5", periodo:1, semana:3, titulo:"Quince minutos continuos",
  objetivo:"Sostener el esfuerzo aeróbico.",
  pasos:["Trota, camina rápido o monta bicicleta quince minutos sin parar.",
         "Controla la respiración: deberías poder hablar mientras te mueves.",
         "Repítelo dos veces en la semana."],
  evidencia:"Un video corto y la duración." },

{ nivel:"g5", periodo:1, semana:4, titulo:"Cuerda avanzada",
  objetivo:"Dominar dos formas distintas de saltar.",
  pasos:["Cincuenta saltos con los dos pies juntos.",
         "Cincuenta alternando los pies.",
         "Intenta veinte saltos cruzando los brazos."],
  evidencia:"Un video de la variante que más te costó." },

{ nivel:"g5", periodo:2, semana:1, titulo:"Circuito de cuatro estaciones",
  objetivo:"Combinar fuerza, salto y equilibrio.",
  pasos:["Estaciones: doce sentadillas, diez planchas, veinte saltos, veinte segundos en un pie.",
         "Pasa de una a otra sin descanso.",
         "Descansa dos minutos y haz tres rondas."],
  evidencia:"Un video de una ronda completa." },

{ nivel:"g5", periodo:2, semana:2, titulo:"Flexibilidad diaria",
  objetivo:"Ganar rango de movimiento sin forzar.",
  pasos:["Estira piernas, cadera, espalda y hombros: treinta segundos cada zona.",
         "Nunca rebotes ni llegues al dolor: solo tensión suave.",
         "Hazlo cinco días seguidos, a la misma hora."],
  evidencia:"Una foto de uno de los estiramientos." },

{ nivel:"g5", periodo:2, semana:3, titulo:"Reacciono rápido",
  objetivo:"Mejorar la velocidad de reacción.",
  pasos:["Un compañero deja caer una regla o un lápiz y tú lo atrapas. Diez intentos.",
         "Desde sentado, sal corriendo cinco metros cuando escuches una palmada. Ocho veces.",
         "Anota cuántas veces reaccionaste antes de que tocara el piso."],
  evidencia:"Un video de tres intentos." },

{ nivel:"g5", periodo:2, semana:4, titulo:"Domino el balón",
  objetivo:"Controlar el balón con distintas partes del cuerpo.",
  pasos:["Conduce el balón esquivando cinco obstáculos, ida y vuelta.",
         "Haz toques seguidos con el pie y cuenta tu récord.",
         "Practica pases contra la pared, veinte con cada pie."],
  evidencia:"Un video de tu récord de toques." },

{ nivel:"g5", periodo:3, semana:1, titulo:"Invento un juego",
  objetivo:"Crear reglas propias y probarlas.",
  pasos:["Inventa un juego con al menos tres reglas y un modo de ganar.",
         "Escríbelas y explícaselas a tus compañeros.",
         "Jueguen dos rondas y ajusten lo que no funcionó."],
  evidencia:"Una foto de las reglas escritas y del juego en acción." },

{ nivel:"g5", periodo:3, semana:2, titulo:"Reto cooperativo",
  objetivo:"Lograr algo que no se puede hacer solo.",
  pasos:["Entre cuatro, pasen una pelota sin usar las manos, diez veces sin que caiga.",
         "Si cae, empiecen otra vez desde cero.",
         "Hablen al final sobre qué estrategia les sirvió."],
  evidencia:"Un video del intento logrado." },

{ nivel:"g5", periodo:3, semana:3, titulo:"Caminata con propósito",
  objetivo:"Acumular movimiento a lo largo del día.",
  pasos:["Escoge un día y camina lo más que puedas: al colegio, mandados, paseos.",
         "Usa el podómetro del celular o cuenta las cuadras recorridas.",
         "Anota cuánto lograste y compáralo con un día normal."],
  evidencia:"Una foto del registro o del recorrido." },

{ nivel:"g5", periodo:3, semana:4, titulo:"Muestra de talentos",
  objetivo:"Compartir con el curso lo que aprendiste este año.",
  pasos:["Escoge el gesto o la habilidad que mejor te salga.",
         "Ensáyala hasta que te salga tres veces seguidas.",
         "Preséntala ante tu grupo o tu familia."],
  evidencia:"Un video de tu presentación." },

/* ================= 6.° y 7.° ================= */
{ nivel:"g67", periodo:1, semana:1, titulo:"El rollo por fases",
  objetivo:"Ejecutar el rollo adelante respetando el orden de los apoyos.",
  pasos:["Repasa las cuatro fases: agrupar, apoyar manos, rodar sobre la espalda alta, recuperar de pie.",
         "Sobre colchoneta o pasto, haz cinco rollos cuidando que la nuca no toque el piso.",
         "Pide a alguien que te grabe y revisa en qué fase pierdes el agrupamiento."],
  evidencia:"Un video de un rollo completo, de lado." },

{ nivel:"g67", periodo:1, semana:2, titulo:"Dirijo el calentamiento",
  objetivo:"Guiar a otros en la preparación del cuerpo.",
  pasos:["Diseña un calentamiento de ocho minutos con movilidad, activación y estiramiento suave.",
         "Dirígelo a tu familia o a un grupo de compañeros.",
         "Explica en voz alta para qué sirve cada ejercicio."],
  evidencia:"Un video dirigiendo una parte del calentamiento." },

{ nivel:"g67", periodo:1, semana:3, titulo:"Veinte minutos continuos",
  objetivo:"Construir base aeróbica.",
  pasos:["Trota, camina rápido, nada o monta bicicleta veinte minutos sin parar.",
         "Mantén un ritmo en el que puedas hablar sin ahogarte.",
         "Hazlo tres veces en la semana y anota cómo te sentiste cada vez."],
  evidencia:"Una foto o video de una de las sesiones." },

{ nivel:"g67", periodo:1, semana:4, titulo:"Cuido mi espalda",
  objetivo:"Corregir la postura al estudiar y en el día a día.",
  pasos:["Revisa tu postura al sentarte: pies apoyados, espalda recta, pantalla a la altura de los ojos.",
         "Cada cuarenta minutos de estudio, haz dos minutos de pausa activa.",
         "Sostén tres veces al día veinte segundos de plancha para fortalecer el centro."],
  evidencia:"Una foto de tu puesto de estudio corregido." },

{ nivel:"g67", periodo:2, semana:1, titulo:"Circuito de fuerza básica",
  objetivo:"Trabajar los grandes grupos musculares con el propio peso.",
  pasos:["Quince sentadillas, diez flexiones, treinta segundos de plancha, veinte segundos de puente.",
         "Descansa un minuto entre estaciones.",
         "Completa tres rondas, tres veces por semana."],
  evidencia:"Un video de una ronda." },

{ nivel:"g67", periodo:2, semana:2, titulo:"Llego más lejos",
  objetivo:"Medir y mejorar la flexibilidad.",
  pasos:["Sentado con piernas estiradas, mide hasta dónde llegan tus manos. Anótalo.",
         "Estira piernas y espalda cinco minutos, cinco días seguidos.",
         "Vuelve a medir al final de la semana y compara."],
  evidencia:"Foto de las dos mediciones." },

{ nivel:"g67", periodo:2, semana:3, titulo:"Equilibrio sobre la línea",
  objetivo:"Trabajar el equilibrio como en la viga de la gimnasia.",
  pasos:["Marca una línea recta de tres metros con cinta o tiza.",
         "Recórrela con un pie delante del otro, ida y vuelta, cinco veces.",
         "Ahora hazlo de espaldas y luego con un giro en la mitad."],
  evidencia:"Un video del recorrido con giro." },

{ nivel:"g67", periodo:2, semana:4, titulo:"Cambio de dirección",
  objetivo:"Ganar velocidad y control al frenar y girar.",
  pasos:["Marca cinco conos o botellas en zigzag, separados dos metros.",
         "Recórrelos lo más rápido que puedas sin tumbarlos, ocho veces.",
         "Cronometra el primero y el último intento."],
  evidencia:"Un video de un recorrido y los dos tiempos." },

{ nivel:"g67", periodo:3, semana:1, titulo:"Organizo un juego para el curso",
  objetivo:"Planear una actividad para que todos participen.",
  pasos:["Diseña un juego en el que jueguen al menos veinte personas.",
         "Escribe las reglas, el material necesario y cómo se gana.",
         "Preséntalo y dirígelo en el descanso o en clase."],
  evidencia:"Foto del juego en marcha y de las reglas escritas." },

{ nivel:"g67", periodo:3, semana:2, titulo:"Relevos por equipos",
  objetivo:"Competir cooperando dentro del equipo.",
  pasos:["Arma equipos de cuatro.",
         "Definan un recorrido con tres tareas distintas: correr, conducir un balón y saltar.",
         "Hagan tres rondas y roten el orden de los integrantes."],
  evidencia:"Un video de una ronda de relevos." },

{ nivel:"g67", periodo:3, semana:3, titulo:"Cuarenta y cinco minutos al aire libre",
  objetivo:"Mover el cuerpo fuera de casa.",
  pasos:["Escoge caminata, ciclada o partido en la cancha.",
         "Sostén la actividad cuarenta y cinco minutos.",
         "Ve acompañado y lleva agua."],
  evidencia:"Una foto de la salida." },

{ nivel:"g67", periodo:3, semana:4, titulo:"Tutorial de un gesto técnico",
  objetivo:"Explicar con tus palabras cómo se hace bien un movimiento.",
  pasos:["Escoge un gesto: rollo, remate, lanzamiento o conducción.",
         "Grábate explicando sus fases y mostrándolo.",
         "El video debe durar máximo un minuto."],
  evidencia:"El video tutorial." },

/* ================= 8.° y 9.° ================= */
{ nivel:"g89", periodo:1, semana:1, titulo:"Calentamiento específico",
  objetivo:"Preparar el cuerpo para tu deporte, no para cualquiera.",
  pasos:["Escoge tu deporte: baloncesto, voleibol, fútbol o fútbol de salón.",
         "Diseña un calentamiento de diez minutos con movilidad, activación y gestos del deporte.",
         "Aplícalo antes de cada práctica de la semana."],
  evidencia:"Un video de la parte específica de tu calentamiento." },

{ nivel:"g89", periodo:1, semana:2, titulo:"Analizo mi técnica",
  objetivo:"Ver tu propio movimiento con ojo crítico.",
  pasos:["Graba en video un gesto tuyo: remate, lanzamiento o conducción.",
         "Míralo en cámara lenta e identifica sus fases.",
         "Escribe dos cosas que harías distinto y vuelve a grabarlo."],
  evidencia:"Los dos videos, antes y después." },

{ nivel:"g89", periodo:1, semana:3, titulo:"Veinticinco minutos continuos",
  objetivo:"Sostener la actividad aeróbica con ritmo estable.",
  pasos:["Corre, nada, monta bicicleta o baila veinticinco minutos sin parar.",
         "Toma tu pulso al terminar y anótalo.",
         "Repite tres veces en la semana."],
  evidencia:"Registro de las tres sesiones con el pulso final." },

{ nivel:"g89", periodo:1, semana:4, titulo:"Pausas activas para estudiar",
  objetivo:"Usar el movimiento a favor del rendimiento escolar.",
  pasos:["Diseña una pausa activa de tres minutos: cuello, hombros, espalda y piernas.",
         "Aplícala entre bloques de estudio durante toda la semana.",
         "Enséñala a tu curso."],
  evidencia:"Un video de la pausa activa completa." },

{ nivel:"g89", periodo:2, semana:1, titulo:"Fuerza y centro",
  objetivo:"Fortalecer piernas, brazos y zona media.",
  pasos:["Veinte sentadillas, doce flexiones, cuarenta segundos de plancha, quince zancadas por pierna.",
         "Descansa un minuto entre estaciones y haz cuatro rondas.",
         "Anota tus repeticiones cada sesión y busca sumar de a poco."],
  evidencia:"Un video de una ronda y la tabla de registros." },

{ nivel:"g89", periodo:2, semana:2, titulo:"Mi salto vertical",
  objetivo:"Medir la potencia de las piernas y mejorarla.",
  pasos:["Mide tu salto marcando la pared con tiza en los dedos. Anótalo.",
         "Entrena saltos: tres series de diez, tres días de la semana.",
         "Vuelve a medir al final y compara."],
  evidencia:"Foto de las dos marcas en la pared." },

{ nivel:"g89", periodo:2, semana:3, titulo:"Precisión con cansancio",
  objetivo:"Sostener la técnica cuando el cuerpo ya está fatigado.",
  pasos:["Corre treinta segundos a ritmo fuerte.",
         "Inmediatamente haz diez lanzamientos o pases al objetivo.",
         "Repite cinco veces y anota cuántos aciertos tuviste en cada serie."],
  evidencia:"Un video de una serie y la tabla de aciertos." },

{ nivel:"g89", periodo:2, semana:4, titulo:"Movilidad de hombro y cadera",
  objetivo:"Prevenir lesiones en las articulaciones que más trabajan.",
  pasos:["Haz cinco ejercicios de movilidad de hombro y cinco de cadera.",
         "Sostén cada posición treinta segundos, sin dolor.",
         "Practícalo seis días seguidos, después de entrenar."],
  evidencia:"Un video de tu rutina de movilidad." },

{ nivel:"g89", periodo:3, semana:1, titulo:"Arbitro un partido",
  objetivo:"Aplicar el reglamento desde el otro lado.",
  pasos:["Estudia el reglamento del deporte que vas a arbitrar.",
         "Dirige un partido de tu curso o del barrio.",
         "Escribe tres situaciones difíciles que te tocó resolver."],
  evidencia:"Una foto arbitrando y tus tres situaciones." },

{ nivel:"g89", periodo:3, semana:2, titulo:"Torneo relámpago",
  objetivo:"Jugar un torneo corto con reglas claras.",
  pasos:["Organicen equipos dentro del curso.",
         "Definan tiempos, sistema de puntos y forma de desempate.",
         "Jueguen y publiquen la tabla final."],
  evidencia:"Foto del torneo y de la tabla de posiciones." },

{ nivel:"g89", periodo:3, semana:3, titulo:"Entreno a alguien de mi casa",
  objetivo:"Transferir lo aprendido a la familia.",
  pasos:["Escoge a alguien de tu casa y pregúntale qué le gustaría mejorar.",
         "Diseña tres sesiones de veinte minutos adaptadas a esa persona.",
         "Acompáñala durante la semana."],
  evidencia:"Una foto o video de una de las sesiones." },

{ nivel:"g89", periodo:3, semana:4, titulo:"Campaña de vida activa",
  objetivo:"Convencer a otros de moverse más.",
  pasos:["Escoge un mensaje: menos pantalla, más juego; muévete treinta minutos al día.",
         "Crea una pieza: cartel, video corto o publicación.",
         "Compártela con tu curso o tu comunidad."],
  evidencia:"La pieza de la campaña." },

/* ================= 10.° y 11.° ================= */
{ nivel:"g1011", periodo:1, semana:1, titulo:"Analizo mi propio movimiento",
  objetivo:"Aplicar la biomecánica a un gesto propio.",
  pasos:["Graba un gesto deportivo tuyo desde el lado y desde el frente.",
         "Divídelo en fases y describe qué articulaciones y palancas intervienen.",
         "Señala el punto donde pierdes eficiencia."],
  evidencia:"El video y tu análisis escrito por fases." },

{ nivel:"g1011", periodo:1, semana:2, titulo:"Mi plan de cuatro semanas",
  objetivo:"Planificar el propio entrenamiento con objetivos claros.",
  pasos:["Define un objetivo medible: resistencia, fuerza o flexibilidad.",
         "Arma un plan de cuatro semanas con días, ejercicios y progresión.",
         "Deja escrito cómo vas a saber si lo lograste."],
  evidencia:"Foto o archivo del plan escrito." },

{ nivel:"g1011", periodo:1, semana:3, titulo:"Treinta minutos continuos",
  objetivo:"Sostener el trabajo aeróbico de forma controlada.",
  pasos:["Corre, nada, monta bicicleta o camina rápido treinta minutos sin parar.",
         "Controla que puedas sostener una conversación entrecortada.",
         "Hazlo tres veces en la semana."],
  evidencia:"Registro de las tres sesiones." },

{ nivel:"g1011", periodo:1, semana:4, titulo:"Mi zona de trabajo",
  objetivo:"Entrenar con la frecuencia cardiaca como guía.",
  pasos:["Calcula tu frecuencia máxima aproximada restando tu edad a 220.",
         "Ubica el rango entre el 60 % y el 75 % de ese número.",
         "Haz dos sesiones tomándote el pulso cada diez minutos para no salirte del rango."],
  evidencia:"Tus cálculos y los registros de pulso." },

{ nivel:"g1011", periodo:2, semana:1, titulo:"Acondicionamiento completo",
  objetivo:"Integrar fuerza, resistencia y movilidad en una sesión.",
  pasos:["Arma seis estaciones que combinen tren superior, inferior y centro.",
         "Trabaja cuarenta segundos por estación con veinte de descanso.",
         "Haz cuatro rondas, tres veces por semana."],
  evidencia:"Un video de una ronda completa." },

{ nivel:"g1011", periodo:2, semana:2, titulo:"Progresión de fuerza",
  objetivo:"Aumentar la carga de manera ordenada.",
  pasos:["Escoge tres ejercicios y anota tus repeticiones actuales.",
         "Cada sesión suma una o dos repeticiones, sin cambiar la técnica.",
         "Al terminar la semana, compara la primera sesión con la última."],
  evidencia:"Tu tabla de series y repeticiones." },

{ nivel:"g1011", periodo:2, semana:3, titulo:"Agilidad y potencia",
  objetivo:"Combinar velocidad, salto y cambio de dirección.",
  pasos:["Diseña un circuito de agilidad de veinte segundos con al menos tres cambios de dirección.",
         "Hazlo seis veces con descanso completo entre repeticiones.",
         "Cronometra todas y calcula tu promedio."],
  evidencia:"Un video del circuito y tus tiempos." },

{ nivel:"g1011", periodo:2, semana:4, titulo:"Recuperación y descanso",
  objetivo:"Entender que el descanso también entrena.",
  pasos:["Diseña una rutina de vuelta a la calma de ocho minutos.",
         "Aplícala después de cada sesión durante la semana.",
         "Registra tus horas de sueño y observa cómo te sientes al entrenar."],
  evidencia:"Video de la rutina y tu registro de la semana." },

{ nivel:"g1011", periodo:3, semana:1, titulo:"Diseño un torneo",
  objetivo:"Aplicar la gestión deportiva que trabajamos en clase.",
  pasos:["Escoge el sistema de competencia y calcula el número de partidos.",
         "Arma el calendario, la planilla de juego y la tabla de posiciones.",
         "Define el reglamento y los criterios de desempate."],
  evidencia:"El calendario y la planilla del torneo." },

{ nivel:"g1011", periodo:3, semana:2, titulo:"Dirijo una sesión",
  objetivo:"Liderar una clase práctica con estudiantes menores.",
  pasos:["Prepara una sesión de veinte minutos para un grupo de primaria.",
         "Incluye calentamiento, parte central y vuelta a la calma.",
         "Dirígela con acompañamiento del docente."],
  evidencia:"Foto o video dirigiendo la sesión." },

{ nivel:"g1011", periodo:3, semana:3, titulo:"Voluntariado deportivo",
  objetivo:"Aportar a un evento del colegio o del municipio.",
  pasos:["Ofrécete para apoyar un evento deportivo: planillas, arbitraje o logística.",
         "Cumple tu turno completo.",
         "Escribe qué aprendiste de la organización."],
  evidencia:"Foto en el evento y tu reflexión escrita." },

{ nivel:"g1011", periodo:3, semana:4, titulo:"Mi legado activo",
  objetivo:"Dejar algo que sirva a los que vienen detrás.",
  pasos:["Escoge un producto: guía, video, reglamento o campaña.",
         "Hazlo pensando en un grado menor que el tuyo.",
         "Entrégalo al área para que quede en el portal."],
  evidencia:"El producto terminado." },

/* ================= PAPÁS Y MAMÁS ACTIVOS ================= */
{ nivel:"familias", periodo:1, semana:1, titulo:"Tres veces por semana",
  objetivo:"Volver el movimiento una cita fija en la agenda.",
  pasos:["Escoge tres días y una hora concreta para moverte veinte minutos.",
         "Puede ser caminar, bailar, montar bicicleta o jugar con sus hijos.",
         "Anótelo en el calendario como cualquier otro compromiso."],
  evidencia:"Una foto de una de las tres sesiones." },

{ nivel:"familias", periodo:1, semana:2, titulo:"La caminata de la tarde",
  objetivo:"Cerrar el día caminando en familia.",
  pasos:["Escojan una ruta segura cerca de casa.",
         "Caminen treinta minutos, cuatro días de la semana.",
         "Aprovechen para conversar sin celular."],
  evidencia:"Una foto de la caminata." },

{ nivel:"familias", periodo:1, semana:3, titulo:"Pausas en la jornada",
  objetivo:"Romper las horas largas de estar sentado o de pie.",
  pasos:["Cada hora, levántese y muévase dos minutos.",
         "Estire cuello, hombros, espalda y piernas.",
         "Hágalo durante cinco días de trabajo."],
  evidencia:"Una foto de su pausa activa." },

{ nivel:"familias", periodo:1, semana:4, titulo:"El reto de las escaleras",
  objetivo:"Aprovechar lo cotidiano para moverse más.",
  pasos:["Cambie el ascensor por las escaleras siempre que pueda.",
         "Suba a un ritmo cómodo, sin quedarse sin aire.",
         "Cuente cuántos pisos subió en la semana."],
  evidencia:"Su conteo de la semana." },

{ nivel:"familias", periodo:2, semana:1, titulo:"Fuerza en casa",
  objetivo:"Trabajar fuerza sin necesidad de gimnasio.",
  pasos:["Sentadillas apoyándose en una silla, flexiones contra la pared y puente.",
         "Diez repeticiones de cada uno, dos rondas.",
         "Hágalo dos veces por semana, respetando su ritmo."],
  evidencia:"Un video de una ronda." },

{ nivel:"familias", periodo:2, semana:2, titulo:"Estirar al final del día",
  objetivo:"Aliviar la tensión que deja la jornada.",
  pasos:["Estire espalda, cuello, hombros y piernas.",
         "Treinta segundos por zona, sin rebotes y sin llegar al dolor.",
         "Repítalo cinco noches seguidas."],
  evidencia:"Una foto de su rutina de estiramiento." },

{ nivel:"familias", periodo:2, semana:3, titulo:"Domingo activo",
  objetivo:"Dedicar un rato largo del fin de semana al movimiento.",
  pasos:["Escojan una actividad en familia: caminata, ciclada, natación o partido.",
         "Sosténganla cuarenta y cinco minutos.",
         "Lleven agua y protección solar."],
  evidencia:"Una foto del domingo activo." },

{ nivel:"familias", periodo:2, semana:4, titulo:"Cambio una costumbre",
  objetivo:"Reemplazar un hábito sedentario por uno activo.",
  pasos:["Identifique una costumbre: ver televisión toda la noche, ir en moto a la esquina.",
         "Cámbiela por una alternativa con movimiento durante la semana.",
         "Cuente en casa cómo le fue con el cambio."],
  evidencia:"Una foto o una nota corta contando el cambio." },

{ nivel:"familias", periodo:3, semana:1, titulo:"Lo que jugábamos antes",
  objetivo:"Enseñar a los hijos los juegos de su propia infancia.",
  pasos:["Escoja un juego tradicional que jugaba de niño o niña.",
         "Enséñelo con sus reglas originales.",
         "Jueguen juntos al menos tres rondas."],
  evidencia:"Una foto jugando y el nombre del juego." },

{ nivel:"familias", periodo:3, semana:2, titulo:"El reto de mi hijo o hija",
  objetivo:"Hacer juntos el reto que le corresponde al estudiante.",
  pasos:["Pídale que le muestre el reto de su grado esta semana.",
         "Háganlo los dos, adaptando lo que haga falta.",
         "Que sea el estudiante quien dirija."],
  evidencia:"Una foto o video de los dos haciendo el reto." },

{ nivel:"familias", periodo:3, semana:3, titulo:"Familia en movimiento",
  objetivo:"Participar en una jornada deportiva del colegio o del municipio.",
  pasos:["Averigüe la próxima jornada o carrera familiar.",
         "Inscríbase y participe con sus hijos.",
         "Si no hay ninguna, organice una con otras familias del salón."],
  evidencia:"Una foto de la jornada." },

{ nivel:"familias", periodo:3, semana:4, titulo:"El hábito que me quedó",
  objetivo:"Reconocer qué cambió en la familia durante el año.",
  pasos:["Revise los retos que hicieron a lo largo de los tres periodos.",
         "Escoja el que se volvió costumbre en la casa.",
         "Cuéntelo en pocas líneas o en un video corto."],
  evidencia:"Su relato escrito o en video." }

];

