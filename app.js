/* FUNCIONAMIENTO del portal. Normalmente no hay que tocar este archivo. — Portal de Educación Física · I.E. Jesús María Rojas Pagola */

/* ====== CARGAR EVALUACIÓN (profesor) ======
   Permite subir evaluaciones nuevas (tipo Saber/ICFES) sin tocar el código:
   el profesor pega o sube el texto de la evaluación con un formato sencillo
   y la página la convierte automáticamente al mismo formato que usan las
   evaluaciones que ya vienen incluidas (EXAMS_BASE). Las evaluaciones
   cargadas se guardan en el navegador (localStorage) y, si coinciden en
   grado + periodo con una evaluación ya existente, la reemplazan; si no,
   se agregan como una evaluación nueva (por ejemplo, para Periodo 2 o 3).  */
var EV_KEY="jmrp_evaluaciones_v1";
var evParseado=null; // último resultado de evParsear(), pendiente de guardar

function evNormalizarGrado(raw){
  if(!raw) return "";
  raw=raw.trim();
  var m=raw.match(/(\d{1,2})/);
  if(m) return m[1]+".°";
  return raw;
}
function evNormalizarPeriodo(raw){
  if(!raw) return "";
  var m=raw.match(/(\d)/);
  if(m) return "Periodo "+m[1];
  return raw.trim();
}

/* Analiza el texto de una evaluación (pegado o extraído de un archivo) y
   devuelve {ok, errores, meta, textos, preguntas}. Ver la plantilla dentro
   de la pantalla "Cargar evaluación" para el formato exacto esperado.      */
function evParsear(textoOriginal){
  var errores=[];
  var texto=(textoOriginal||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");

  var meta={ titulo:"", area:"Educación Física, Recreación y Deportes", tiempo:30, puntos:1, grado:"", grupos:[], periodo:"", modalidad:"Evaluación final" };
  function campo(re){ var m=texto.match(re); return m?m[1].trim():""; }
  meta.titulo = campo(/^T[IÍ]TULO\s*:\s*(.+)$/im);
  var areaCap = campo(/^[ÁA]REA\s*:\s*(.+)$/im); if(areaCap) meta.area=areaCap;
  var tiempoCap = campo(/^TIEMPO[^:\n]*:\s*(\d+)/im); if(tiempoCap) meta.tiempo=parseInt(tiempoCap,10);
  var puntosCap = campo(/^PUNTOS[^:\n]*:\s*(\d+)/im); if(puntosCap) meta.puntos=parseInt(puntosCap,10);
  var modalidadCap = campo(/^MODALIDAD\s*:\s*(.+)$/im);
  if(modalidadCap && /quiz/i.test(modalidadCap)) meta.modalidad="Quiz";
  meta.grado = evNormalizarGrado(campo(/^GRADO\s*:\s*(.+)$/im));
  meta.periodo = evNormalizarPeriodo(campo(/^PERIODO\s*:\s*(.+)$/im));
  var gruposCap = campo(/^GRUPOS?\s*:\s*(.+)$/im);
  if(gruposCap) meta.grupos = gruposCap.split(/[,;]/).map(function(s){return s.trim();}).filter(Boolean);

  var lineas = texto.split("\n").filter(function(l){
    return !/^(T[IÍ]TULO|[ÁA]REA|TIEMPO|PUNTOS|GRADO|GRUPOS?|PERIODO)\s*:/i.test(l.trim());
  });

  var textos=[], preguntas=[];
  var textoActivo=null, preguntaActiva=null, ultimaOpcion=null;
  var modo="cuerpo";
  var claveLineas=[];

  for(var i=0;i<lineas.length;i++){
    var l=lineas[i].replace(/\s+$/,"").trim();
    if(!l) continue;

    if(modo==="cuerpo" && /^CLAVE/i.test(l)){
      modo="clave";
      var restoClave=l.replace(/^CLAVE[^:]*:?/i,"").trim();
      if(restoClave) claveLineas.push(restoClave);
      continue;
    }
    if(modo==="clave"){
      /* La sección de clave termina en la primera línea que ya no parece
         parte de la clave (números, letras A-D y separadores). Así, si el
         profesor deja una nota o instrucción después de la clave, no se
         cuela como si fuera parte de las respuestas. */
      if(/^[0-9A-Da-d\s.,:\-)]+$/.test(l)){ claveLineas.push(l); }
      else { modo="fin"; }
      continue;
    }
    if(modo==="fin"){ continue; }

    var mTexto = l.match(/^TEXTO\s*(\d+)\s*[:\-]?\s*(.*)$/i);
    if(mTexto){
      textoActivo = { id:parseInt(mTexto[1],10), titulo:mTexto[2]||"", cuerpo:"" };
      textos.push(textoActivo); preguntaActiva=null; ultimaOpcion=null;
      continue;
    }
    var mPreg = l.match(/^(\d{1,3})[.)]\s+(.*)$/);
    if(mPreg){
      preguntaActiva = { n:parseInt(mPreg[1],10), seccion: textoActivo?textoActivo.id:1,
        competencia:"", enunciado:mPreg[2]||"", opciones:{}, clave:null };
      preguntas.push(preguntaActiva); ultimaOpcion=null;
      continue;
    }
    var mOp = l.match(/^([A-Da-d])[.)]\s+(.*)$/);
    if(mOp && preguntaActiva){
      var letra=mOp[1].toUpperCase();
      preguntaActiva.opciones[letra]=mOp[2]||""; ultimaOpcion=letra;
      continue;
    }
    var mComp = l.match(/^COMPETENCIA\s*:\s*(.+)$/i);
    if(mComp && preguntaActiva){ preguntaActiva.competencia=mComp[1].trim(); continue; }

    if(preguntaActiva && Object.keys(preguntaActiva.opciones).length===0){
      preguntaActiva.enunciado = (preguntaActiva.enunciado?preguntaActiva.enunciado+" ":"")+l;
    } else if(preguntaActiva && ultimaOpcion){
      preguntaActiva.opciones[ultimaOpcion] += " "+l;
    } else if(textoActivo){
      if(!textoActivo.titulo){ textoActivo.titulo=l; }
      else textoActivo.cuerpo = (textoActivo.cuerpo?textoActivo.cuerpo+" ":"")+l;
    }
  }

  var claveTexto = claveLineas.join(" ");
  var mapaClave = {};
  var reClave = /(\d{1,3})\s*[.):\-]?\s*([A-Da-d])\b/g, mc;
  while((mc=reClave.exec(claveTexto))){ mapaClave[parseInt(mc[1],10)] = mc[2].toUpperCase(); }
  preguntas.forEach(function(q){ q.clave = mapaClave[q.n] || null; });

  if(!meta.titulo) errores.push("Falta el título (línea 'TÍTULO: ...').");
  if(!meta.grado) errores.push("Falta el grado (línea 'GRADO: ...').");
  if(!meta.periodo) errores.push("Falta el periodo (línea 'PERIODO: ...').");
  if(!meta.grupos.length) errores.push("Falta al menos un grupo (línea 'GRUPOS: ...').");
  if(!preguntas.length) errores.push("No se encontró ninguna pregunta. Cada pregunta debe empezar con 'número.' seguido del enunciado.");

  var vistos={};
  preguntas.forEach(function(q){
    if(vistos[q.n]) errores.push("Hay dos preguntas con el número "+q.n+".");
    vistos[q.n]=true;
    ["A","B","C","D"].forEach(function(k){ if(!q.opciones[k]) errores.push("Pregunta "+q.n+": falta la opción "+k+"."); });
    if(!q.clave) errores.push("Pregunta "+q.n+": no aparece en la Clave de respuestas.");
    else if(!q.opciones[q.clave]) errores.push("Pregunta "+q.n+": la clave ("+q.clave+") no corresponde a ninguna de sus opciones.");
  });

  return { ok: errores.length===0, errores:errores, meta:meta, textos:textos, preguntas:preguntas };
}

