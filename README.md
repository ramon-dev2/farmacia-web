# FarmaciaRD Web

Demo estática del catálogo público de FarmaciaRD. Incluye búsqueda por presentación, comparación de precios por sucursal, filtros de disponibilidad y fechas independientes para precio e inventario. Los datos son ficticios. El acceso del personal y la edición de inventario quedan pendientes de integrar con la API y el servicio de identidad del proyecto.

La búsqueda y los filtros de ciudad, sucursal y disponibilidad registrada se aplican a las presentaciones y a sus ofertas. Los datos de inventario con siete días o más, o sin fecha, quedan sin vigencia confirmada. El precio destacado exige precio e inventario recientes. Cuando solo hay registros anteriores, se muestra el menor precio publicado con disponibilidad registrada como referencia histórica. El orden del catálogo por precio se basa en ese registro. Cada comparación tiene su propio orden y permite abrir «Ver detalles» para consultar horarios y fechas completas en la hora de República Dominicana.

## Vista local

Desde esta carpeta, ejecuta `python -m http.server 8000` y abre <http://localhost:8000>. Se requiere conexión para cargar React 19 desde esm.sh. Los módulos ES se sirven directamente, sin compilación.

Ejecuta `node --test catalog.test.mjs` para comprobar la búsqueda, los filtros, los dos ordenamientos, los precios elegibles y la antigüedad de las fechas.

## GitHub Pages

Sube los archivos de esta carpeta a la raíz de un repositorio dedicado de GitHub, incluyendo `.nojekyll`. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. GitHub muestra la URL cuando termina el despliegue.
