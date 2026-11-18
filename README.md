# FarmaciaRD Web

Demo estática del catálogo público de FarmaciaRD. Incluye búsqueda por presentación, comparación de precios por sucursal, filtros de disponibilidad y fechas independientes para precio e inventario. Los datos son ficticios. El acceso del personal y la edición de inventario quedan pendientes de integrar con la API y el servicio de identidad del proyecto.

La búsqueda y los filtros de ciudad, sucursal y disponibilidad se aplican a las presentaciones y a sus ofertas. La tarjeta cuenta las sucursales disponibles entre las coincidencias y muestra el menor precio publicado para ese conjunto. Los precios de sucursales agotadas o sin confirmar se pueden consultar en la comparación, donde cada presentación tiene su propio orden de sucursales. Las fechas completas se muestran en la hora de República Dominicana. A partir de siete días se señala la antigüedad de los datos de muestra.

## Vista local

Desde esta carpeta, ejecuta `python -m http.server 8000` y abre <http://localhost:8000>. Se requiere conexión para cargar React 19 desde esm.sh. Los módulos ES se sirven directamente, sin compilación.

Ejecuta `node --test catalog.test.mjs` para comprobar la búsqueda, los filtros, los dos ordenamientos, los precios elegibles y la antigüedad de las fechas.

## GitHub Pages

Sube los archivos de esta carpeta a la raíz de un repositorio dedicado de GitHub, incluyendo `.nojekyll`. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. GitHub muestra la URL cuando termina el despliegue.