/* ---- extracción de texto desde un archivo subido (.txt / .pdf / .docx) ---- */
var evLibCargada={}; // caché de librerías externas ya inyectadas
function evCargarLibreria(src, globalCheck, cb){
  if(evLibCargada[src]){ cb(true); return; }
  if(typeof globalCheck()!=="undefined"){ evLibCargada[src]=true; cb(true); return; }
  var s=document.createElement("script");
  s.src=src;
  s.onload=function(){ evLibCargada[src]=true; cb(true); };
  s.onerror=function(){ cb(false); };
  document.head.appendChild(s);
}
function evExtraerDeArchivo(file, cb){
  var nombre=(file.name||"").toLowerCase();
  if(nombre.endsWith(".txt")){
    var r=new FileReader();
    r.onload=function(){ cb(r.result,null); };
    r.onerror=function(){ cb(null,"No se pudo leer el archivo de texto."); };
    r.readAsText(file);
    return;
  }
  if(nombre.endsWith(".docx")){
    evCargarLibreria("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.11.0/mammoth.browser.min.js",
      function(){ return typeof window.mammoth; },
      function(ok){
        if(!ok||!window.mammoth){ cb(null,"No se pudo cargar el lector de Word. Copia el texto y pégalo abajo."); return; }
        var r=new FileReader();
        r.onload=function(){
          window.mammoth.extractRawText({arrayBuffer:r.result}).then(function(res){ cb(res.value,null); })
            .catch(function(){ cb(null,"No se pudo leer este .docx automáticamente. Copia el texto y pégalo abajo."); });
        };
        r.onerror=function(){ cb(null,"No se pudo leer el archivo."); };
        r.readAsArrayBuffer(file);
      });
    return;
  }
  if(nombre.endsWith(".pdf")){
    evCargarLibreria("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
      function(){ return typeof window.pdfjsLib; },
      function(ok){
        if(!ok||!window.pdfjsLib){ cb(null,"No se pudo cargar el lector de PDF. Copia el texto y pégalo abajo."); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        var r=new FileReader();
        r.onload=function(){
          window.pdfjsLib.getDocument({data:r.result}).promise.then(function(pdf){
            var paginas=[], n=pdf.numPages, i=1;
            function siguiente(){
              if(i>n){ cb(paginas.join("\n"),null); return; }
              pdf.getPage(i).then(function(pg){
                return pg.getTextContent();
              }).then(function(tc){
                paginas.push(tc.items.map(function(it){return it.str;}).join(" "));
                i++; siguiente();
              }).catch(function(){ cb(null,"No se pudo leer este PDF automáticamente. Copia el texto y pégalo abajo."); });
            }
            siguiente();
          }).catch(function(){ cb(null,"No se pudo leer este PDF automáticamente. Copia el texto y pégalo abajo."); });
        };
        r.onerror=function(){ cb(null,"No se pudo leer el archivo."); };
        r.readAsArrayBuffer(file);
      });
    return;
  }
  cb(null,"Formato no reconocido. Sube un .txt, .docx o .pdf, o pega el texto directamente.");
}

/* ---- almacenamiento de las evaluaciones cargadas por el profesor ---- */
function evCargarGuardadas(){
  try{ var raw=localStorage.getItem(EV_KEY); return raw?JSON.parse(raw):[]; }catch(e){ return []; }
}
function evGuardarLista(lista){
  try{ localStorage.setItem(EV_KEY,JSON.stringify(lista)); }catch(e){}
  if(EXAMENES.ENDPOINT){
    try{ fetch(EXAMENES.ENDPOINT,{method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({tipo:"evaluaciones",actualizado:new Date().toISOString(),data:lista})}); }catch(e){}
  }
}
/* combina las evaluaciones incluidas de fábrica con las que suba el profesor;
   si una evaluación cargada coincide en grado+periodo con una de fábrica,
   la reemplaza (así también se pueden actualizar los Periodo 1 originales). */
function evActualizarExams(){
  var cargadas=evCargarGuardadas();
  var base=EXAMS_BASE.filter(function(b){
    var bMod=b.modalidad||"Evaluación final";
    return !cargadas.some(function(c){ return c.grado===b.grado && c.periodo===b.periodo && (c.modalidad||"Evaluación final")===bMod; });
  });
  EXAMS = base.concat(cargadas).map(function(e){
    var g=(typeof GRUPOS_POR_GRADO!=="undefined")&&GRUPOS_POR_GRADO[e.grado];
    return g ? Object.assign({},e,{grupos:g.slice()}) : e;
  });
  if(typeof initSelect==="function" && $("#selGrado")) initSelect();
}

var evMontaje="#profContenido"; // dónde se dibuja el formulario (dentro del Panel del profesor)

var EV_PLANTILLA = "TÍTULO: Evaluación tipo Saber — Reglas del voleibol (Grado 8.°)\n"+
"ÁREA: Educación Física, Recreación y Deportes\n"+
"TIEMPO: 30\n"+
"GRADO: 8°\n"+
"GRUPOS: 8-1, 8-2\n"+
"PERIODO: Periodo 2\n"+
"MODALIDAD: Evaluación final\n\n"+
"TEXTO 1: Origen del voleibol\n"+
"El voleibol fue inventado en 1895 por William G. Morgan en Holyoke,\n"+
"Massachusetts, como una alternativa menos física que el baloncesto.\n\n"+
"1. ¿En qué año se inventó el voleibol?\n"+
"A) 1885\nB) 1895\nC) 1905\nD) 1915\n"+
"Competencia: Literal\n\n"+
"2. ¿Quién inventó el voleibol?\n"+
"A) James Naismith\nB) William G. Morgan\nC) Alfred Halstead\nD) Pierre de Coubertin\n\n"+
"CLAVE DE RESPUESTAS:\n1. B\n2. B\n\n"+
"(La sección 'TEXTO N' es opcional: solo úsala si varias preguntas comparten\n"+
"una misma lectura. 'Competencia:' también es opcional. La clave admite\n"+
"'1. B', '1) B', '1-B' o el formato compacto '1B 2D 3A'. 'MODALIDAD:' también\n"+
"es opcional — escribe 'MODALIDAD: Quiz' si es un quiz corto del periodo y no\n"+
"la evaluación final; si no la escribes, se guarda como evaluación final.)";

function renderCargar(contenedor){
  if(contenedor) evMontaje=contenedor;
  var b=$(evMontaje); if(!b) return;
  var h='<div class="card pcard">'+
    '<div class="eyebrow">Nueva evaluación</div>'+
    '<h2 class="ptitle" style="font-size:20px;margin-bottom:6px">Cargar una evaluación tipo Saber</h2>'+
    '<p class="psub">Pega el texto de la evaluación (o sube un archivo) siguiendo el formato de la plantilla. '+
    'La página la lee, arma las preguntas y las mezcla automáticamente con las que ya existen. '+
    'La aleatorización del orden de las preguntas para cada estudiante sigue funcionando igual.</p>'+
    '<div class="ev-plantilla" id="evPlantilla">'+esc(EV_PLANTILLA)+'</div>'+
    '<div class="field"><label for="evArchivo">Subir archivo (opcional): .txt, .docx o .pdf</label>'+
    '<input id="evArchivo" type="file" accept=".txt,.docx,.pdf" onchange="evOnArchivo(this)"></div>'+
    '<div class="err" id="evArchivoErr"></div>'+
    '<div class="field"><label for="evTexto">Texto de la evaluación</label>'+
    '<textarea id="evTexto" class="ev-textarea" placeholder="Pega aquí el texto siguiendo el formato de la plantilla…"></textarea></div>'+
    '<div style="display:flex;gap:10px;margin-bottom:6px">'+
    '<button class="btn btn-primary" style="flex:1" onclick="evPrevisualizar()">Leer y previsualizar</button></div>'+
    '<div id="evResultado"></div>'+
    '</div>'+
    '<div class="eyebrow" style="margin:22px 0 4px">Evaluaciones cargadas por el profesor</div>';
  var cargadas=evCargarGuardadas();
  if(!cargadas.length){
    h+='<div class="tz-empty-org">Todavía no has cargado ninguna evaluación adicional. Las de fábrica (Periodo 1, grados 6.° a 11.°) siguen disponibles siempre.</div>';
  } else {
    cargadas.forEach(function(ex){
      h+='<div class="ev-list-item"><div><b>'+esc(ex.titulo)+'</b><div class="tz-detalle">'+esc(ex.grado)+' · '+esc(ex.periodo)+
        ' · '+esc(ex.modalidad||"Evaluación final")+' · '+ex.preguntas.length+' preguntas · Grupos: '+esc(ex.grupos.join(", "))+'</div></div>'+
        '<button class="btn-sm btn-sm-bad" onclick="evEliminar(\''+ex.id+'\')">Eliminar</button></div>';
    });
  }
  b.innerHTML=h;
}

function evOnArchivo(input){
  var file=input.files&&input.files[0]; if(!file) return;
  $("#evArchivoErr").textContent="Leyendo archivo…";
  evExtraerDeArchivo(file, function(texto, error){
    if(error){ $("#evArchivoErr").textContent=error; return; }
    $("#evArchivoErr").textContent="";
    $("#evTexto").value=texto;
  });
}

function evPrevisualizar(){
  var texto=$("#evTexto").value||"";
  var r=evParsear(texto);
  evParseado=r.ok?r:null;
  var out=$("#evResultado"), h="";
  if(!r.ok){
    h+='<div class="ev-errbox"><b>Hay '+r.errores.length+' problema(s) que corregir antes de guardar:</b><ul>'+
      r.errores.map(function(e){return '<li>'+esc(e)+'</li>';}).join("")+'</ul></div>';
  } else {
    h+='<div class="ev-okbox">Todo en orden: <b>'+r.preguntas.length+' preguntas</b> · '+r.textos.length+' texto(s) de lectura · '+
      esc(r.meta.grado)+' · '+esc(r.meta.periodo)+' · '+esc(r.meta.modalidad)+' · Grupos: '+esc(r.meta.grupos.join(", "))+'</div>'+
      '<div style="display:flex;gap:10px;margin:10px 0 16px">'+
      '<button class="btn btn-primary" style="flex:1" onclick="evGuardarEvaluacion()">Guardar esta evaluación</button></div>';
  }
  h+='<div class="eyebrow" style="margin:14px 0 6px">Vista previa</div>';
  r.preguntas.slice(0,50).forEach(function(q){
    h+='<div class="ev-qprev"><span class="n">'+q.n+'.</span>'+esc(q.enunciado||"(sin enunciado)")+
      ["A","B","C","D"].map(function(k){
        return '<span class="op'+(q.clave===k?" ok":"")+'">'+k+') '+esc(q.opciones[k]||"(falta)")+'</span>';
      }).join("")+'</div>';
  });
  out.innerHTML=h;
}

function evGuardarEvaluacion(){
  if(!evParseado||!evParseado.ok) return;
  var r=evParseado;
  var examen={
    id: "custom_"+r.meta.grado.replace(/[^0-9A-Za-z]/g,"")+"_"+r.meta.periodo.replace(/[^0-9A-Za-z]/g,"")+"_"+Date.now(),
    grado:r.meta.grado, grupos:r.meta.grupos, periodo:r.meta.periodo, titulo:r.meta.titulo, area:r.meta.area,
    modalidad:r.meta.modalidad||"Evaluación final",
    timeLimitMin:r.meta.tiempo||30, puntosPorPregunta:r.meta.puntos||1,
    textos:r.textos.map(function(t){ return { id:t.id, titulo:t.titulo, instruccion:"", cuerpo:t.cuerpo }; }),
    preguntas:r.preguntas.map(function(q){ return { n:q.n, seccion:q.seccion, competencia:q.competencia, enunciado:q.enunciado, opciones:q.opciones, clave:q.clave }; })
  };
  var lista=evCargarGuardadas();
  lista=lista.filter(function(e){ return !(e.grado===examen.grado && e.periodo===examen.periodo && (e.modalidad||"Evaluación final")===examen.modalidad); });
  lista.push(examen);
  evGuardarLista(lista);
  evActualizarExams();
  evParseado=null;
  $("#evTexto").value=""; $("#evResultado").innerHTML="";
  renderCargar();
}
function evEliminar(id){
  if(!confirm("¿Eliminar esta evaluación cargada? Los estudiantes ya no podrán presentarla.")) return;
  var lista=evCargarGuardadas().filter(function(e){ return e.id!==id; });
  evGuardarLista(lista);
  evActualizarExams();
  renderCargar();
}

/* ====== STATE ====== */
var sel={grado:null,grupo:null,periodo:null}, exam=null, seq=[], idx=0, answers=[], student={nombre:"",documento:""};
var secondsLeft=0, timerId=null, startedAt=null, submitted=false;
var SCREENS=["inicio","home","select","identify","instructions","exam","results","recursos","herramientas","retos","juego","resultados","torneos","diario","profesor","autoeval"];
var RUTAS={inicio:"inicio",evaluaciones:"home",recursos:"recursos",herramientas:"herramientas",retos:"retos",juego:"juego",resultados:"resultados",torneos:"torneos",diario:"diario",profesor:"profesor",autoeval:"autoeval"};
var $=function(s){return document.querySelector(s)};
function el(t,c){var e=document.createElement(t);if(c)e.className=c;return e}
function go(name){SCREENS.forEach(function(s){$("#s_"+s).classList.toggle("hidden",s!==name)});window.scrollTo(0,0)}

/* ====== SELECT ====== */
function uniq(a){return a.filter(function(v,i){return a.indexOf(v)===i})}
var QUIZ_MODE=false;  // true = navegando la lista de quices, no las evaluaciones finales
function examsDisponibles(){
  var modalidadObjetivo=QUIZ_MODE?"Quiz":"Evaluación final";
  return EXAMS.filter(function(e){ return (e.modalidad||"Evaluación final")===modalidadObjetivo; });
}
function initSelect(){
  var pool=examsDisponibles();
  var t=$("#selTitulo"); if(t) t.textContent=QUIZ_MODE?"Encuentra tu quiz":"Encuentra tu evaluación";
  var grados=uniq(pool.map(function(e){return e.grado}));
  var g=$("#selGrado");
  if(!grados.length){
    g.innerHTML='<option value="">Ninguno disponible todavía</option>';
    $("#examPreview").innerHTML='<p class="tz-detalle">'+(QUIZ_MODE?"Todavía no hay quices cargados.":"Todavía no hay evaluaciones cargadas.")+'</p>';
    return;
  }
  g.innerHTML='<option value="">Selecciona…</option>'+grados.map(function(x){return '<option>'+x+'</option>'}).join("");
  g.onchange=function(){ sel.grado=g.value; fillGrupos(); };
  $("#selGrupo").onchange=function(){ sel.grupo=$("#selGrupo").value; resolveExam(); };
  $("#selPeriodo").onchange=function(){ sel.periodo=$("#selPeriodo").value; resolveExam(); };
}
function fillGrupos(){
  var ex=examsDisponibles().filter(function(e){return e.grado===sel.grado});
  var grupos=uniq([].concat.apply([],ex.map(function(e){return e.grupos})));
  var periodos=["Periodo 1","Periodo 2","Periodo 3"];  // la JMRP maneja 3 periodos
  var gg=$("#selGrupo"); gg.innerHTML='<option value="">Selecciona…</option>'+grupos.map(function(x){return '<option>'+x+'</option>'}).join("");
  var pp=$("#selPeriodo"); pp.innerHTML='<option value="">Selecciona…</option>'+periodos.map(function(x){return '<option>'+x+'</option>'}).join("");
  sel.grupo=null; sel.periodo=null; resolveExam();
}
function resolveExam(){
  exam=null;
  if(sel.grado&&sel.grupo&&sel.periodo){
    exam=examsDisponibles().find(function(e){return e.grado===sel.grado&&e.grupos.indexOf(sel.grupo)>=0&&e.periodo===sel.periodo})||null;
  }
  var pv=$("#examPreview");
  if(exam){
    pv.innerHTML='<div class="examcard"><div class="t">'+exam.titulo+'</div><div class="meta">'+
      '<span class="pill">'+exam.area+'</span><span class="pill">'+exam.grado+'</span>'+
      '<span class="pill">'+exam.preguntas.length+' preguntas</span><span class="pill">'+exam.timeLimitMin+' minutos</span></div></div>';
  } else { pv.innerHTML = (sel.grado&&sel.grupo&&sel.periodo)?'<div class="examcard"><div class="t">Sin evaluación disponible para este periodo</div><div class="meta"><span class="pill">Próximamente</span></div></div>':''; }
  $("#toIdentify").disabled=!exam;
}

/* ====== IDENTIFY ====== */
function initIdentify(){
  var n=$("#fName"),d=$("#fDoc"),a=$("#fAuth"),btn=$("#toInstr");
  function val(){
    var okN=n.value.trim().length>=5, okD=/^[0-9]{5,15}$/.test(d.value.trim());
    $("#errName").textContent = n.value&&!okN?"Escribe tu nombre completo.":"";
    $("#errDoc").textContent = d.value&&!okD?"El documento debe tener solo números (5 a 15 dígitos).":"";
    btn.disabled=!(okN&&okD&&a.checked);
  }
  [n,d].forEach(function(x){x.addEventListener("input",val)}); a.addEventListener("change",val);
}

/* ====== INSTRUCTIONS ====== */
function fillInstructions(){
  student.nombre=$("#fName").value.trim(); student.documento=$("#fDoc").value.trim();
  $("#instrTitle").textContent=exam.titulo;
  $("#instrSub").textContent=exam.grado+" · "+(sel.grupo)+" · "+exam.periodo;
  $("#instrN").textContent=exam.preguntas.length; $("#instrT").textContent=exam.timeLimitMin;
}

/* ====== EXAM ====== */
function shuffle(a){ for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }
function buildSequence(){
  // Mismas preguntas para todos, pero en orden distinto por estudiante.
  // Se conserva la sección (para que cada pregunta siga junto a su texto) y se
  // aleatoriza el orden de las preguntas dentro de cada sección.
  var bySec={}, order=[];
  exam.preguntas.forEach(function(q){ if(!bySec[q.seccion]){bySec[q.seccion]=[];order.push(q.seccion);} bySec[q.seccion].push(q); });
  var out=[]; order.forEach(function(s){ out=out.concat(shuffle(bySec[s].slice())); });
  return out;
}
function startExam(){
  if(CONFIG.ENDPOINT){
    checkEligibility(function(presentado,cerrada){
      if(cerrada){ showModal("Evaluación cerrada","Esta evaluación todavía no está abierta o ya se cerró. Consulta con tu docente.","Entendido",function(){go("home")}); }
      else if(presentado){ showModal("Ya presentaste esta evaluación","Con el documento <b>"+student.documento+"</b> ya registraste un intento de esta evaluación. No puedes repetirla.","Entendido",function(){go("home")}); }
      else beginExam();
    });
  } else beginExam();
}
function checkEligibility(cb){
  var name="__cb"+Date.now(), s, done=false;
  var to=setTimeout(function(){ cleanup(); cb(false); }, 6000); // si no responde, se permite continuar
  function cleanup(){ if(done)return; done=true; try{delete window[name];}catch(e){window[name]=undefined;} if(s&&s.parentNode)s.parentNode.removeChild(s); clearTimeout(to); }
  window[name]=function(j){ cleanup(); cb(!!(j&&j.presentado), !!(j&&j.abierta===false)); };
  s=document.createElement("script");
  s.src=CONFIG.ENDPOINT+(CONFIG.ENDPOINT.indexOf("?")>=0?"&":"?")+"check=1&callback="+name+"&documento="+encodeURIComponent(student.documento)+"&examId="+encodeURIComponent(exam.id);
  s.onerror=function(){ cleanup(); cb(false); };
  document.body.appendChild(s);
}
function beginExam(){
  seq=buildSequence();
  answers=new Array(seq.length).fill(null); idx=0;
  secondsLeft=exam.timeLimitMin*60; submitted=false;
  $("#qTotal").textContent=seq.length; $("#totCount").textContent=seq.length;
  buildNav(); render(); go("exam");
  startedAt=Date.now(); timerId=setInterval(tick,1000); updTimer();
}
function tick(){ secondsLeft--; if(secondsLeft<=0){secondsLeft=0;updTimer();finalize(true);return;} updTimer(); }
function fmt(s){var m=Math.floor(s/60),r=s%60;return m+":"+String(r).padStart(2,"0")}
function updTimer(){ $("#timeText").textContent=fmt(secondsLeft); var t=$("#timer");
  t.classList.toggle("warn",secondsLeft<=300&&secondsLeft>60); t.classList.toggle("danger",secondsLeft<=60); }
function render(){
  var q=seq[idx], rd=$("#reading"); rd.innerHTML="";
  var tids = q.textoIds || [q.seccion];
  tids.forEach(function(tid){ var t=exam.textos.find(function(x){return x.id===tid}); if(!t)return;
    var b=el("div","rblock");
    b.innerHTML='<div class="rlabel">Texto '+t.id+'</div><h2>'+t.titulo+'</h2><div class="rinstr">Lee el texto con atención para responder.</div><p class="body">'+t.cuerpo+'</p>';
    rd.appendChild(b); });
  rd.scrollTop=0;
  $("#qNow").textContent=idx+1;
  $("#qStem").textContent=(idx+1)+". "+q.enunciado;
  var opts=$("#options"); opts.innerHTML="";
  ["A","B","C","D"].forEach(function(k){ if(q.opciones[k]==null)return;
    var o=el("div","opt"); o.dataset.k=k; if(answers[idx]===k)o.classList.add("sel");
    o.innerHTML='<div class="k">'+k+'</div><div class="t">'+q.opciones[k]+'</div>';
    o.addEventListener("click",function(){choose(k)}); opts.appendChild(o); });
  $("#prevBtn").disabled=idx===0;
  $("#nextBtn").textContent=(idx===seq.length-1)?"Ir al final →":"Siguiente →";
  $("#progressBar").style.width=((idx+1)/seq.length*100)+"%";
  refreshNav();
}
function choose(k){ answers[idx]=k; document.querySelectorAll(".opt").forEach(function(o){o.classList.toggle("sel",o.dataset.k===k)}); refreshNav(); }
function refreshNav(){ $("#answeredCount").textContent=answers.filter(function(a){return a!==null}).length;
  document.querySelectorAll(".gbtn").forEach(function(b,i){b.classList.toggle("answered",answers[i]!==null);b.classList.toggle("current",i===idx)}); }
function buildNav(){ var g=$("#navGrid"); g.innerHTML="";
  seq.forEach(function(_,i){var b=el("button","gbtn");b.textContent=i+1;b.addEventListener("click",function(){idx=i;render()});g.appendChild(b)}); }
$("#prevBtn").addEventListener("click",function(){if(idx>0){idx--;render()}});
$("#nextBtn").addEventListener("click",function(){ if(idx<seq.length-1){idx++;render()} else confirmFinish(); });
$("#finishBtn").addEventListener("click",confirmFinish);
function confirmFinish(){ var pend=seq.length-answers.filter(function(a){return a!==null}).length;
  showModal("¿Finalizar la evaluación?", pend>0?("Tienes <b>"+pend+"</b> sin responder. No podrás volver."):"Respondiste todas. No podrás volver.","Sí, finalizar",function(){finalize(false)}); }
function showModal(title,html,ok,onOk){ var ov=el("div","overlay");
  ov.innerHTML='<div class="modal"><h3>'+title+'</h3><p>'+html+'</p><div class="mbtns"><button class="btn-ghost" id="mc">Seguir</button><button class="btn-gold" id="mo">'+ok+'</button></div></div>';
  document.body.appendChild(ov); ov.querySelector("#mc").onclick=function(){ov.remove()}; ov.querySelector("#mo").onclick=function(){ov.remove();onOk()}; }

/* ====== GRADING (por porcentaje; sirve para 20 o 25 preguntas) ====== */
function grade(a,total){ var p=total?a/total:0, nota, nivel;
  if(p<0.52){nota=1.0+(p/0.52)*1.9;nivel="Nivel Bajo";}
  else if(p<0.68){nota=3.0+((p-0.52)/0.16)*0.9;nivel="Nivel Básico";}
  else if(p<0.84){nota=4.0+((p-0.68)/0.16)*0.5;nivel="Nivel Alto";}
  else{nota=4.6+((p-0.84)/0.16)*0.4;nivel="Nivel Superior";}
  return {nota:Math.round(nota*10)/10, notaExacta:Math.round(nota*100000)/100000, nivel:nivel, puntaje100:Math.round(p*100)};
}
var lastResult=null, ansByN={}, lastPayload=null, lastAuto=false, lastUsed=0;
/* Las evaluaciones incluidas en la página ya no traen la clave de
   respuestas: se envían al Apps Script, que califica y devuelve la nota.
   Solo las evaluaciones cargadas desde el Panel del profesor (que sí
   traen clave) se siguen calificando en el navegador. */
function finalize(auto){
  if(submitted)return; submitted=true; clearInterval(timerId);
  var tieneClaveLocal=exam.preguntas.some(function(q){ return !!q.clave; });
  if(!tieneClaveLocal && CONFIG.ENDPOINT){ finalizeServidor(auto); return; }
  finalizeLocal(auto);
}
function finalizeServidor(auto){
  var used=exam.timeLimitMin*60-secondsLeft;
  ansByN={};
  seq.forEach(function(q,i){ ansByN[q.n]=answers[i]; });
  lastAuto=auto; lastUsed=used;
  lastPayload={ tipo:"calificar", timestamp:new Date().toISOString(), grado:exam.grado, grupo:sel.grupo,
    periodo:exam.periodo, examId:exam.id, nombre:student.nombre, documento:student.documento,
    modalidad:exam.modalidad||"Evaluación final", tiempoSeg:used,
    respuestas:exam.preguntas.slice().sort(function(a,b){return a.n-b.n;}).map(function(q){
      return { n:q.n, elegida:ansByN[q.n]||null, competencia:q.competencia }; }) };
  lastResult=null;
  go("results");
  $("#resName").textContent=student.nombre;
  $("#resMeta").textContent="Doc. "+student.documento+" · "+exam.grado+" · "+sel.grupo+" · "+exam.periodo+(auto?" · (tiempo agotado)":"");
  $("#notaVal").textContent="…"; $("#nivelBadge").textContent="Calificando";
  $("#stAciertos").textContent="—"; $("#stPuntaje").textContent="—"; $("#stTiempo").textContent=fmt(used);
  $("#comps").innerHTML=""; $("#review").innerHTML="";
  enviarParaCalificar();
}
function enviarParaCalificar(){
  var note=$("#sendNote");
  note.innerHTML='<span style="color:var(--muted)">Enviando y calificando tus respuestas…</span>';
  fetch(CONFIG.ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(lastPayload)})
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(!j||!j.ok) throw new Error((j&&j.error)||"Respuesta no válida del servidor.");
      mostrarResultadoServidor(j);
    })
    .catch(function(err){
      note.innerHTML='<span style="color:var(--bad)">No se pudo calificar ('+esc(String(err.message||err))+'). Tus respuestas siguen guardadas en esta pantalla: no la cierres.</span> '+
        '<button class="btn-ghost" style="margin-top:8px" onclick="enviarParaCalificar()">Reintentar</button>';
    });
}
function mostrarResultadoServidor(j){
  var comp={};
  Object.keys(j.porCompetencia||{}).forEach(function(k){
    var partes=String(j.porCompetencia[k]).split("/");
    comp[k]={ ok:parseInt(partes[0],10)||0, tot:parseInt(partes[1],10)||0 };
  });
  var g={ nota:j.nota, notaExacta:j.notaExacta, nivel:j.nivel, puntaje100:j.puntaje100 };
  var p=lastPayload;
  lastResult={ timestamp:p.timestamp, grado:p.grado, grupo:p.grupo, periodo:p.periodo, examId:p.examId,
    nombre:p.nombre, documento:p.documento, modalidad:p.modalidad, aciertos:j.aciertos, total:j.total,
    puntaje100:j.puntaje100, nota:j.nota, notaExacta:j.notaExacta, nivel:j.nivel, tiempoSeg:p.tiempoSeg,
    porCompetencia:j.porCompetencia, respuestas:j.revision||p.respuestas };
  var claveDe=null;
  if(j.revision){ claveDe={}; j.revision.forEach(function(r){ claveDe[r.n]=r.correcta; }); }
  showResults(g,j.aciertos,j.total,lastUsed,comp,lastAuto,claveDe);
  $("#sendNote").innerHTML=j.duplicado
    ? '<span style="color:var(--muted)">Ya tenías un intento registrado en esta evaluación; se muestra ese resultado.</span>'
    : '<span style="color:var(--green-d)">✓ Respuestas registradas en la institución.</span>';
}
function finalizeLocal(auto){
  var used=exam.timeLimitMin*60-secondsLeft, total=seq.length, correct=0;
  ansByN={};
  seq.forEach(function(q,i){ ansByN[q.n]=answers[i]; });
  var comp={}, respuestas=[];
  var ordenadas=exam.preguntas.slice().sort(function(a,b){return a.n-b.n;});
  ordenadas.forEach(function(q){ var ch=ansByN[q.n]||null, ok=ch===q.clave; if(ok)correct++;
    var cat=(q.competencia||"General").split("/")[0].trim(); comp[cat]=comp[cat]||{ok:0,tot:0}; comp[cat].tot++; if(ok)comp[cat].ok++;
    respuestas.push({n:q.n,elegida:ch,correcta:q.clave,ok:ok,competencia:q.competencia}); });
  var g=grade(correct,total);
  lastResult={ timestamp:new Date().toISOString(), grado:exam.grado, grupo:sel.grupo, periodo:exam.periodo,
    examId:exam.id, nombre:student.nombre, documento:student.documento, modalidad:exam.modalidad||"Evaluación final",
    aciertos:correct, total:total, puntaje100:g.puntaje100, nota:g.nota, notaExacta:g.notaExacta, nivel:g.nivel, tiempoSeg:used,
    porCompetencia:Object.keys(comp).reduce(function(o,k){o[k]=comp[k].ok+"/"+comp[k].tot;return o},{}), respuestas:respuestas };
  var claveLocal={}; exam.preguntas.forEach(function(q){ claveLocal[q.n]=q.clave; });
  showResults(g,correct,total,used,comp,auto,claveLocal); sendResult(lastResult);
}
function showResults(g,correct,total,used,comp,auto,claveDe){
  go("results");
  $("#resName").textContent=student.nombre;
  $("#resMeta").textContent="Doc. "+student.documento+" · "+exam.grado+" · "+sel.grupo+" · "+exam.periodo+(auto?" · (tiempo agotado)":"");
  $("#notaVal").textContent=g.nota.toFixed(1);
  $("#medal").style.setProperty("--pct",g.puntaje100+"%");
  $("#stAciertos").textContent=correct+"/"+total; $("#stPuntaje").textContent=g.puntaje100; $("#stTiempo").textContent=fmt(used);
  var b=$("#nivelBadge"); b.textContent=g.nivel;
  var col={"Nivel Superior":["#e5f0e6","#204E2A"],"Nivel Alto":["#e3eef4","#2C6485"],"Nivel Básico":["#f6ecd4","#8a6410"],"Nivel Bajo":["#f3e2da","#8a3a1c"]}[g.nivel];
  b.style.background=col[0]; b.style.color=col[1];
  var cw=$("#comps"); cw.innerHTML="";
  Object.keys(comp).forEach(function(k){var pc=Math.round(comp[k].ok/comp[k].tot*100);var c=el("div","comp");
    c.innerHTML='<div class="top"><span>'+k+'</span><span>'+comp[k].ok+'/'+comp[k].tot+'</span></div><div class="track"><div class="fill" style="width:'+pc+'%"></div></div>';cw.appendChild(c)});
  var rw=$("#review"); rw.innerHTML="";
  if(!claveDe){ rw.innerHTML='<div class="aviso">La revisión pregunta por pregunta estará disponible cuando tu docente la habilite.</div>'; return; }
  exam.preguntas.slice().sort(function(a,b){return a.n-b.n;}).forEach(function(q){var ch=ansByN[q.n]||null,cl=claveDe[q.n],ok=ch===cl;var r=el("div","rev "+(ok?"ok":"wrong"));
    var ans=ch===null?'<div class="ans">Sin responder · Correcta: <span class="good">'+cl+". "+q.opciones[cl]+'</span></div>'
      :ok?'<div class="ans">Tu respuesta: <b>'+ch+". "+q.opciones[ch]+'</b></div>'
      :'<div class="ans">Tu respuesta: <b>'+ch+". "+q.opciones[ch]+'</b><br>Correcta: <span class="good">'+cl+". "+q.opciones[cl]+'</span></div>';
    r.innerHTML='<div class="rtop"><span class="rnum">Pregunta '+q.n+'</span><span class="rtag">'+(q.competencia||"")+'</span><span class="rres">'+(ch===null?"—":(ok?"✓ Correcta":"✗ Incorrecta"))+'</span></div><div class="rq">'+q.enunciado+'</div>'+ans;
    rw.appendChild(r)});
}
/* ====== ENVÍO + COMPROBANTE ====== */
function sendResult(p){
  var note=$("#sendNote");
  if(CONFIG.ENDPOINT){
    note.innerHTML='<span style="color:var(--muted)">Enviando respuestas…</span>';
    fetch(CONFIG.ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(p)})
      .then(function(){ note.innerHTML='<span style="color:var(--green-d)">✓ Respuestas enviadas a la institución.</span>'; })
      .catch(function(){ note.innerHTML='<span style="color:var(--bad)">No se pudo enviar. Descarga tu comprobante y entrégalo a tu docente.</span>'; });
  } else { note.innerHTML='<span style="color:var(--muted)">Descarga tu comprobante y entrégalo a tu docente.</span>'; }
}
function csvCell(v){v=String(v==null?"":v);return '"'+v.replace(/"/g,'""')+'"'}
$("#dlBtn").addEventListener("click",function(){ if(!lastResult)return; var p=lastResult;
  var rows=[["Marca temporal","Grado","Grupo","Periodo","Nombre","Documento","Aciertos","Total","Puntaje/100","Nota","Nivel","TiempoSeg"],
    [p.timestamp,p.grado,p.grupo,p.periodo,p.nombre,p.documento,p.aciertos,p.total,p.puntaje100,p.nota,p.nivel,p.tiempoSeg],[],
    ["Pregunta","Elegida","Correcta","Acierto","Competencia"]];
  p.respuestas.forEach(function(r){rows.push([r.n,r.elegida,r.correcta||"",r.correcta?(r.ok?"SI":"NO"):"",r.competencia])});
  var csv="\ufeff"+rows.map(function(r){return r.map(csvCell).join(",")}).join("\n");
  var blob=new Blob([csv],{type:"text/csv;charset=utf-8"}), a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="comprobante_"+p.documento+"_"+p.grado.replace(/\D/g,"")+".csv"; a.click();
});
window.addEventListener("beforeunload",function(e){ if(startedAt&&!submitted){e.preventDefault();e.returnValue=""} });

/* ====== ESCUDO (una sola copia, se aplica a todas las pantallas) ====== */
var CREST="img/escudo.jpg";
function initCrest(){
  document.querySelectorAll("[data-crest]").forEach(function(i){ i.src=CREST; });
  var l=document.createElement("link"); l.rel="icon"; l.href=CREST; document.head.appendChild(l);
}

/* ====== NAVEGACIÓN ENTRE ESPACIOS ====== */
function enExamen(){ return !!(startedAt && !submitted); }
var _sup=false;
function irA(r){ if(location.hash==="#"+r) route(); else location.hash="#"+r; }
function volverAlPortal(){ location.hash="#inicio"; location.reload(); }
function route(){
  if(_sup){ _sup=false; return; }
  var h=(location.hash||"").replace(/^#/,"").toLowerCase();
  if(!RUTAS[h]) h="inicio";
  if(enExamen()){                       // nadie sale a media evaluación
    if(location.hash!=="#evaluaciones"){ _sup=true; location.hash="#evaluaciones"; }
    return;
  }
  if(h==="recursos") renderRecursos();
  if(h==="herramientas") renderHerramientas();
  if(h==="retos")    renderRetos();
  if(h==="juego"){
    $("#tabJuego1").classList.toggle("on",J_ACTIVO==="correr");
    $("#tabJuego2").classList.toggle("on",J_ACTIVO==="atrapa");
    $("#juego1Wrap").classList.toggle("hidden",J_ACTIVO!=="correr");
    $("#juego2Wrap").classList.toggle("hidden",J_ACTIVO!=="atrapa");
    if(J_ACTIVO==="correr"){ renderJuego(); jgSincronizar(); }
    else { renderAtrapa(); eaSincronizar(); }
  } else { jgDetener(); eaDetener(); }
  if(h==="resultados") renderResultados();
  if(h==="torneos")  { renderTorneos(); tzSincronizar(); }
  if(h==="diario")   renderDiario();
  if(h==="profesor") renderProfesor();
  if(h==="autoeval") renderAutoeval();
  if(h==="inicio")   renderMenu();
  go(RUTAS[h]);
}
window.addEventListener("hashchange",route);

/* ====== ÍCONOS ====== */
var SVG='stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"';
var ICONOS={
 evaluaciones:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 14l2 2 4-4"/></svg>',
 recursos:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3z"/><path d="M21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z"/></svg>',
 herramientas:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><path d="M14.7 6.3a4 4 0 01-5.4 5.4L4 17l1 1 5.3-5.3a4 4 0 015.4-5.4l-2.3 2.3 1 1z"/><circle cx="18.5" cy="5.5" r="1.5"/></svg>',
 retos:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><circle cx="12" cy="13" r="7"/><path d="M12 13V9"/><path d="M9.5 2h5"/></svg>',
 juego:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><circle cx="6" cy="6" r="3"/><path d="M6 9v5l4 3M6 14l-3 6M13 21l3-8 4 2 2-6"/></svg>',
 resultados:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><path d="M4 19V10"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M20 19H4"/></svg>',
 torneos:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3"/><path d="M10 20h4M12 14v6"/></svg>',
 diario:'<svg width="21" height="21" viewBox="0 0 24 24" '+SVG+'><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 15h3l1.5-2 2 4L15 15h2"/></svg>',
 obra:'<svg width="24" height="24" viewBox="0 0 24 24" '+SVG+'><path d="M9.5 4.5l-5 5 3 3 5-5z"/><path d="M11 11l7.5 7.5a2 2 0 01-3 3L8 14"/><path d="M14.5 4.5l5 5"/></svg>'
};

/* ====== MENÚ DE INICIO ====== */
function renderMenu(){
  var m=$("#menuInicio"); m.innerHTML=""; var ocultas=[];
  var claves=Object.keys(SECCIONES).sort(function(a,b){ return (SECCIONES[a].orden||99)-(SECCIONES[b].orden||99); });
  claves.forEach(function(k){
    var s=SECCIONES[k];
    if(!s.visible){ ocultas.push(s.titulo); return; }
    var b=el("button","mcard"); b.type="button";
    b.innerHTML='<div class="ico">'+(ICONOS[k]||"")+'</div><div class="mt2">'+esc(s.titulo)+'</div><div class="md">'+esc(s.desc)+'</div>';
    b.addEventListener("click",function(){ irA(k); });
    m.appendChild(b);
  });
  var p=$("#proximamente");
  if(ocultas.length){ p.classList.remove("hidden"); p.innerHTML='<b>Próximamente</b>'+ocultas.join(" · "); }
  else p.classList.add("hidden");
  pintarFootLinks(claves);
}
function pintarFootLinks(claves){
  var fl=$("#footLinks"); if(!fl) return;
  var visibles=claves.filter(function(k){ return SECCIONES[k].visible; });
  fl.innerHTML=visibles.map(function(k,i){
    return (i>0?'<span class="sep">·</span>':"")+'<button type="button" onclick="irA(\''+k+'\')">'+esc(SECCIONES[k].titulo)+'</button>';
  }).join("");
}

/* ====== UTILIDADES DE LAS SECCIONES ====== */
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function construccion(k){
  return '<div class="empty"><div class="eico">'+ICONOS.obra+'</div>'+
         '<h3>Esta página está en construcción</h3>'+
         '<p>Pronto encontrarás aquí '+esc(SECCIONES[k].promesa)+'</p></div>';
}
function borrador(k){ return SECCIONES[k].visible?'':'<div class="draft">Borrador · aún no aparece en el menú</div>'; }
function enlace(u){ return u?'<a class="link" href="'+esc(u)+'" target="_blank" rel="noopener">Abrir →</a>':''; }
function pill(t){ return t?'<span class="pill">'+esc(t)+'</span>':''; }

/* ====== RECURSOS ====== */
function renderRecursos(){
  var b=$("#body_recursos"), h=borrador("recursos");
  if(!RECURSOS.length){
    b.innerHTML=h+construccion("recursos");
    return;
  }
  var grados=[];
  RECURSOS.forEach(function(r){ var g=r.grado||"Para todos los grados"; if(grados.indexOf(g)<0) grados.push(g); });
  grados.forEach(function(g){
    var items=RECURSOS.filter(function(r){ return (r.grado||"Para todos los grados")===g; });
    h+='<div class="gsec"><div class="gt"><span>'+esc(g)+'</span></div><div class="rgrid">'+
      items.map(function(r){
        return '<div class="item">'+pill(r.tipo||"Recurso")+
               '<div class="it">'+esc(r.titulo)+'</div>'+
               (r.descripcion?'<div class="idesc">'+esc(r.descripcion)+'</div>':'')+
               enlace(r.url)+'</div>';
      }).join("")+'</div></div>';
  });
  b.innerHTML=h;
}

/* ====== HERRAMIENTAS ====== */
var ORDEN_TIPO_HERRAMIENTA=["Reglamento","Video","Lectura"];
function renderHerramientas(){
  var b=$("#body_herramientas"), h=borrador("herramientas");
  if(!HERRAMIENTAS.length){
    b.innerHTML=h+construccion("herramientas");
    return;
  }
  var tipos=ORDEN_TIPO_HERRAMIENTA.filter(function(t){
    return HERRAMIENTAS.some(function(r){ return (r.tipo||"Recurso")===t; });
  });
  HERRAMIENTAS.forEach(function(r){ var t=r.tipo||"Recurso"; if(tipos.indexOf(t)<0) tipos.push(t); });
  tipos.forEach(function(t){
    var items=HERRAMIENTAS.filter(function(r){ return (r.tipo||"Recurso")===t; });
    h+='<div class="gsec"><div class="gt"><span>'+esc(t)+'</span></div><div class="rgrid">'+
      items.map(function(r){
        return '<div class="item">'+pill(r.tipo||"Recurso")+
               '<div class="it">'+esc(r.titulo)+'</div>'+
               (r.descripcion?'<div class="idesc">'+esc(r.descripcion)+'</div>':'')+
               enlace(r.url)+'</div>';
      }).join("")+'</div></div>';
  });
  b.innerHTML=h;
}

/* ====== RETOS: selector de grado y periodo ====== */
var RETO_SEL={grado:null,periodo:1};

function todosLosGrados(){
  var out=[]; NIVELES.forEach(function(n){ n.grados.forEach(function(g){ out.push(g); }); }); return out;
}
function nivelDeGrado(g){
  for(var i=0;i<NIVELES.length;i++){ if(NIVELES[i].grados.indexOf(g)>=0) return NIVELES[i]; }
  return null;
}
function periodoPorId(id){
  for(var i=0;i<PERIODOS.length;i++){ if(PERIODOS[i].id===id) return PERIODOS[i]; }
  return PERIODOS[0];
}
function retosDe(grado,periodo){
  var n=nivelDeGrado(grado); if(!n) return [];
  return RETOS.filter(function(r){ return r.nivel===n.id && r.periodo===periodo; })
              .sort(function(a,b){ return a.semana-b.semana; });
}

function renderRetos(){
  var b=$("#body_retos");
  if(!RETOS.length){ b.innerHTML=borrador("retos")+construccion("retos"); return; }
  b.innerHTML=borrador("retos")+
    '<div class="picker">'+
      '<div class="field" style="margin:0"><label for="retoGrado">Elige tu grado</label>'+
      '<select id="retoGrado"><option value="">Selecciona…</option>'+
      todosLosGrados().map(function(g){ return '<option'+(RETO_SEL.grado===g?' selected':'')+'>'+esc(g)+'</option>'; }).join("")+
      '</select></div>'+
    '</div>'+
    '<div class="tabs" id="retoTabs"></div>'+
    '<div id="retoLista"></div>';
  $("#retoGrado").onchange=function(){ RETO_SEL.grado=this.value||null; pintarRetos(); };
  pintarRetos();
}

function pintarRetos(){
  var tabs=$("#retoTabs"), lista=$("#retoLista");
  tabs.innerHTML=PERIODOS.map(function(p){
    return '<button class="tab'+(p.id===RETO_SEL.periodo?' on':'')+'" data-p="'+p.id+'">'+
           esc(p.nombre)+'<small>'+esc(p.tema)+'</small></button>';
  }).join("");
  tabs.querySelectorAll(".tab").forEach(function(t){
    t.addEventListener("click",function(){ RETO_SEL.periodo=parseInt(t.dataset.p,10); pintarRetos(); });
  });

  var p=periodoPorId(RETO_SEL.periodo);
  var h='<p class="temadesc">'+esc(p.desc)+'</p>';

  if(!RETO_SEL.grado){
    lista.innerHTML=h+'<div class="empty"><div class="eico">'+ICONOS.retos+'</div>'+
      '<h3>Elige tu grado para ver tus retos</h3>'+
      '<p>Cada grado tiene su propia ruta. Los papás y las mamás también: busca “Papás y mamás activos” en la lista.</p></div>';
    return;
  }
  var n=nivelDeGrado(RETO_SEL.grado), rr=retosDe(RETO_SEL.grado,RETO_SEL.periodo);
  h+='<div class="aviso" style="margin-bottom:18px"><b>'+esc(n.nombre)+'.</b> '+esc(n.nota)+'</div>';
  if(!rr.length){
    lista.innerHTML=h+'<div class="empty"><div class="eico">'+ICONOS.obra+'</div>'+
      '<h3>Todavía no hay retos para este periodo</h3><p>Pronto encontrarás aquí la ruta completa de tu grado.</p></div>';
    return;
  }
  h+='<div class="retos">'+rr.map(function(r){
    return '<article class="reto">'+
      '<div class="rhead"><span class="rsem">Semana '+r.semana+'</span></div>'+
      '<h3 class="rtit">'+esc(r.titulo)+'</h3>'+
      '<p class="robj">'+esc(r.objetivo)+'</p>'+
      '<ol class="steps">'+r.pasos.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ol>'+
      '<div class="revi"><b>Tu evidencia:</b> '+esc(r.evidencia)+'</div>'+
      retoEvidenciaBloque(RETO_SEL.grado,RETO_SEL.periodo,r)+
    '</article>';
  }).join("")+'</div>';
  lista.innerHTML=h;
  rr.forEach(function(r){ retoEvidenciaWire(RETO_SEL.grado,RETO_SEL.periodo,r); });
}

/* ====== EVIDENCIA DE UN RETO (integrada en cada tarjeta, sin pantalla aparte) ====== */
function retoEvidenciaBloque(grado,periodoId,r){
  var rid="ev_"+periodoId+"_s"+r.semana;
  if(!EVIDENCIAS.ENDPOINT){
    return '<div class="aviso" style="margin-top:12px">Todavía no está conectado el envío de evidencias. Muéstrale este reto hecho a tu profesor.</div>';
  }
  return '<div class="evwrap" id="'+rid+'">'+
    '<button type="button" class="btn-ghost" style="width:100%;margin-top:10px" data-evtoggle="'+rid+'">Subir evidencia de este reto</button>'+
    '<div class="evform hidden" id="'+rid+'_form">'+
      '<div class="row2">'+
        '<div class="field"><label for="'+rid+'_nombre">Nombre completo</label><input id="'+rid+'_nombre" type="text" placeholder="Nombres y apellidos" autocomplete="off"></div>'+
        '<div class="field"><label for="'+rid+'_grupo">Grupo</label><input id="'+rid+'_grupo" type="text" placeholder="Ej.: '+esc(grado.replace('.°',''))+'-2" autocomplete="off"></div>'+
      '</div>'+
      '<div class="field"><label for="'+rid+'_doc">Documento <span style="text-transform:none;font-weight:400">(los acudientes pueden dejarlo vacío)</span></label><input id="'+rid+'_doc" type="text" inputmode="numeric" autocomplete="off"></div>'+
      '<div class="field"><label>Tu evidencia</label>'+
        '<div class="segs"><button type="button" class="seg on" data-t="foto">Subir una foto</button>'+
        '<button type="button" class="seg" data-t="enlace">Pegar un enlace</button></div></div>'+
      '<div class="field" id="'+rid+'_wrapFoto"><input id="'+rid+'_foto" type="file" accept="image/*"><div class="hint" id="'+rid+'_fotoHint">La foto se reduce sola antes de enviarse.</div></div>'+
      '<div class="field hidden" id="'+rid+'_wrapEnlace"><input id="'+rid+'_enlace" type="text" placeholder="https://… (video en Drive o YouTube)" autocomplete="off">'+
        '<div class="hint">Para videos, súbelos a Drive o YouTube y pega aquí el enlace con permiso de lectura.</div></div>'+
      '<div class="field"><label for="'+rid+'_com">Comentario <span style="text-transform:none;font-weight:400">(opcional)</span></label><input id="'+rid+'_com" type="text" placeholder="¿Cómo te fue?" autocomplete="off"></div>'+
      '<label class="check"><input type="checkbox" id="'+rid+'_auth"><span>Autorizo el uso de esta evidencia con fines académicos del área. Si aparece un menor de edad, declaro que su acudiente conoce y autoriza este registro.</span></label>'+
      '<div class="err" id="'+rid+'_err"></div>'+
      '<button class="btn btn-primary" style="width:100%" id="'+rid+'_send">Enviar mi evidencia</button>'+
    '</div>'+
    '<div class="evok hidden" id="'+rid+'_ok">'+
      '<div class="aviso" style="border-color:var(--green-d);color:var(--green-d)">✓ Evidencia enviada. ¡Buen trabajo!</div>'+
    '</div>'+
  '</div>';
}
function retoEvidenciaWire(grado,periodoId,r){
  if(!EVIDENCIAS.ENDPOINT) return;
  var rid="ev_"+periodoId+"_s"+r.semana;
  var wrap=$("#"+rid); if(!wrap) return;
  var toggle=wrap.querySelector("[data-evtoggle]"), form=$("#"+rid+"_form");
  toggle.addEventListener("click",function(){ form.classList.toggle("hidden"); });

  var tipo="foto";
  wrap.querySelectorAll(".seg").forEach(function(sg){
    sg.addEventListener("click",function(){
      tipo=sg.dataset.t;
      wrap.querySelectorAll(".seg").forEach(function(o){ o.classList.toggle("on",o===sg); });
      $("#"+rid+"_wrapFoto").classList.toggle("hidden",tipo!=="foto");
      $("#"+rid+"_wrapEnlace").classList.toggle("hidden",tipo!=="enlace");
    });
  });

  var fotoLista=null;
  $("#"+rid+"_foto").addEventListener("change",function(){
    var f=this.files&&this.files[0]; fotoLista=null;
    if(!f) return;
    $("#"+rid+"_fotoHint").textContent="Preparando la foto…";
    comprimirFoto(f,function(d){
      if(!d){ $("#"+rid+"_fotoHint").textContent="No se pudo leer la imagen. Intenta con otra foto."; return; }
      fotoLista=d;
      $("#"+rid+"_fotoHint").textContent="Foto lista ("+Math.round(d.datos.length*0.75/1024)+" KB).";
    });
  });

  $("#"+rid+"_send").addEventListener("click",function(){
    var nb=$("#"+rid+"_nombre").value.trim(), gp=$("#"+rid+"_grupo").value.trim(), en=$("#"+rid+"_enlace").value.trim();
    var err=$("#"+rid+"_err");
    if(!gp||nb.length<5){ err.textContent="Completa tu grupo y nombre completo."; return; }
    if(!$("#"+rid+"_auth").checked){ err.textContent="Necesitamos tu autorización para recibir la evidencia."; return; }
    if(tipo==="foto"&&!fotoLista){ err.textContent="Escoge la foto de tu evidencia."; return; }
    if(tipo==="enlace"&&!/^https?:\/\/.+/.test(en)){ err.textContent="Pega un enlace que empiece por https://"; return; }
    if(fotoLista&&fotoLista.datos.length>6000000){ err.textContent="La foto pesa demasiado. Toma otra o sube el archivo a Drive y pega el enlace."; return; }
    err.textContent="";
    var p={ tipo:"evidencia", timestamp:new Date().toISOString(),
            nombre:nb, documento:$("#"+rid+"_doc").value.trim(), grado:grado, grupo:gp,
            periodo:periodoPorId(periodoId).nombre, semana:r.semana, reto:r.titulo,
            comentario:$("#"+rid+"_com").value.trim(), enlace:tipo==="enlace"?en:"",
            archivo:tipo==="foto"?fotoLista:null };
    var btn=$("#"+rid+"_send"); btn.disabled=true; btn.textContent="Enviando…";
    fetch(EVIDENCIAS.ENDPOINT,{method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(p)})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j||!j.ok){
          btn.disabled=false; btn.textContent="Enviar mi evidencia";
          err.textContent="No se recibió: "+((j&&j.error)||"respuesta no válida")+"";
          return;
        }
        $("#"+rid+"_form").classList.add("hidden");
        $("#"+rid+"_ok").classList.remove("hidden");
      })
      .catch(function(){
        btn.disabled=false; btn.textContent="Enviar mi evidencia";
        err.textContent="No se pudo enviar. Revisa tu conexión e inténtalo otra vez.";
      });
  });
}

