/* CONFIGURACIÓN (año escolar, grupos y conexiones con las hojas de Google) — Portal de Educación Física · I.E. Jesús María Rojas Pagola */

/* =====================================================================
   AÑO ESCOLAR Y GRUPOS — lo primero que se revisa cada enero
   ---------------------------------------------------------------------
   GRUPOS_POR_GRADO: los grupos que aparecen al escoger una evaluación.
   Si un grado no está en la lista, se usan los grupos que traiga cada
   evaluación. Para agregar un grupo, añádalo entre comillas, separado
   por coma. Ej.: "6.°": ["6-1","6-2","6-3"],
   Abrir o cerrar una evaluación NO se hace aquí: se hace en la hoja de
   resultados, pestaña "Control evaluaciones", columna "Abierta (SI/NO)".
   ===================================================================== */
var ANIO_ESCOLAR = 2027;
var GRUPOS_POR_GRADO = {
  "6.°":  ["6-1","6-2"],
  "7.°":  ["7-1","7-2"],
  "8.°":  ["8-1","8-2"],
  "9.°":  ["9-1","9-2"],
  "10.°": ["10-1","10-2"],
  "11.°": ["11-1","11-2"]
};

/* --- TORNEOS -----------------------------------------------------------
   Módulo de torneos "Interclases Tiempo Libre". A diferencia de Recursos
   o Retos, aquí NO se edita una lista fija en el código: el profesor crea
   los torneos desde el botón "Organizador" dentro de la propia página,
   con la clave de acceso que definas abajo.

   IMPORTANTE — cómo se guardan los datos:
   Esta página es un sitio estático (sin servidor propio). Por defecto,
   torneos, equipos y resultados se guardan en el almacenamiento local
   (localStorage) del NAVEGADOR donde se crean, así que si el profesor
   administra siempre desde el mismo computador, funciona ahí sin más.

   Para que TODOS (estudiantes, desde cualquier dispositivo) vean la misma
   tabla de posiciones, pega la URL del Web App de Apps Script (conectado
   a tu hoja de cálculo) en TORNEOS.ENDPOINT, un par de líneas más abajo.
   Con el ENDPOINT configurado, la página:
     • Envía cada cambio (crear torneo, resultado, estado) a la hoja.
     • Al entrar a "Torneos" trae automáticamente la versión más reciente
       de la hoja, así que se ve igual desde cualquier navegador.
   El código de Apps Script (Code.gs) para pegar en script.google.com se
   entrega aparte, junto con el paso a paso de despliegue.
   ------------------------------------------------------------------------ */
/* La clave del profesor YA NO se guarda en la página (antes cualquiera
   podía leerla en el código fuente). Ahora se verifica en el Apps Script
   de Evaluaciones (CLAVE_PROFESOR) y debe coincidir con CLAVE_ORGANIZADOR
   del Apps Script de Torneos. */
var PROF_SESSION_KEY = "jmrp_profesor_ok"; // una sola clave desbloquea todo
                                     // el Panel del profesor (Torneos,
                                     // Evaluaciones y Diario).
var TORNEOS = { ENDPOINT:"https://script.google.com/macros/s/AKfycbwZom2Ehtdj-cP9QTfQn8SoZOQ92LWjnF8XbQWksqBXEYty-aDDJtOg2AQOpIl9ry9s/exec" };

/* Evidencias de los retos (fotos/enlaces que suben los estudiantes desde
   cada tarjeta de "Retos"). Usa el MISMO Web App que Torneos —no hace
   falta desplegar un script aparte— porque Code.gs ya distingue las
   solicitudes por su campo "tipo" ("torneos" vs "evidencia"). */
var EVIDENCIAS = { ENDPOINT:"https://script.google.com/macros/s/AKfycbwo0MTQTetB3Buy94U8vBN97jjV2H6qmackhXICrCWF7gyHtq2mhINFRUftYunBKe_G/exec" };
var EXAMENES = { ENDPOINT:"" }; // opcional: URL "…/exec" de un Web App de Apps Script
                                 // para que las evaluaciones cargadas se vean en todos
                                 // los dispositivos (igual que TORNEOS). Vacío = solo en
                                 // el navegador donde se cargaron.
var DEPORTES_TORNEO = ["Voleibol","Microfútbol","Baloncesto"];
var MODALIDAD_TORNEO = "Interclases Tiempo Libre";

/* --- DIARIO DE ACTIVIDAD FÍSICA -------------------------------------
   Para activarlo necesitas una hoja de cálculo con su propio Apps
   Script (como el de las evaluaciones). Pega aquí la URL /exec,
   pon activo:true y cambia SECCIONES.diario.visible a true.
   meta: minutos semanales que se proponen como objetivo.               */
var DIARIO = { activo:true, ENDPOINT:EVIDENCIAS.ENDPOINT, meta:180 }; // usa el mismo Apps Script de Evidencias

var CONFIG = { ENDPOINT: "https://script.google.com/macros/s/AKfycbwzb0tlOv5im38_2d1CfYbJEDqonj8h4wcpPyZu-05jJzk-Wz8f1HyomsqabeBAxIX1IA/exec" };

