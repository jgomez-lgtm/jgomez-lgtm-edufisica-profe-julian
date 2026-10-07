# Portal de Educación Física · I.E. Jesús María Rojas Pagola

Qué archivo tocar según lo que necesite cambiar:

| Quiero cambiar… | Archivo |
|---|---|
| Año escolar, grupos por grado | `js/config.js` (bloque del inicio) |
| Botones de la portada, herramientas, recursos, retos | `js/contenidos.js` |
| Preguntas de las evaluaciones incluidas | `js/evaluaciones.js` (las respuestas correctas van en el Apps Script de Evaluaciones, no aquí) |
| Colores y estilos | `css/estilos.css` |
| Escudo o imagen de fondo | `img/escudo.jpg`, `img/fondo.jpg` (mismo nombre) |
| Funcionamiento general | `js/app.js` (normalmente no se toca) |

Abrir o cerrar una evaluación y mostrar la revisión de respuestas se hace en la hoja
de resultados, pestaña **Control evaluaciones** (columnas *Abierta* y *Mostrar revisión*).

Las claves y los datos de los estudiantes NO van en este repositorio (es público):
viven en los Apps Script y en las hojas de Google del área.