/* ====== RESULTADOS ====== */

var RES_DATA=null, RES_SEL={grado:"",grupo:""};

function renderResultados(){
  var b=$("#body_resultados"), h=borrador("resultados");
  if(!CONFIG.ENDPOINT){ b.innerHTML=h+construccion("resultados"); return; }
  b.innerHTML=h+'<div class="card pcard" style="max-width:620px"><p class="psub">Cargando resultados…</p></div>';
  fetch(CONFIG.ENDPOINT+(CONFIG.ENDPOINT.indexOf("?")>=0?"&":"?")+"resultados=1")
    .then(function(r){ return r.json(); })
    .then(function(json){
      RES_DATA=(json&&json.ok&&Array.isArray(json.data))?json.data:[];
      resDibujar();
    })
    .catch(function(){ RES_DATA=null; resDibujar(); });
}

/* Suma ok/tot de cada competencia y promedia nota/puntaje de un conjunto de intentos. */
function resAgregar(rows){
  var n=rows.length, sumNota=0, sumPje=0, comp={};
  rows.forEach(function(r){
    sumNota+=(r.nota||0); sumPje+=(r.puntaje100||0);
    var pc=r.porCompetencia||{};
    Object.keys(pc).forEach(function(k){
      var partes=String(pc[k]).split("/"), ok=parseInt(partes[0],10)||0, tot=parseInt(partes[1],10)||0;
      if(!comp[k]) comp[k]={ok:0,tot:0};
      comp[k].ok+=ok; comp[k].tot+=tot;
    });
  });
  return { n:n, promNota:n?(sumNota/n):0, promPje:n?(sumPje/n):0, comp:comp };
}

