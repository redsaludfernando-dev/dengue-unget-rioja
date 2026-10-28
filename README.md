# Prevención del dengue 2026 | UNGET Rioja

Página web con lo que se viene haciendo contra el dengue en la jurisdicción de la UNGET Rioja, por distrito:

- **Hallazgos**: índice aédico por localidad y mes, recipientes con larvas y acceso a las viviendas durante la nebulización.
- **Vigilancia y control vectorial**: control larvario por localidad y cercos con nebulización espacial.
- **Promoción de la salud**: recojo de criaderos (consolidado), ordenanzas, comités de vigilancia comunitaria, concurso en escuelas, capacitaciones y actividades con foto.
- **Epidemiología**: acciones de vigilancia epidemiológica.
- **Evidencias**: fotos de campo de las brigadas.

Cada distrito tiene su propio enlace, por ejemplo `?distrito=nueva-cajamarca`. El botón **Imprimir o guardar PDF** genera un reporte del distrito que se está viendo.

## Cómo se actualiza

Los datos salen de la carpeta `D:\REPORTES` y se procesan con `herramientas/actualizar.py`:

1. **Control vectorial**: se siguen llenando los formatos de control larvario, vigilancia y nebulización (`CONTROL VECTORIAL\Formato *.xlsx`).
2. **Promoción de la salud**: se sigue llenando el consolidado `ACTIVIDADES DENGUE 2026 - PROMOCIÓN DE LA SALUD.xlsx` (recojos, concurso, ordenanzas, comités y capacitaciones).
3. **Actividades con foto**: cada actividad nueva es una fila en `WEB\BASE_WEB.xlsx`, hoja **ACTIVIDADES** (fecha, distrito, tipo, descripción, resultado y la carpeta y el nombre de la foto). Las fotos del control vectorial se agregan en la hoja **EVIDENCIAS CV**.
4. En la hoja **CONFIG** se cambia la fecha de corte y la próxima actividad.
5. Se ejecuta `python3 herramientas/actualizar.py`, que regenera `data/datos.js` y las fotos reducidas, y se suben los cambios a este repositorio.

La hoja **AJUSTES** de `BASE_WEB.xlsx` corrige valores de las fuentes sin modificar los archivos originales (por ejemplo, el recojo de Valle de la Conquista del 27/03: 333 t → 5,5 t).

## Privacidad

- No se publican nombres, DNI ni teléfonos de los comités, ni datos de pacientes.
- Las fotos se reducen y se publican sin metadatos ni coordenadas; los sellos de fecha y ubicación de la cámara se recortan.
- No se usan fotos de historias clínicas ni de visitas a pacientes.

## Estructura

```
index.html            página
assets/estilos.css    diseño
assets/app.js         lógica (filtros por distrito, gráficos, tablas)
assets/fuentes/       tipografía Archivo (SIL Open Font License)
data/datos.js         datos generados por herramientas/actualizar.py
img/                  fotos reducidas (a = actividades, e = evidencias, d = afiches)
herramientas/         script de actualización
```

Sitio estático publicado con GitHub Pages; no necesita servidor ni base de datos.