function resBloqueHTML(titulo,subVacio,agg){
  if(!agg.n){
    return '<div class="gsec"><div class="gt"><span>'+esc(titulo)+'</span></div>'+
           '<p class="tz-detalle">'+esc(subVacio||"Todavía no hay evaluaciones presentadas aquí.")+'</p></div>';
  }
  var comps=Object.keys(agg.comp);
  return '<div class="gsec"><div class="gt"><span>'+esc(titulo)+'</span>'+
    '<span class="pill">'+agg.n+' presentado'+(agg.n===1?"":"s")+'</span></div>'+
    '<p class="psub" style="margin:-4px 0 14px">Promedio: nota '+agg.promNota.toFixed(1)+'/5.0 · '+Math.round(agg.promPje)+'/100</p>'+
    (comps.length?'<div class="comps">'+comps.map(function(k){
      var c=agg.comp[k], pc=c.tot?Math.round(c.ok/c.tot*100):0;
      return '<div class="comp"><div class="top"><span>'+esc(k)+'</span><span>'+c.ok+'/'+c.tot+'</span></div>'+
             '<div class="track"><div class="fill" style="width:'+pc+'%"></div></div></div>';
    }).join("")+'</div>':'')+
    '</div>';
}

/* Insignias: ranking individual por nombre, con nota a 5 decimales para
   definir el puesto sin empates falsos. Empates reales comparten puesto
   (ranking tipo "1,2,2,4…"). */
var MEDALLA=["🥇","🥈","🥉"];
function resInsigniasHTML(titulo,rows){
  var conNombre=rows.filter(function(r){ return r.nombre; });
  if(!conNombre.length) return "";
  var ordenado=conNombre.slice().sort(function(a,b){
    return (b.notaExacta!=null?b.notaExacta:b.nota)-(a.notaExacta!=null?a.notaExacta:a.nota);
  });
  var puesto=0, anterior=null;
  var filas=ordenado.map(function(r,i){
    var val=r.notaExacta!=null?r.notaExacta:r.nota;
    if(val!==anterior){ puesto=i+1; anterior=val; }
    var top=puesto<=3?" top"+puesto:"";
    return '<div class="rank-row'+top+'">'+
      '<span class="rank-pos">'+(puesto<=3?"":puesto+"°")+'</span>'+
      (puesto<=3?'<span class="rank-medal">'+MEDALLA[puesto-1]+'</span>':'')+
      '<span class="rank-name">'+esc(r.nombre)+'</span>'+
      '<span class="rank-nota">'+val.toFixed(5)+'</span>'+
    '</div>';
  }).join("");
  return '<div class="rank-title">'+esc(titulo)+'</div><div class="rank-list">'+filas+'</div>';
}


function resDibujar(){
  var b=$("#body_resultados"), h=borrador("resultados");
  if(RES_DATA===null){
    b.innerHTML=h+'<div class="tz-empty-org">No se pudo conectar con la hoja de resultados. Verifica tu conexión e inténtalo de nuevo. '+
      '<button class="btn-ghost" style="margin-top:10px" onclick="renderResultados()">Reintentar</button></div>';
    return;
  }
  var data=RES_DATA, grados=uniq(data.map(function(r){return r.grado;})).sort();
  h+='<div class="card pcard" style="max-width:620px">'+
    '<div class="field"><label for="resGrado">Grado</label><select id="resGrado"><option value="">Todos los grados</option>'+
      grados.map(function(g){ return '<option'+(RES_SEL.grado===g?' selected':'')+'>'+esc(g)+'</option>'; }).join("")+
    '</select></div>'+
    '<div class="field hidden" id="resWrapGrupo"><label for="resGrupo">Grupo</label><select id="resGrupo"><option value="">Todos los grupos</option></select></div>'+
  '</div><div id="resBloques"></div>';
  b.innerHTML=h;

  function llenarGrupos(){
    var g=$("#resGrado").value;
    var grupos=uniq(data.filter(function(r){return r.grado===g;}).map(function(r){return r.grupo;})).sort();
    $("#resGrupo").innerHTML='<option value="">Todos los grupos</option>'+
      grupos.map(function(x){ return '<option'+(RES_SEL.grupo===x?' selected':'')+'>'+esc(x)+'</option>'; }).join("");
    $("#resWrapGrupo").classList.toggle("hidden",!g);
  }
  function pintarBloques(){
    var g=RES_SEL.grado, gr=RES_SEL.grupo, out="";
    if(g&&gr){
      var filaGrupo=data.filter(function(r){return r.grado===g&&r.grupo===gr;});
      out+=resBloqueHTML("Tu grupo · "+g+" "+gr,null,resAgregar(filaGrupo));
      out+=resInsigniasHTML("Puestos · "+g+" "+gr,filaGrupo);
    }
    if(g){
      var filaGrado=data.filter(function(r){return r.grado===g;});
      out+=resBloqueHTML("Todo el grado "+g,null,resAgregar(filaGrado));
      out+=resInsigniasHTML("Puestos · Grado "+g,filaGrado);
    }
    out+=resBloqueHTML("Consolidado general","Todavía no hay evaluaciones presentadas.",resAgregar(data));
    out+=resInsigniasHTML("Puestos · Consolidado general",data);
    $("#resBloques").innerHTML=out;
  }
  $("#resGrado").onchange=function(){ RES_SEL.grado=$("#resGrado").value; RES_SEL.grupo=""; llenarGrupos(); pintarBloques(); };
  $("#resGrupo").onchange=function(){ RES_SEL.grupo=$("#resGrupo").value; pintarBloques(); };
  llenarGrupos(); pintarBloques();
}

/* Reduce la foto antes de enviarla: lado mayor de 1280 px y compresión JPEG. */
function comprimirFoto(file,cb){
  var fr=new FileReader();
  fr.onerror=function(){ cb(null); };
  fr.onload=function(){
    var img=new Image();
    img.onerror=function(){ cb(null); };
    img.onload=function(){
      var max=1280, w=img.width, h=img.height;
      if(w>max||h>max){ if(w>h){ h=Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; } }
      var c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      var url=c.toDataURL("image/jpeg",0.72);
      cb({ nombre:(file.name||"evidencia")+".jpg", mime:"image/jpeg", datos:url.split(",")[1] });
    };
    img.src=fr.result;
  };
  fr.readAsDataURL(file);
}

/* ====== AUTOEVALUACIÓN ======
   Formulario de autoevaluación del estudiante: 4 criterios, cada uno con
   4 componentes calificados de 3.0 a 5.0. Se guarda en la pestaña
   "Autoevaluaciones" del MISMO documento de Evaluaciones (reutiliza
   CONFIG.ENDPOINT — no necesita un backend aparte).                      */
var AUTOEVAL_CRITERIOS=[
  { id:"resp", titulo:"Responsabilidad",
    desc:"Entrega de tareas y actividades a tiempo y sin demoras; llegadas a clase a tiempo y sin llamados de atención por llegadas tarde.",
    componentes:[
      {id:"r1", texto:"Entrego las tareas y actividades dentro del plazo establecido."},
      {id:"r2", texto:"Llego puntual al inicio de la clase."},
      {id:"r3", texto:"No he tenido llamados de atención por llegar tarde."},
      {id:"r4", texto:"Cumplo los compromisos que adquiero durante la clase."}
    ]},
  { id:"act", titulo:"Actitud en clase",
    desc:"Participación activa en clase, tanto en actividades libres como en actividades dirigidas.",
    componentes:[
      {id:"a1", texto:"Participo activamente en las actividades dirigidas por el docente."},
      {id:"a2", texto:"Participo activamente en las actividades libres."},
      {id:"a3", texto:"Muestro disposición e interés durante la clase."},
      {id:"a4", texto:"Respeto a mis compañeros y al docente durante las actividades."}
    ]},
  { id:"rend", titulo:"Rendimiento académico",
    desc:"Cómo asumí los retos académicos y los resultados prácticos y teóricos que se presentaron.",
    componentes:[
      {id:"n1", texto:"Asumo con buena actitud los retos y actividades académicas propuestas."},
      {id:"n2", texto:"Mis resultados en las actividades prácticas son satisfactorios."},
      {id:"n3", texto:"Mis resultados en las actividades teóricas (evaluaciones y trabajos) son satisfactorios."},
      {id:"n4", texto:"He mostrado mejora y avance durante el periodo."}
    ]},
  { id:"disc", titulo:"Disciplina",
    desc:"Llamados de atención, anotaciones y procesos disciplinarios de la clase de Educación Física.",
    componentes:[
      {id:"d1", texto:"No he tenido llamados de atención durante la clase."},
      {id:"d2", texto:"No tengo anotaciones en el observador o seguimiento del área."},
      {id:"d3", texto:"Cumplo las normas y acuerdos de la clase."},
      {id:"d4", texto:"No he tenido procesos disciplinarios relacionados con la clase."}
    ]}
];
function renderAutoeval(){
  var b=$("#body_autoeval");
  b.innerHTML=
    '<div class="card pcard" style="margin-bottom:16px">'+
      '<div class="field"><label for="aeNombre">Nombre completo</label>'+
        '<input id="aeNombre" type="text" placeholder="Nombre y apellidos"></div>'+
      '<div class="field"><label for="aeDocumento">Número de documento</label>'+
        '<input id="aeDocumento" type="text" placeholder="Número de documento" inputmode="numeric"></div>'+
      '<div class="field"><label for="aeGrado">Grado</label><select id="aeGrado" onchange="aeActualizarGrupos()">'+
        '<option value="">Selecciona…</option>'+
        ["6.°","7.°","8.°","9.°","10.°","11.°"].map(function(g){return '<option>'+g+'</option>';}).join("")+
      '</select></div>'+
      '<div class="field"><label for="aeGrupo">Grupo</label><select id="aeGrupo">'+
        '<option value="">Selecciona un grado primero…</option></select></div>'+
      '<div class="field"><label for="aePeriodo">Periodo</label><select id="aePeriodo">'+
        '<option value="">Selecciona…</option><option>Periodo 1</option><option>Periodo 2</option><option>Periodo 3</option>'+
      '</select></div>'+
    '</div>'+
    AUTOEVAL_CRITERIOS.map(function(c){
      return '<div class="ae-crit"><h3>'+esc(c.titulo)+'</h3><p class="ae-desc">'+esc(c.desc)+'</p>'+
        c.componentes.map(function(comp){
          var vid="ae_"+comp.id;
          return '<div class="ae-comp"><div class="ae-comp-top"><span class="ae-comp-txt">'+esc(comp.texto)+'</span>'+
            '<span class="ae-comp-val" id="'+vid+'_val">4.0</span></div>'+
            '<input type="range" id="'+vid+'" min="3.0" max="5.0" step="0.1" value="4.0" '+
            'oninput="$(\'#'+vid+'_val\').textContent=parseFloat(this.value).toFixed(1)"></div>';
        }).join("")+
      '</div>';
    }).join("")+
    '<div class="err" id="aeErr"></div>'+
    '<button class="btn btn-primary" style="width:100%" onclick="aeEnviar()">Guardar mi autoevaluación</button>'+
    '<div id="aeResultado"></div>';
}

function aeCalcular(){
  var porCriterio={}, sumaTotal=0, nComp=0;
  AUTOEVAL_CRITERIOS.forEach(function(c){
    var suma=0;
    c.componentes.forEach(function(comp){
      var v=parseFloat($("#ae_"+comp.id).value)||3.0;
      suma+=v; sumaTotal+=v; nComp++;
    });
    porCriterio[c.titulo]=Math.round((suma/c.componentes.length)*10)/10;
  });
  return { porCriterio:porCriterio, promedioFinal:Math.round((sumaTotal/nComp)*10)/10 };
}

function aeEnviar(){
  var nombre=($("#aeNombre").value||"").trim();
  var documento=($("#aeDocumento").value||"").trim();
  var grado=$("#aeGrado").value, grupo=($("#aeGrupo").value||"").trim(), periodo=$("#aePeriodo").value;
  if(!nombre||!documento||!grado||!grupo||!periodo){
    $("#aeErr").textContent="Completa tu nombre, documento, grado, grupo y periodo antes de guardar.";
    return;
  }
  $("#aeErr").textContent="";
  var r=aeCalcular();
  var payload={ tipo:"autoeval", timestamp:new Date().toISOString(), nombre:nombre, documento:documento,
    grado:grado, grupo:grupo, periodo:periodo, porCriterio:r.porCriterio, promedioFinal:r.promedioFinal };
  if(CONFIG.ENDPOINT){
    try{ fetch(CONFIG.ENDPOINT,{method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload)}); }catch(e){}
  }
  var comps=Object.keys(r.porCriterio);
  $("#aeResultado").innerHTML=
    '<div class="gsec" style="margin-top:18px"><div class="gt"><span>Tu resultado</span></div>'+
    '<div class="comps">'+comps.map(function(k){
      var pc=Math.round((r.porCriterio[k]-3.0)/2.0*100);
      return '<div class="comp"><div class="top"><span>'+esc(k)+'</span><span>'+r.porCriterio[k].toFixed(1)+'</span></div>'+
             '<div class="track"><div class="fill" style="width:'+Math.max(4,pc)+'%"></div></div></div>';
    }).join("")+'</div>'+
    '<div class="ae-avg">Promedio final <b>'+r.promedioFinal.toFixed(1)+' / 5.0</b></div></div>';
  $("#aeResultado").scrollIntoView({behavior:"smooth",block:"start"});
}

function irAQuiz(){ QUIZ_MODE=true; go("select"); initSelect(); }
function irAEvaluacionFormal(){ QUIZ_MODE=false; go("select"); initSelect(); }
function gruposDe(grado){ if(!grado) return []; var n=grado.replace(".°",""); return [n+"-1",n+"-2"]; }
function aeActualizarGrupos(){
  var g=$("#aeGrado").value, gr=$("#aeGrupo");
  gr.innerHTML='<option value="">Selecciona…</option>'+gruposDe(g).map(function(x){return '<option>'+x+'</option>';}).join("");
}

/* ====== JUEGO: "Corre y salta" ======
   Clon sencillo del juego del dinosaurio de Chrome, con conos y balones
   como obstáculos. El puntaje sube mientras el estudiante no choque; la
   velocidad aumenta poco a poco para exigir concentración. Los récords se
   guardan en una hoja de cálculo (ver JUEGO.ENDPOINT) para que la tabla
   sea la misma para todo el colegio, desde cualquier dispositivo.        */
var JUEGO = { ENDPOINT:"https://script.google.com/macros/s/AKfycbwZom2Ehtdj-cP9QTfQn8SoZOQ92LWjnF8XbQWksqBXEYty-aDDJtOg2AQOpIl9ry9s/exec" };  // Mismo backend combinado (ver Code_Torneos_y_Juegos.gs)
var JG_KEY="jmrp_juego_mejor_hoy";
var jg = null; // estado del juego en curso (null = no hay partida activa)

function jgSincronizar(){
  var b=$("#body_juego");
  if(!JUEGO.ENDPOINT){ if(b) b.innerHTML=construccion("juego"); return; }
  fetch(JUEGO.ENDPOINT+(JUEGO.ENDPOINT.indexOf("?")>=0?"&":"?")+"accion=juego")
    .then(function(r){ return r.json(); })
    .then(function(json){
      if(json&&json.ok&&Array.isArray(json.data)){ jgPintarTabla(json.data); }
      else if(b){ b.innerHTML='<p class="tz-detalle">No se pudo cargar la tabla de récords.</p>'; }
    })
    .catch(function(){ if(b) b.innerHTML='<p class="tz-detalle">No se pudo conectar con la tabla de récords.</p>'; });
}
function jgPintarTabla(data){
  var b=$("#body_juego"); if(!b) return;
  if(!data.length){ b.innerHTML=construccion("juego"); return; }
  var top=data.slice().sort(function(a,c){return c.puntaje-a.puntaje;}).slice(0,20);
  b.innerHTML=resInsigniasHTML("Mejores puntajes",top.map(function(r){
    return { nombre:r.nombre+(r.grado?" ("+r.grado+")":""), nota:r.puntaje, notaExacta:r.puntaje };
  })).replace(/rank-nota">([\d.]+)/g,function(m,v){ return 'rank-nota">'+Math.round(parseFloat(v)); });
}

function renderJuego(){
  if(!$("#jgCanvas")) return;
  jgResetPantalla();
  var best=0; try{ best=parseInt(localStorage.getItem(JG_KEY)||"0",10)||0; }catch(e){}
  $("#jgBest").textContent=best;
}
function jgResetPantalla(){
  $("#jgOverlay").classList.remove("hidden");
  $("#jgOverlayTitulo").textContent="Corre y salta";
  $("#jgOverlayTexto").textContent="Presiona espacio o toca la pantalla para saltar los conos y los balones. Un choque termina el intento.";
  $("#jgBtnJugar").classList.remove("hidden");
  $("#jgFormRecord").classList.add("hidden");
  $("#jgScore").textContent="0";
}

function jgDetener(){
  if(jg&&jg.raf){ cancelAnimationFrame(jg.raf); }
  jg=null;
}

function jgIniciar(){
  var cv=$("#jgCanvas"); if(!cv) return;
  var ctx=cv.getContext("2d");
  var W=cv.width, H=cv.height, suelo=H-34;
  $("#jgOverlay").classList.add("hidden");
  jg={
    ctx:ctx, W:W, H:H, suelo:suelo,
    jugador:{x:60,y:suelo-40,w:26,h:40,vy:0,saltando:false},
    obstaculos:[], velocidad:5.2, distNext:70, frame:0, score:0, vivo:true, raf:null
  };
  jgLoop();
}

function jgSalto(){
  if(!jg||!jg.vivo) return;
  var j=jg.jugador;
  if(!j.saltando){ j.vy=-11.5; j.saltando=true; }
}

function jgLoop(){
  if(!jg) return;
  var g=jg, ctx=g.ctx;
  g.frame++;
  g.velocidad=5.2+Math.min(5.5,g.frame/620);

  var j=g.jugador;
  j.vy+=0.62; j.y+=j.vy;
  if(j.y>g.suelo-j.h){ j.y=g.suelo-j.h; j.vy=0; j.saltando=false; }

  g.distNext-=g.velocidad;
  if(g.distNext<=0){
    var tipo=Math.random()<0.5?"cono":"balon";
    var h=tipo==="cono"?32:26;
    g.obstaculos.push({x:g.W+10,w:tipo==="cono"?22:h,h:h,tipo:tipo});
    var base=150+Math.random()*140-Math.min(70,g.frame/16);
    var piso=50*g.velocidad; // siempre deja tiempo para completar un salto (~37 frames) antes del siguiente obstáculo
    g.distNext=Math.max(piso, base);
  }
  g.obstaculos.forEach(function(o){ o.x-=g.velocidad; });
  g.obstaculos=g.obstaculos.filter(function(o){ return o.x+o.w>-5; });

  g.obstaculos.forEach(function(o){
    var oy=g.suelo-o.h;
    if(j.x<o.x+o.w-6 && j.x+j.w-6>o.x && j.y<oy+o.h && j.y+j.h>oy){ g.vivo=false; }
  });

  g.score=Math.floor(g.frame/6);
  $("#jgScore").textContent=g.score;

  jgDibujar();

  if(g.vivo){ g.raf=requestAnimationFrame(jgLoop); }
  else { jgFin(); }
}

function jgDibujar(){
  var g=jg, ctx=g.ctx;
  ctx.clearRect(0,0,g.W,g.H);
  // pista (línea discontinua)
  ctx.strokeStyle="rgba(32,40,31,.18)"; ctx.lineWidth=2; ctx.setLineDash([14,12]);
  ctx.beginPath(); ctx.moveTo(0,g.suelo+6); ctx.lineTo(g.W,g.suelo+6); ctx.stroke(); ctx.setLineDash([]);
  // jugador
  var j=g.jugador;
  ctx.fillStyle="#2E6B3A";
  ctx.beginPath(); ctx.arc(j.x+j.w/2, j.y+8, 8, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(j.x+6, j.y+14, j.w-12, j.h-20);
  ctx.strokeStyle="#2E6B3A"; ctx.lineWidth=4; ctx.lineCap="round";
  var paso=j.saltando?6:Math.sin(g.frame/2)*8;
  ctx.beginPath(); ctx.moveTo(j.x+8,j.y+j.h-6); ctx.lineTo(j.x+8-paso,j.y+j.h+6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(j.x+j.w-8,j.y+j.h-6); ctx.lineTo(j.x+j.w-8+paso,j.y+j.h+6); ctx.stroke();
  // obstáculos
  g.obstaculos.forEach(function(o){
    var oy=g.suelo-o.h;
    if(o.tipo==="cono"){
      ctx.fillStyle="#C69A3B";
      ctx.beginPath(); ctx.moveTo(o.x+o.w/2,oy); ctx.lineTo(o.x,oy+o.h); ctx.lineTo(o.x+o.w,oy+o.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle="#fff"; ctx.fillRect(o.x+4,oy+o.h*0.6,o.w-8,3);
    } else {
      ctx.fillStyle="#3E86AE";
      ctx.beginPath(); ctx.arc(o.x+o.w/2,oy+o.h/2,o.h/2,0,Math.PI*2); ctx.fill();
    }
  });
}

function jgFin(){
  var best=0; try{ best=parseInt(localStorage.getItem(JG_KEY)||"0",10)||0; }catch(e){}
  if(jg.score>best){ best=jg.score; try{ localStorage.setItem(JG_KEY,String(best)); }catch(e){} }
  $("#jgBest").textContent=best;
  $("#jgOverlay").classList.remove("hidden");
  $("#jgOverlayTitulo").textContent="¡Chocaste!";
  $("#jgOverlayTexto").textContent="Puntaje: "+jg.score+". Escribe tu nombre para dejarlo en la tabla de récords, o vuelve a intentarlo.";
  $("#jgBtnJugar").textContent="Intentar de nuevo";
  $("#jgBtnJugar").classList.remove("hidden");
  if(JUEGO.ENDPOINT){ $("#jgFormRecord").classList.remove("hidden"); }
}

function jgGuardarRecord(){
  if(!jg) return;
  var nombre=($("#jgNombre").value||"").trim(), grado=$("#jgGrado").value;
  if(!nombre){ $("#jgErr").textContent="Escribe tu nombre para guardar el récord."; return; }
  $("#jgErr").textContent="";
  var payload={ tipo:"record", juego:"correr", nombre:nombre, grado:grado, puntaje:jg.score, timestamp:new Date().toISOString() };
  if(JUEGO.ENDPOINT){
    try{ fetch(JUEGO.ENDPOINT,{method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload)}); }catch(e){}
  }
  $("#jgFormRecord").classList.add("hidden");
  $("#jgOverlayTexto").textContent="¡Récord guardado! Puntaje: "+jg.score+".";
  setTimeout(jgSincronizar,900);
}

document.addEventListener("keydown",function(e){
  if(e.code==="Space"&&jg&&jg.vivo){ e.preventDefault(); jgSalto(); }
});
(function(){
  var cv=document.getElementById("jgCanvas");
  if(cv) cv.addEventListener("pointerdown",function(){ if(jg&&jg.vivo) jgSalto(); });
})();

/* ====== SELECTOR DE JUEGOS ====== */
var J_ACTIVO="correr";
function jSeleccionar(cual){
  if(cual===J_ACTIVO) return;
  jgDetener(); eaDetener();
  J_ACTIVO=cual;
  $("#tabJuego1").classList.toggle("on",cual==="correr");
  $("#tabJuego2").classList.toggle("on",cual==="atrapa");
  $("#juego1Wrap").classList.toggle("hidden",cual!=="correr");
  $("#juego2Wrap").classList.toggle("hidden",cual!=="atrapa");
  if(cual==="correr"){ renderJuego(); jgSincronizar(); }
  else { renderAtrapa(); eaSincronizar(); }
}

/* ====== JUEGO 2: "Atrapa y esquiva" ======
   Segundo juego de la misma sección: una cesta se mueve de lado a lado
   para atrapar balones buenos (suman puntos) y esquivar los malos
   (restan una vida). Tres vidas, cada vez cae más rápido. Récords en su
   propia tabla (ver JUEGO2.ENDPOINT / Code_JuegoAtrapa.gs).             */
var JUEGO2 = { ENDPOINT:"https://script.google.com/macros/s/AKfycbwZom2Ehtdj-cP9QTfQn8SoZOQ92LWjnF8XbQWksqBXEYty-aDDJtOg2AQOpIl9ry9s/exec" };  // Mismo backend combinado (ver Code_Torneos_y_Juegos.gs)
var EA_KEY="jmrp_atrapa_mejor_hoy";
var ea=null;

function eaSincronizar(){
  var b=$("#body_juego2");
  if(!JUEGO2.ENDPOINT){ if(b) b.innerHTML=construccion("juego"); return; }
  fetch(JUEGO2.ENDPOINT+(JUEGO2.ENDPOINT.indexOf("?")>=0?"&":"?")+"accion=atrapa")
    .then(function(r){ return r.json(); })
    .then(function(json){
      if(json&&json.ok&&Array.isArray(json.data)){ eaPintarTabla(json.data); }
      else if(b){ b.innerHTML='<p class="tz-detalle">No se pudo cargar la tabla de récords.</p>'; }
    })
    .catch(function(){ if(b) b.innerHTML='<p class="tz-detalle">No se pudo conectar con la tabla de récords.</p>'; });
}
function eaPintarTabla(data){
  var b=$("#body_juego2"); if(!b) return;
  if(!data.length){ b.innerHTML=construccion("juego"); return; }
  var top=data.slice().sort(function(a,c){return c.puntaje-a.puntaje;}).slice(0,20);
  b.innerHTML=resInsigniasHTML("Mejores puntajes",top.map(function(r){
    return { nombre:r.nombre+(r.grado?" ("+r.grado+")":""), nota:r.puntaje, notaExacta:r.puntaje };
  })).replace(/rank-nota">([\d.]+)/g,function(m,v){ return 'rank-nota">'+Math.round(parseFloat(v)); });
}

function renderAtrapa(){
  if(!$("#eaCanvas")) return;
  eaResetPantalla();
  var best=0; try{ best=parseInt(localStorage.getItem(EA_KEY)||"0",10)||0; }catch(e){}
  $("#eaBest").textContent=best;
}
function eaResetPantalla(){
  $("#eaOverlay").classList.remove("hidden");
  $("#eaOverlayTitulo").textContent="Atrapa y esquiva";
  $("#eaOverlayTexto").textContent="Mueve la canasta con las flechas ← → (o arrastra el dedo) para atrapar los balones buenos y esquivar los malos. Tres fallos y se acaba.";
  $("#eaBtnJugar").classList.remove("hidden");
  $("#eaFormRecord").classList.add("hidden");
  $("#eaScore").textContent="0";
  $("#eaVidas").textContent="❤️❤️❤️";
}
function eaDetener(){ if(ea&&ea.raf){ cancelAnimationFrame(ea.raf); } ea=null; }

function eaIniciar(){
  var cv=$("#eaCanvas"); if(!cv) return;
  var ctx=cv.getContext("2d");
  var W=cv.width, H=cv.height;
  $("#eaOverlay").classList.add("hidden");
  ea={
    ctx:ctx, W:W, H:H,
    cesta:{x:W/2-35,w:70,h:16}, izq:false, der:false,
    objetos:[], velocidad:2.6, distNext:40, frame:0, score:0, vidas:3, vivo:true, raf:null
  };
  eaLoop();
}
function eaMover(dx){ if(!ea||!ea.vivo) return; ea.cesta.x=Math.max(0,Math.min(ea.W-ea.cesta.w,ea.cesta.x+dx)); }

function eaLoop(){
  if(!ea) return;
  var g=ea, ctx=g.ctx;
  g.frame++;
  g.velocidad=2.6+Math.min(2.0,g.frame/900);

  if(g.izq) eaMover(-9);
  if(g.der) eaMover(9);

  g.distNext-=g.velocidad;
  if(g.distNext<=0){
    var hayMaloEnPantalla=g.objetos.some(function(o){ return o.malo; });
    var malo=!hayMaloEnPantalla&&Math.random()<Math.min(0.5,0.22+g.frame/1800);
    g.objetos.push({x:20+Math.random()*(g.W-40),y:-14,r:13,malo:malo,vy:g.velocidad});
    g.distNext=34+Math.random()*40;
  }
  g.objetos.forEach(function(o){ o.y+=o.vy; });

  var cy=g.H-24, cesta=g.cesta;
  g.objetos=g.objetos.filter(function(o){
    if(o.y+o.r>=cy && o.y-o.r<=cy+16 && o.x>cesta.x-4 && o.x<cesta.x+cesta.w+4){
      if(o.malo){ g.vidas--; $("#eaVidas").textContent="❤️".repeat(Math.max(0,g.vidas))+"🤍".repeat(3-Math.max(0,g.vidas)); if(g.vidas<=0) g.vivo=false; }
      else { g.score++; }
      return false;
    }
    return o.y-o.r<g.H+20;
  });

  $("#eaScore").textContent=g.score;
  eaDibujar();

  if(g.vivo){ g.raf=requestAnimationFrame(eaLoop); }
  else { eaFin(); }
}

function eaDibujar(){
  var g=ea, ctx=g.ctx;
  ctx.clearRect(0,0,g.W,g.H);
  // cesta
  var c=g.cesta;
  ctx.fillStyle="#2E6B3A";
  ctx.beginPath();
  ctx.moveTo(c.x,g.H-24);
  ctx.lineTo(c.x+c.w,g.H-24);
  ctx.lineTo(c.x+c.w-8,g.H-24+c.h);
  ctx.lineTo(c.x+8,g.H-24+c.h);
  ctx.closePath(); ctx.fill();
  // objetos
  g.objetos.forEach(function(o){
    ctx.fillStyle=o.malo?"#B23A3A":"#3E86AE";
    ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
    if(o.malo){
      ctx.strokeStyle="#fff"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(o.x-5,o.y-5); ctx.lineTo(o.x+5,o.y+5);
      ctx.moveTo(o.x+5,o.y-5); ctx.lineTo(o.x-5,o.y+5); ctx.stroke();
    }
  });
}

function eaFin(){
  var best=0; try{ best=parseInt(localStorage.getItem(EA_KEY)||"0",10)||0; }catch(e){}
  if(ea.score>best){ best=ea.score; try{ localStorage.setItem(EA_KEY,String(best)); }catch(e){} }
  $("#eaBest").textContent=best;
  $("#eaOverlay").classList.remove("hidden");
  $("#eaOverlayTitulo").textContent="¡Se acabaron las vidas!";
  $("#eaOverlayTexto").textContent="Puntaje: "+ea.score+". Escribe tu nombre para dejarlo en la tabla de récords, o vuelve a intentarlo.";
  $("#eaBtnJugar").textContent="Intentar de nuevo";
  $("#eaBtnJugar").classList.remove("hidden");
  if(JUEGO2.ENDPOINT){ $("#eaFormRecord").classList.remove("hidden"); }
}

function eaGuardarRecord(){
  if(!ea) return;
  var nombre=($("#eaNombre").value||"").trim(), grado=$("#eaGrado").value;
  if(!nombre){ $("#eaErr").textContent="Escribe tu nombre para guardar el récord."; return; }
  $("#eaErr").textContent="";
  var payload={ tipo:"record", juego:"atrapa", nombre:nombre, grado:grado, puntaje:ea.score, timestamp:new Date().toISOString() };
  if(JUEGO2.ENDPOINT){
    try{ fetch(JUEGO2.ENDPOINT,{method:"POST",mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload)}); }catch(e){}
  }
  $("#eaFormRecord").classList.add("hidden");
  $("#eaOverlayTexto").textContent="¡Récord guardado! Puntaje: "+ea.score+".";
  setTimeout(eaSincronizar,900);
}

document.addEventListener("keydown",function(e){
  if(!ea||!ea.vivo) return;
  if(e.code==="ArrowLeft"){ e.preventDefault(); ea.izq=true; }
  if(e.code==="ArrowRight"){ e.preventDefault(); ea.der=true; }
});
document.addEventListener("keyup",function(e){
  if(!ea) return;
  if(e.code==="ArrowLeft") ea.izq=false;
  if(e.code==="ArrowRight") ea.der=false;
});
(function(){
  var cv=document.getElementById("eaCanvas");
  if(!cv) return;
  var arrastrando=false;
  function posX(evt){
    var rect=cv.getBoundingClientRect();
    var clientX=evt.clientX!=null?evt.clientX:(evt.touches&&evt.touches[0]?evt.touches[0].clientX:0);
    return (clientX-rect.left)*(cv.width/rect.width);
  }
  cv.addEventListener("pointerdown",function(e){ arrastrando=true; if(ea&&ea.vivo) ea.cesta.x=Math.max(0,Math.min(ea.W-ea.cesta.w,posX(e)-ea.cesta.w/2)); });
  cv.addEventListener("pointermove",function(e){ if(arrastrando&&ea&&ea.vivo) ea.cesta.x=Math.max(0,Math.min(ea.W-ea.cesta.w,posX(e)-ea.cesta.w/2)); });
  window.addEventListener("pointerup",function(){ arrastrando=false; });
})();

/* ====== TORNEOS — "Interclases Tiempo Libre" ======
   Módulo dinámico: el profesor crea los torneos, los equipos, genera el
   fixture y registra los resultados desde la pestaña "Organizador" (con
   la clave ORGANIZADOR_CLAVE definida arriba). Los estudiantes ven todo
   en modo lectura desde la pestaña "Torneos".
   Los datos se guardan en localStorage del navegador (ver nota junto a
   ORGANIZADOR_CLAVE). Si más adelante defines TORNEOS.ENDPOINT, cada
   cambio también se intenta enviar a esa hoja de cálculo.                */
var TZ_KEY="jmrp_torneos_v1";
var tzCache=null;                // copia en memoria (evita releer localStorage todo el tiempo)
var tzClaveOK=(function(){ try{ return sessionStorage.getItem("jmrp_prof_clave")||""; }catch(e){ return ""; } })();                // clave con la que el profesor entró (se envía al guardar)
var tzFiltroDeporte="Todos";     // filtro de la vista pública
var tzPlanillaAbierta=null;      // id del partido con la planilla desplegada
var tzEditando=null;             // id del torneo en edición (agregar equipos)

/* ---- almacenamiento: copia local (localStorage) + hoja de Google (si TORNEOS.ENDPOINT
   está configurado). La copia local hace que la página cargue rápido incluso sin
   internet; tzSincronizar() trae la versión más reciente de la hoja de cálculo
   para que todos los dispositivos vean los mismos torneos. ---- */
function tzCargar(){
  if(tzCache!==null) return tzCache;
  try{ var raw=localStorage.getItem(TZ_KEY); tzCache=raw?JSON.parse(raw):[]; }
  catch(e){ tzCache=[]; }
  return tzCache;
}
function tzGuardar(lista){
  tzCache=lista;
  try{ localStorage.setItem(TZ_KEY,JSON.stringify(lista)); }catch(e){}
  if(TORNEOS.ENDPOINT){
    fetch(TORNEOS.ENDPOINT,{method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({tipo:"torneos",clave:tzClaveOK,actualizado:new Date().toISOString(),data:lista})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j||!j.ok) showModal("No se guardó en la hoja",
          esc((j&&j.error)||"Respuesta no válida.")+"<br>El cambio quedó solo en este navegador. Sal del panel, vuelve a entrar con la clave e inténtalo de nuevo.",
          "Entendido",function(){});
      })
      .catch(function(){
        showModal("Sin conexión","El cambio quedó solo en este navegador. Revisa tu conexión y vuelve a guardarlo.","Entendido",function(){});
      });
  }
}
function tzSincronizar(){
  if(!TORNEOS.ENDPOINT) return;
  fetch(TORNEOS.ENDPOINT+(TORNEOS.ENDPOINT.indexOf("?")>=0?"&":"?")+"accion=torneos")
    .then(function(r){ return r.json(); })
    .then(function(json){
      if(json&&json.ok&&Array.isArray(json.data)){
        tzCache=json.data;
        try{ localStorage.setItem(TZ_KEY,JSON.stringify(json.data)); }catch(e){}
        if($("#body_torneos")) renderTorneos();
      }
    })
    .catch(function(){ /* sin internet: seguimos con la copia local guardada */ });
}
function tzIdNuevo(prefijo){ return prefijo+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,6); }
function tzBuscar(lista,id){ for(var i=0;i<lista.length;i++){ if(lista[i].id===id) return lista[i]; } return null; }

/* ---- generación del fixture: todos contra todos, sin fechas (método del círculo) ---- */
function tzGenerarFixture(equiposOriginales){
  var eq=equiposOriginales.slice();
  var conDescanso=false;
  if(eq.length%2===1){ eq.push("Descansa"); conDescanso=true; }
  var n=eq.length, rondas=n-1, mitad=n/2, arr=eq.slice(), jornadas=[];
  for(var r=0;r<rondas;r++){
    var partidos=[];
    for(var i=0;i<mitad;i++){
      var a=arr[i], b=arr[n-1-i];
      if(a!=="Descansa"&&b!=="Descansa"){
        partidos.push({ id:tzIdNuevo("p"), equipoA:a, equipoB:b });
      }
    }
    jornadas.push({ jornada:r+1, partidos:partidos });
    var ultimo=arr.pop(); arr.splice(1,0,ultimo);
  }
  return jornadas;
}

/* ---- tabla de posiciones (calculada a partir de los resultados) ---- */
function tzPosiciones(t){
  var stats={};
  (t.equipos||[]).forEach(function(eq){ stats[eq]={equipo:eq,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0}; });
  (t.fixture||[]).forEach(function(j){
    j.partidos.forEach(function(p){
      var r=(t.resultados||{})[p.id];
      if(!r||!r.jugado) return;
      var a=stats[p.equipoA], b=stats[p.equipoB];
      if(!a||!b) return;
      a.pj++; b.pj++; a.gf+=r.marcadorA; a.gc+=r.marcadorB; b.gf+=r.marcadorB; b.gc+=r.marcadorA;
      if(r.marcadorA>r.marcadorB){ a.pg++; b.pp++; }
      else if(r.marcadorA<r.marcadorB){ b.pg++; a.pp++; }
      else { a.pe++; b.pe++; }
    });
  });
  var arr=Object.keys(stats).map(function(k){ return stats[k]; });
  arr.forEach(function(e){
    var ptsEmpate=(t.deporte==="Microfútbol")?e.pe:0;
    e.pts=e.pg*2+ptsEmpate; e.dif=e.gf-e.gc;
  });
  arr.sort(function(x,y){ return y.pts-x.pts || y.dif-x.dif || y.gf-x.gf; });
  return arr;
}
function tzEtiquetaGol(deporte){ return deporte==="Baloncesto"?"Pts":(deporte==="Voleibol"?"Sets":"Goles"); }

/* ---- texto de detalle de un resultado ya jugado ---- */
function tzDetalleTexto(t,r){
  if(!r||!r.detalle) return "";
  var d=r.detalle;
  if(t.deporte==="Microfútbol"){
    return "1er tiempo "+d.t1a+"-"+d.t1b+" · 2do tiempo "+d.t2a+"-"+d.t2b+
      (d.tarjA||d.tarjB?" · Tarjetas: "+(d.tarjA||0)+"-"+(d.tarjB||0):"");
  }
  if(t.deporte==="Baloncesto"){
    return "Cuartos: "+[d.q1a+"-"+d.q1b,d.q2a+"-"+d.q2b,d.q3a+"-"+d.q3b,d.q4a+"-"+d.q4b].join(", ");
  }
  if(t.deporte==="Voleibol"){
    var sets=(d.sets||[]).filter(function(s){return s.a!==""&&s.b!=="";});
    return sets.length?("Sets: "+sets.map(function(s){return s.a+"-"+s.b;}).join(", ")):"";
  }
  return "";
}

/* ---- planilla de anotaciones (formulario, distinto según el deporte) ---- */
function tzPlanillaHTML(t,p,rExistente){
  var d=(rExistente&&rExistente.detalle)||{};
  var h='<div class="planilla" id="planilla_'+p.id+'">';
  if(t.deporte==="Microfútbol"){
    h+='<div class="qrow"><label>1er tiempo</label>'+
         '<input type="number" min="0" id="m1a_'+p.id+'" value="'+(d.t1a!=null?d.t1a:"")+'" placeholder="'+esc(p.equipoA)+'">'+
         '<input type="number" min="0" id="m1b_'+p.id+'" value="'+(d.t1b!=null?d.t1b:"")+'" placeholder="'+esc(p.equipoB)+'"></div>'+
       '<div class="qrow"><label>2do tiempo</label>'+
         '<input type="number" min="0" id="m2a_'+p.id+'" value="'+(d.t2a!=null?d.t2a:"")+'" placeholder="'+esc(p.equipoA)+'">'+
         '<input type="number" min="0" id="m2b_'+p.id+'" value="'+(d.t2b!=null?d.t2b:"")+'" placeholder="'+esc(p.equipoB)+'"></div>'+
       '<div class="qrow"><label>Tarjetas</label>'+
         '<input type="number" min="0" id="mta_'+p.id+'" value="'+(d.tarjA!=null?d.tarjA:"")+'" placeholder="'+esc(p.equipoA)+'">'+
         '<input type="number" min="0" id="mtb_'+p.id+'" value="'+(d.tarjB!=null?d.tarjB:"")+'" placeholder="'+esc(p.equipoB)+'"></div>';
  } else if(t.deporte==="Baloncesto"){
    ["q1","q2","q3","q4"].forEach(function(q,i){
      h+='<div class="qrow"><label>Cuarto '+(i+1)+'</label>'+
           '<input type="number" min="0" id="b'+q+'a_'+p.id+'" value="'+(d[q+"a"]!=null?d[q+"a"]:"")+'" placeholder="'+esc(p.equipoA)+'">'+
           '<input type="number" min="0" id="b'+q+'b_'+p.id+'" value="'+(d[q+"b"]!=null?d[q+"b"]:"")+'" placeholder="'+esc(p.equipoB)+'"></div>';
    });
  } else { /* Voleibol */
    var sets=d.sets||[{},{},{}];
    for(var i=0;i<5;i++){
      var s=sets[i]||{};
      h+='<div class="setrow"><label>Set '+(i+1)+'</label>'+
           '<input type="number" min="0" id="v'+i+'a_'+p.id+'" value="'+(s.a!=null?s.a:"")+'" placeholder="'+esc(p.equipoA)+'">'+
           '<input type="number" min="0" id="v'+i+'b_'+p.id+'" value="'+(s.b!=null?s.b:"")+'" placeholder="'+esc(p.equipoB)+'"></div>';
    }
  }
  h+='<div style="display:flex;gap:10px;margin-top:4px">'+
       '<button class="btn btn-primary" style="flex:1" onclick="tzGuardarResultado(\''+t.id+'\',\''+p.id+'\')">Guardar resultado</button>'+
       '<button class="btn-sm" onclick="tzTogglePlanilla(null)">Cancelar</button></div>'+
     '</div>';
  return h;
}
function tzTogglePlanilla(pid){ tzPlanillaAbierta=pid; profRenderTorneos(); }

function tzGuardarResultado(tid,pid){
  var lista=tzCargar(), t=tzBuscar(lista,tid); if(!t) return;
  var p=null;
  (t.fixture||[]).forEach(function(j){ j.partidos.forEach(function(x){ if(x.id===pid) p=x; }); });
  if(!p) return;
  var num=function(id){ var v=$("#"+id); if(!v||v.value==="") return 0; return parseInt(v.value,10)||0; };
  var detalle, marcadorA, marcadorB;
  if(t.deporte==="Microfútbol"){
    var t1a=num("m1a_"+pid),t1b=num("m1b_"+pid),t2a=num("m2a_"+pid),t2b=num("m2b_"+pid);
    detalle={t1a:t1a,t1b:t1b,t2a:t2a,t2b:t2b,tarjA:num("mta_"+pid),tarjB:num("mtb_"+pid)};
    marcadorA=t1a+t2a; marcadorB=t1b+t2b;
  } else if(t.deporte==="Baloncesto"){
    var qa=num("bq1a_"+pid)+num("bq2a_"+pid)+num("bq3a_"+pid)+num("bq4a_"+pid);
    var qb=num("bq1b_"+pid)+num("bq2b_"+pid)+num("bq3b_"+pid)+num("bq4b_"+pid);
    detalle={q1a:num("bq1a_"+pid),q1b:num("bq1b_"+pid),q2a:num("bq2a_"+pid),q2b:num("bq2b_"+pid),
             q3a:num("bq3a_"+pid),q3b:num("bq3b_"+pid),q4a:num("bq4a_"+pid),q4b:num("bq4b_"+pid)};
    marcadorA=qa; marcadorB=qb;
  } else {
    var sets=[], setsA=0, setsB=0;
    for(var i=0;i<5;i++){
      var ea=$("#v"+i+"a_"+pid), eb=$("#v"+i+"b_"+pid);
      var va=ea&&ea.value!==""?parseInt(ea.value,10):"", vb=eb&&eb.value!==""?parseInt(eb.value,10):"";
      sets.push({a:va,b:vb});
      if(va!==""&&vb!==""){ if(va>vb) setsA++; else if(vb>va) setsB++; }
    }
    detalle={sets:sets}; marcadorA=setsA; marcadorB=setsB;
  }
  if(!t.resultados) t.resultados={};
  t.resultados[pid]={ jugado:true, marcadorA:marcadorA, marcadorB:marcadorB, detalle:detalle };
  if(t.estado==="Programado") t.estado="En curso";
  tzGuardar(lista);
  tzPlanillaAbierta=null;
  profRenderTorneos();
}

function torneosSetFiltro(d){ tzFiltroDeporte=d; renderTorneos(); }

function renderTorneos(){
  if(!$("#body_torneos")) return; /* la sección aún no está en el DOM */
  tzRenderPublico();
}

/* ---- vista pública (solo lectura) ---- */
function tzRenderPublico(){
  var b=$("#body_torneos"), lista=tzCargar();
  var deportesUsados=DEPORTES_TORNEO.filter(function(d){ return lista.some(function(t){return t.deporte===d;}); });
  var h="";
  if(deportesUsados.length>1){
    h+='<div class="tz-toolbar">'+
      '<button class="'+(tzFiltroDeporte==="Todos"?"on":"")+'" onclick="torneosSetFiltro(\'Todos\')">Todos</button>'+
      deportesUsados.map(function(d){ return '<button class="'+(tzFiltroDeporte===d?"on":"")+'" onclick="torneosSetFiltro(\''+d+'\')">'+esc(d)+'</button>'; }).join("")+
      '</div>';
  }
  var visibles=lista.filter(function(t){ return tzFiltroDeporte==="Todos"||t.deporte===tzFiltroDeporte; });
  if(!visibles.length){
    b.innerHTML=h+construccion("torneos");
    return;
  }
  visibles.forEach(function(t){ h+=tzTarjetaTorneo(t,false); });
  b.innerHTML=h;
}

/* ---- tarjeta de un torneo: encabezado + tabla de posiciones + fixture ---- */
function tzTarjetaTorneo(t,esOrganizador){
  var badgeClase=t.estado==="Finalizado"?"badge-fin":(t.estado==="En curso"?"badge-curso":"badge-prog");
  var h='<div class="gsec"><div class="tz-head"><h2>'+esc(t.nombre)+'</h2>'+
    '<span class="badge '+badgeClase+'">'+esc(t.estado||"Programado")+'</span>'+
    '<span class="pill">'+esc(t.deporte)+'</span></div>'+
    '<p class="psub" style="margin:-4px 0 14px">'+esc(MODALIDAD_TORNEO)+' · '+t.equipos.length+' equipos</p>';

  var pos=tzPosiciones(t), etiqueta=tzEtiquetaGol(t.deporte);
  if(pos.length){
    h+='<table class="tabla"><thead><tr><th></th><th>Equipo</th><th>PJ</th><th>G</th>'+
      (t.deporte==="Microfútbol"?"<th>E</th>":"")+
      '<th>P</th><th>'+etiqueta+' F</th><th>'+etiqueta+' C</th><th>Dif</th><th>Pts</th></tr></thead><tbody>'+
      pos.map(function(e,i){
        return '<tr'+(i===0&&e.pj>0?' class="lead"':'')+'><td class="pos">'+(i+1)+'</td><td class="eq">'+esc(e.equipo)+'</td>'+
          '<td>'+e.pj+'</td><td>'+e.pg+'</td>'+
          (t.deporte==="Microfútbol"?'<td>'+e.pe+'</td>':'')+
          '<td>'+e.pp+'</td><td>'+e.gf+'</td><td>'+e.gc+'</td><td>'+(e.dif>0?"+":"")+e.dif+'</td>'+
          '<td class="pts">'+e.pts+'</td></tr>';
      }).join("")+'</tbody></table>';
  }

  (t.fixture||[]).forEach(function(j){
    h+='<div class="tz-jornada">Jornada '+j.jornada+'</div>';
    j.partidos.forEach(function(p){
      var r=(t.resultados||{})[p.id];
      var jugado=r&&r.jugado;
      h+='<div class="matchcard"><div class="mtop"><span class="mvs">'+esc(p.equipoA)+
        (jugado?' <span class="mres">'+r.marcadorA+' – '+r.marcadorB+'</span> ':' vs. ')+
        esc(p.equipoB)+'</span>'+
        (esOrganizador?'<button class="btn-sm" onclick="tzTogglePlanilla(\''+(tzPlanillaAbierta===p.id?"":p.id)+'\')">'+
          (jugado?"Editar resultado":"Registrar resultado")+'</button>':
          (jugado?'':'<span class="mjor">Por jugar</span>'))+
        '</div>'+
        (jugado?'<div class="tz-detalle">'+esc(tzDetalleTexto(t,r))+'</div>':'')+
        (esOrganizador&&tzPlanillaAbierta===p.id?tzPlanillaHTML(t,p,r):'')+
        '</div>';
    });
  });
  if(!(t.fixture||[]).length) h+='<p class="tz-detalle">Este torneo todavía no tiene fixture generado.</p>';
  h+='</div>';
  return h;
}

/* ---- panel del organizador: se dibuja dentro del Panel del profesor ---- */
function profRenderTorneos(){
  var b=$("#profContenido"); if(!b) return;
  var lista=tzCargar();
  var h='<div class="card pcard tz-select-card"><div class="eyebrow">Nuevo torneo</div>'+
    '<h2 class="ptitle" style="font-size:20px;margin-bottom:12px">Crear torneo interclases</h2>'+
    '<div class="field"><label for="tzNombre">Nombre del torneo</label>'+
    '<input id="tzNombre" type="text" placeholder="Ej. Copa Interclases de Voleibol — Periodo 2"></div>'+
    '<div class="field"><label for="tzDeporte">Deporte</label><select id="tzDeporte">'+
    DEPORTES_TORNEO.map(function(d){ return '<option>'+esc(d)+'</option>'; }).join("")+'</select></div>'+
    '<div class="field tz-teamform"><label for="tzEquipos">Equipos participantes (uno por línea)</label>'+
    '<textarea id="tzEquipos" placeholder="6-1&#10;6-2&#10;7-1&#10;7-2"></textarea></div>'+
    '<div class="err" id="tzCrearErr"></div>'+
    '<button class="btn btn-primary" style="width:100%" onclick="tzCrearTorneo()">Crear torneo y generar fixture</button>'+
    '</div>';

  if(!lista.length){
    h+='<div class="tz-empty-org">Todavía no has creado ningún torneo. Usa el formulario de arriba para crear el primero.</div>';
  } else {
    h+='<div class="eyebrow" style="margin:22px 0 4px">Torneos creados</div>';
    lista.slice().reverse().forEach(function(t){
      h+='<div style="position:relative">'+tzTarjetaTorneo(t,true)+
        '<div style="display:flex;gap:10px;margin:-10px 0 24px">'+
        '<select onchange="tzCambiarEstado(\''+t.id+'\',this.value)" style="max-width:180px">'+
          ["Programado","En curso","Finalizado"].map(function(s){
            return '<option'+(t.estado===s?" selected":"")+'>'+s+'</option>';
          }).join("")+'</select>'+
        '<button class="btn-sm" onclick="tzRegenerarFixture(\''+t.id+'\')">Regenerar fixture</button>'+
        '<button class="btn-sm btn-sm-bad" onclick="tzEliminarTorneo(\''+t.id+'\')">Eliminar torneo</button>'+
        '</div></div>';
    });
  }
  b.innerHTML=h;
}

function tzCrearTorneo(){
  var nombre=($("#tzNombre").value||"").trim();
  var deporte=$("#tzDeporte").value;
  var equipos=($("#tzEquipos").value||"").split("\n").map(function(s){return s.trim();}).filter(Boolean);
  equipos=equipos.filter(function(v,i){ return equipos.indexOf(v)===i; }); /* sin duplicados */
  if(!nombre||equipos.length<2){
    $("#tzCrearErr").textContent="Escribe un nombre y al menos 2 equipos.";
    return;
  }
  $("#tzCrearErr").textContent="";
  var t={ id:tzIdNuevo("tz"), nombre:nombre, deporte:deporte, modalidad:MODALIDAD_TORNEO,
    equipos:equipos, fixture:tzGenerarFixture(equipos), resultados:{}, estado:"Programado",
    creado:new Date().toISOString() };
  var lista=tzCargar(); lista.push(t); tzGuardar(lista);
  profRenderTorneos();
}
function tzRegenerarFixture(tid){
  if(!confirm("Esto borra los resultados registrados y crea un fixture nuevo. ¿Continuar?")) return;
  var lista=tzCargar(), t=tzBuscar(lista,tid); if(!t) return;
  t.fixture=tzGenerarFixture(t.equipos); t.resultados={}; t.estado="Programado";
  tzGuardar(lista); profRenderTorneos();
}
function tzCambiarEstado(tid,estado){
  var lista=tzCargar(), t=tzBuscar(lista,tid); if(!t) return;
  t.estado=estado; tzGuardar(lista); profRenderTorneos();
}
function tzEliminarTorneo(tid){
  if(!confirm("¿Eliminar este torneo y todos sus resultados? Esta acción no se puede deshacer.")) return;
  var lista=tzCargar().filter(function(t){ return t.id!==tid; });
  tzGuardar(lista); profRenderTorneos();
}

/* ====== PANEL DEL PROFESOR (unificado) ======
   Un solo punto de entrada, con una sola clave, para las tareas
   administrativas de la página: Torneos, Evaluaciones y Diario.
   Antes cada una tenía su propia pantalla y su propia clave por separado;
   ahora comparten el mismo candado (profDesbloqueado más abajo) y viven
   como pestañas dentro de esta única pantalla.                            */
var profTab="torneos"; // "torneos" | "evaluaciones" | "diario"

function profDesbloqueado(){ try{ return sessionStorage.getItem(PROF_SESSION_KEY)==="1"; }catch(e){ return false; } }

function irAProfesor(tab){
  if(tab) profTab=tab;
  go("profesor");
  renderProfesor();
}

function profIntentarEntrar(){
  var v=$("#profClave").value||"", err=$("#profClaveErr");
  if(!v){ err.textContent="Escribe la clave."; return; }
  if(!CONFIG.ENDPOINT){ err.textContent="Falta configurar CONFIG.ENDPOINT."; return; }
  err.textContent="Verificando…";
  fetch(CONFIG.ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({tipo:"login",clave:v})})
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(j&&j.ok){
        tzClaveOK=v;
        try{ sessionStorage.setItem(PROF_SESSION_KEY,"1"); sessionStorage.setItem("jmrp_prof_clave",v); }catch(e){}
        renderProfesor();
      } else { err.textContent="Clave incorrecta."; }
    })
    .catch(function(){ err.textContent="No se pudo verificar la clave. Revisa tu conexión e inténtalo de nuevo."; });
}
function profSalirTodo(){ try{ sessionStorage.removeItem(PROF_SESSION_KEY); sessionStorage.removeItem("jmrp_prof_clave"); }catch(e){} tzClaveOK=""; renderProfesor(); }

function renderProfesor(){
  var b=$("#body_profesor"); if(!b) return;
  if(!profDesbloqueado()){
    b.innerHTML='<div class="tz-lock"><div class="ico">'+ICONOS.evaluaciones+'</div>'+
      '<h3 style="font-family:var(--serif);font-size:19px;margin-bottom:6px">Acceso del profesor</h3>'+
      '<p class="psub" style="margin-bottom:16px">Una sola clave para administrar torneos, evaluaciones y diario.</p>'+
      '<div class="field"><input id="profClave" type="password" placeholder="Clave de acceso" autocomplete="off" '+
        'onkeydown="if(event.key===\'Enter\')profIntentarEntrar()"></div>'+
      '<div class="err" id="profClaveErr"></div>'+
      '<button class="btn btn-primary" style="width:100%" onclick="profIntentarEntrar()">Entrar</button></div>';
    return;
  }
  var tabs=[["torneos","Torneos"],["evaluaciones","Evaluaciones"],["diario","Diario"]];
  var h='<div style="display:flex;justify-content:flex-end;margin-bottom:6px">'+
    '<button class="btn-logout" onclick="profSalirTodo()">Salir del panel</button></div>'+
    '<div class="tz-toolbar">'+tabs.map(function(t){
      return '<button class="'+(profTab===t[0]?"on":"")+'" onclick="irAProfesor(\''+t[0]+'\')">'+t[1]+'</button>';
    }).join("")+'</div>'+
    '<div id="profContenido"></div>';
  b.innerHTML=h;
  if(profTab==="torneos") profRenderTorneos();
  else if(profTab==="evaluaciones") renderCargar("#profContenido");
  else if(profTab==="diario") profRenderDiario();
}

function profRenderDiario(){
  var b=$("#profContenido"); if(!b) return;
  b.innerHTML='<div class="card pcard"><div class="eyebrow">Diario de actividad física</div>'+
    '<h2 class="ptitle" style="font-size:20px;margin-bottom:10px">Registros de los estudiantes</h2>'+
    (DIARIO.ENDPOINT
      ? '<p class="psub">Cada registro que guarda un estudiante llega a la pestaña <b>Diario</b> de la hoja <i>Evidencias Educación Física — JMRP</i>. Ábrela para revisar los minutos por estudiante y por semana (puedes filtrar por grado, grupo o documento).</p>'
      : '<p class="psub">Todavía no conectaste una hoja de cálculo para el Diario (<code>DIARIO.ENDPOINT</code> está vacío en el código). Mientras tanto, cada estudiante guarda sus minutos solo en su propio navegador y no puedes verlos desde aquí. Si quieres centralizarlos como ya funciona con Torneos, dime y preparamos el mismo tipo de backend (un Code.gs y una hoja de cálculo).</p>')+
    '</div>';
}

/* ====== DIARIO DE ACTIVIDAD FÍSICA ====== */
var diarioUser=null; /* {nombre,documento,grado,grupo} */

/* ---- localStorage helpers ---- */
function dKey(doc){ return "diario_"+doc; }
function dProfile(doc){ return "diario_profile_"+doc; }
function dLoadEntries(doc){
  try{ return JSON.parse(localStorage.getItem(dKey(doc)))||[]; }catch(e){ return []; }
}
function dSaveEntry(doc,entry){
  var arr=dLoadEntries(doc); arr.push(entry);
  localStorage.setItem(dKey(doc),JSON.stringify(arr));
}
function dLoadProfile(doc){
  try{ return JSON.parse(localStorage.getItem(dProfile(doc))); }catch(e){ return null; }
}
function dSaveProfile(p){
  localStorage.setItem(dProfile(p.documento),JSON.stringify(p));
}

/* ---- sincronización con la hoja (Apps Script de Evidencias y Diario) ---- */
function dPost(body){
  return fetch(DIARIO.ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})
    .then(function(r){ return r.json(); });
}
function dMarcarEnviado(doc,id){
  var arr=dLoadEntries(doc);
  arr.forEach(function(e){ if(e.id===id) e.enviado=true; });
  try{ localStorage.setItem(dKey(doc),JSON.stringify(arr)); }catch(e){}
}
function dEnviar(u,entry){
  if(!DIARIO.ENDPOINT) return;
  dPost({tipo:"diario",id:entry.id,timestamp:entry.timestamp,nombre:u.nombre,documento:u.documento,
    grado:u.grado,grupo:u.grupo,fecha:entry.fecha,hora:entry.hora,actividad:entry.actividad,
    minutos:entry.minutos,intensidad:entry.intensidad,nota:entry.nota})
    .then(function(j){ if(j&&j.ok) dMarcarEnviado(u.documento,entry.id); })
    .catch(function(){});
}
var dSincronizado={};
function dSincronizar(u){
  if(!DIARIO.ENDPOINT||dSincronizado[u.documento]) return;
  dSincronizado[u.documento]=true;
  /* 1) reenvía lo que no alcanzó a llegar (incluye registros de antes de 2027) */
  dLoadEntries(u.documento).forEach(function(e){ if(e.enviado!==true) dEnviar(u,e); });
  /* 2) trae lo registrado desde otros dispositivos */
  dPost({tipo:"diario_historial",documento:u.documento,nombre:u.nombre})
    .then(function(j){
      if(!j||!j.ok||!Array.isArray(j.data)) return;
      var arr=dLoadEntries(u.documento), ids={};
      arr.forEach(function(e){ ids[e.id]=true; });
      var nuevos=j.data.filter(function(e){ return !ids[e.id]; })
        .map(function(e){ e.enviado=true; e.foto=null; return e; });
      if(!nuevos.length) return;
      try{ localStorage.setItem(dKey(u.documento),JSON.stringify(arr.concat(nuevos))); }catch(e){}
      if(diarioUser&&diarioUser.documento===u.documento) renderDiario();
    })
    .catch(function(){});
}

/* ---- helpers de fecha ---- */
function dToday(){ return new Date().toISOString().slice(0,10); }
function dWeekDates(){
  var d=new Date(), day=d.getDay(), diff=d.getDate()-day+(day===0?-6:1);
  var mon=new Date(d); mon.setDate(diff);
  var out=[];
  for(var i=0;i<7;i++){
    var dd=new Date(mon); dd.setDate(mon.getDate()+i);
    out.push(dd.toISOString().slice(0,10));
  }
  return out;
}
var DIAS_SEM=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function renderDiario(){
  var b=$("#body_diario"), h=borrador("diario");
  if(!DIARIO.activo){
    b.innerHTML=h+construccion("diario"); return;
  }
  /* Si no hay sesión activa, mostrar login */
  if(!diarioUser){
    var saved=sessionStorage.getItem("diario_session");
    if(saved){ try{ diarioUser=JSON.parse(saved); }catch(e){} }
  }
  if(!diarioUser){ dLoginScreen(b,h); return; }
  dDashboard(b,h);
}

/* ---- PANTALLA 1: Login / Registro ---- */
function dLoginScreen(b,hdr){
  b.innerHTML=hdr+
    '<div class="card pcard diario-login">'+
      '<div class="eyebrow">Identifícate para comenzar</div>'+
      '<h2 class="ptitle" style="font-size:22px;margin-bottom:4px">Mi diario de actividad física</h2>'+
      '<p class="sub">Ingresa tu número de documento. Si es tu primera vez, te pediremos tus datos.</p>'+
      '<div class="field"><label for="dLoginDoc">Número de documento</label>'+
        '<input id="dLoginDoc" type="text" inputmode="numeric" placeholder="Solo números" autocomplete="off"></div>'+
      '<div class="err" id="dLoginErr"></div>'+
      '<button class="btn btn-primary" style="width:100%" id="dLoginBtn">Entrar a mi diario</button>'+
      '<div class="aviso" style="margin-top:14px">Tus registros se guardan en este dispositivo y en la hoja privada del área de Educación Física, solo con fines académicos, conforme a la Ley 1581 de 2012. Si entras desde otro dispositivo, usa el mismo documento y tu mismo primer nombre para recuperar tu historial.</div>'+
    '</div>';
  $("#dLoginBtn").addEventListener("click",function(){
    var doc=$("#dLoginDoc").value.trim();
    if(!/^[0-9]{5,12}$/.test(doc)){ $("#dLoginErr").textContent="Escribe un documento válido (solo números, mínimo 5 dígitos)."; return; }
    var prof=dLoadProfile(doc);
    if(prof){ diarioUser=prof; sessionStorage.setItem("diario_session",JSON.stringify(prof)); renderDiario(); }
    else { dRegisterScreen(b,doc); }
  });
}

/* ---- PANTALLA 1b: Registro de perfil ---- */
function dRegisterScreen(b,doc){
  b.innerHTML=
    '<div class="card pcard diario-login">'+
      '<div class="eyebrow">Primera vez · documento '+esc(doc)+'</div>'+
      '<h2 class="ptitle" style="font-size:22px;margin-bottom:4px">Completa tu perfil</h2>'+
      '<p class="sub">Solo la primera vez. Después entras directo con tu documento.</p>'+
      '<div class="field"><label for="dRegName">Nombre completo</label><input id="dRegName" type="text" placeholder="Nombres y apellidos" autocomplete="off"></div>'+
      '<div class="row2">'+
        '<div class="field"><label for="dRegGrado">Grado</label><select id="dRegGrado">'+
          '<option value="">Elige…</option>'+
          '<option>Preescolar</option><option>1.°</option><option>2.°</option><option>3.°</option><option>4.°</option><option>5.°</option>'+
          '<option>6.°</option><option>7.°</option><option>8.°</option><option>9.°</option><option>10.°</option><option>11.°</option>'+
        '</select></div>'+
        '<div class="field"><label for="dRegGrupo">Grupo</label><input id="dRegGrupo" type="text" placeholder="Ej.: 1, 2, 3" autocomplete="off"></div>'+
      '</div>'+
      '<div class="err" id="dRegErr"></div>'+
      '<div style="display:flex;gap:12px">'+
        '<button class="btn-ghost" id="dRegBack">Volver</button>'+
        '<button class="btn btn-primary" style="flex:1" id="dRegBtn">Crear mi diario</button>'+
      '</div>'+
    '</div>';
  $("#dRegBack").addEventListener("click",function(){ diarioUser=null; renderDiario(); });
  $("#dRegBtn").addEventListener("click",function(){
    var nm=$("#dRegName").value.trim(), gr=$("#dRegGrado").value, gp=$("#dRegGrupo").value.trim();
    if(nm.length<5||!gr||!gp){ $("#dRegErr").textContent="Completa todos los campos."; return; }
    var p={nombre:nm,documento:doc,grado:gr,grupo:gp};
    dSaveProfile(p);
    diarioUser=p; sessionStorage.setItem("diario_session",JSON.stringify(p));
    renderDiario();
  });
}

/* ---- PANTALLA 2: Dashboard ---- */
function dDashboard(b,hdr){
  var u=diarioUser;
  dSincronizar(u);
  var entries=dLoadEntries(u.documento);
  var init=u.nombre.split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();

  /* Calcular resumen semanal */
  var weekDates=dWeekDates(), today=dToday();
  var weekMap={}; weekDates.forEach(function(d){ weekMap[d]=0; });
  entries.forEach(function(e){ if(weekMap[e.fecha]!=null) weekMap[e.fecha]+=e.minutos; });
  var weekTotal=0; weekDates.forEach(function(d){ weekTotal+=weekMap[d]; });
  var pct=Math.min(100,Math.round(weekTotal/DIARIO.meta*100));

  /* Entradas de hoy */
  var todayEntries=entries.filter(function(e){ return e.fecha===today; });

  b.innerHTML=hdr+
    '<div class="diario-dash">'+
      /* Cabecera */
      '<div class="diario-head">'+
        '<div class="avatar">'+esc(init)+'</div>'+
        '<div class="info"><div class="dn">'+esc(u.nombre)+'</div><div class="dg">'+esc(u.grado)+' · Grupo '+esc(u.grupo)+' · Doc. '+esc(u.documento)+'</div></div>'+
        '<button class="btn-logout" id="dLogout">Cerrar sesión</button>'+
      '</div>'+

      /* Tabs */
      '<div class="tabs-diario">'+
        '<button class="tab-d on" data-tab="registrar">Registrar</button>'+
        '<button class="tab-d" data-tab="semana">Mi semana</button>'+
        '<button class="tab-d" data-tab="historial">Historial</button>'+
      '</div>'+

      '<div id="dTabContent"></div>'+
    '</div>';

  /* Tab logic */
  var tabs=b.querySelectorAll(".tab-d");
  tabs.forEach(function(t){
    t.addEventListener("click",function(){
      tabs.forEach(function(x){ x.classList.remove("on"); });
      t.classList.add("on");
      var tab=t.getAttribute("data-tab");
      if(tab==="registrar") dTabRegistrar(u,entries);
      else if(tab==="semana") dTabSemana(u,entries,weekDates,weekMap,weekTotal,pct,today);
      else dTabHistorial(u,entries);
    });
  });
  dTabRegistrar(u,entries);

  $("#dLogout").addEventListener("click",function(){
    diarioUser=null; sessionStorage.removeItem("diario_session"); renderDiario();
  });
}

/* ---- TAB: Registrar actividad ---- */
function dTabRegistrar(u,entries){
  var c=$("#dTabContent"), today=dToday();
  var todayEntries=entries.filter(function(e){ return e.fecha===today; });
  var todayMin=0; todayEntries.forEach(function(e){ todayMin+=e.minutos; });

  c.innerHTML=
    '<div class="card pcard" style="max-width:560px">'+
      '<div class="eyebrow">Registro de actividad</div>'+
      '<h2 class="ptitle" style="font-size:20px;margin-bottom:12px">¿Qué hiciste hoy?</h2>'+
      (todayEntries.length?'<p style="font-size:13px;color:var(--green-d);font-weight:600;margin-bottom:14px">Hoy llevas '+todayMin+' minutos en '+todayEntries.length+' actividad(es)</p>':'')+
      '<div class="field"><label for="dAct2">Actividad realizada</label><input id="dAct2" type="text" placeholder="Fútbol, caminata, baile, gimnasio…" autocomplete="off"></div>'+
      '<div class="row2">'+
        '<div class="field"><label for="dFecha2">Fecha</label><input id="dFecha2" type="date"></div>'+
        '<div class="field"><label for="dHora2">Hora de la actividad</label><input id="dHora2" type="time"></div>'+
      '</div>'+
      '<div class="row2">'+
        '<div class="field"><label for="dMin2">Minutos</label><input id="dMin2" type="text" inputmode="numeric" placeholder="Ej.: 30"></div>'+
        '<div class="field"><label for="dInt2">Intensidad</label><select id="dInt2"><option>Suave</option><option selected>Moderada</option><option>Fuerte</option></select></div>'+
      '</div>'+
      '<div class="field"><label for="dNota2">Nota o comentario (opcional)</label><input id="dNota2" type="text" placeholder="¿Cómo te sentiste?" autocomplete="off"></div>'+
      '<div class="field"><label for="dFoto2">Foto de la actividad (opcional)</label><input id="dFoto2" type="file" accept="image/*"></div>'+
      '<img class="photo-preview" id="dFotoPreview" alt="Vista previa">'+
      '<div class="err" id="dErr2"></div>'+
      '<button class="btn btn-primary" style="width:100%;margin-top:6px" id="dSend2">Guardar en mi diario</button>'+
    '</div>';

  $("#dFecha2").value=today;
  var now=new Date(); $("#dHora2").value=("0"+now.getHours()).slice(-2)+":"+("0"+now.getMinutes()).slice(-2);

  /* Preview foto */
  $("#dFoto2").addEventListener("change",function(){
    var file=this.files[0], prev=$("#dFotoPreview");
    if(!file){ prev.style.display="none"; return; }
    var r=new FileReader();
    r.onload=function(){ prev.src=r.result; prev.style.display="block"; };
    r.readAsDataURL(file);
  });

  /* Guardar */
  $("#dSend2").addEventListener("click",function(){
    var act=$("#dAct2").value.trim(), mi=$("#dMin2").value.trim(),
        fecha=$("#dFecha2").value, hora=$("#dHora2").value,
        int2=$("#dInt2").value, nota=$("#dNota2").value.trim();
    if(!act||!/^[0-9]{1,3}$/.test(mi)){
      $("#dErr2").textContent="Escribe la actividad y los minutos (solo números)."; return;
    }
    $("#dErr2").textContent="";
    var btn=$("#dSend2"); btn.disabled=true; btn.textContent="Guardando…";

    var saveEntry=function(fotoData){
      var entry={
        id:Date.now()+"_"+Math.random().toString(36).slice(2,6),
        timestamp:new Date().toISOString(),
        fecha:fecha, hora:hora,
        actividad:act, minutos:parseInt(mi,10),
        intensidad:int2, nota:nota,
        foto:fotoData||null
      };
      entry.enviado=false;
      dSaveEntry(u.documento,entry);
      dEnviar(u,entry); /* a la hoja del área; si falla, se reintenta al volver a entrar */

      /* Recargar dashboard */
      renderDiario();
    };

    var fileInput=$("#dFoto2");
    if(fileInput.files&&fileInput.files[0]){
      comprimirFoto(fileInput.files[0],function(result){
        saveEntry(result?result.datos:null);
      });
    } else { saveEntry(null); }
  });
}

/* ---- TAB: Mi semana ---- */
function dTabSemana(u,entries,weekDates,weekMap,weekTotal,pct,today){
  var c=$("#dTabContent");
  var h='<div class="card pcard" style="max-width:560px">'+
    '<div class="eyebrow">Resumen semanal</div>'+
    '<h2 class="ptitle" style="font-size:20px;margin-bottom:4px">'+weekTotal+' / '+DIARIO.meta+' minutos</h2>'+
    '<div class="week-bar"><div class="week-fill" style="width:'+pct+'%"></div></div>'+
    '<div class="week-meta"><span>'+pct+'% de tu meta</span><span>Meta: '+DIARIO.meta+' min/semana</span></div>'+
    '<div class="diario-week">';
  weekDates.forEach(function(d,i){
    var isToday=(d===today);
    h+='<div class="dw-day'+(isToday?" today":"")+'"><div class="wd">'+DIAS_SEM[i]+'</div><div class="wm">'+(weekMap[d]||0)+'</div></div>';
  });
  h+='</div>';
  if(pct>=100) h+='<div class="okmsg" style="margin-top:8px">🎉 ¡Cumpliste tu meta semanal!</div>';
  else if(pct>=60) h+='<p style="font-size:13px;color:var(--gold-d);font-weight:600;margin-top:8px">💪 Vas muy bien, ¡sigue así!</p>';
  h+='</div>';
  c.innerHTML=h;
}

/* ---- TAB: Historial ---- */
function dTabHistorial(u,entries){
  var c=$("#dTabContent");
  if(!entries.length){
    c.innerHTML='<div class="empty"><div class="eico">'+ICONOS.diario+'</div><h3>Sin registros aún</h3><p>Empieza registrando tu primera actividad en la pestaña "Registrar".</p></div>';
    return;
  }
  /* Agrupar por fecha, más reciente primero */
  var byDate={};
  entries.forEach(function(e){
    if(!byDate[e.fecha]) byDate[e.fecha]=[];
    byDate[e.fecha].push(e);
  });
  var fechas=Object.keys(byDate).sort().reverse();

  var h='<p style="font-size:13px;color:var(--muted);margin-bottom:14px">'+entries.length+' registro(s) en total</p>';
  fechas.forEach(function(f){
    var dayTotal=0; byDate[f].forEach(function(e){ dayTotal+=e.minutos; });
    var fd=new Date(f+"T12:00:00"); var ds=fd.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    h+='<div style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
      '<span style="font-family:var(--serif);font-weight:700;font-size:15px;color:var(--green-d);text-transform:capitalize">'+esc(ds)+'</span>'+
      '<span class="pill">'+dayTotal+' min</span></div>';
    byDate[f].forEach(function(e){
      h+='<div class="hist-entry"><div class="he-top"><span class="he-act">'+esc(e.actividad)+'</span>'+
        '<span class="he-date">'+(e.hora||"")+'</span></div>'+
        '<div class="he-row">'+
          '<span>⏱ '+e.minutos+' min</span>'+
          '<span>🔥 '+esc(e.intensidad)+'</span>'+
          (e.nota?'<span>💬 '+esc(e.nota)+'</span>':'')+
        '</div>';
      if(e.foto) h+='<img class="he-img" src="data:image/jpeg;base64,'+e.foto+'" alt="Foto de actividad">';
      h+='</div>';
    });
    h+='</div>';
  });
  c.innerHTML=h;
}

var EXAMS = EXAMS_BASE.slice();
evActualizarExams();
initCrest(); initSelect(); initIdentify(); renderMenu(); route();
