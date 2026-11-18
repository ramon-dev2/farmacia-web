# FarmaciaRD Web

Demo estática del catálogo público de FarmaciaRD. Incluye búsqueda por presentación, comparación de precios por sucursal, filtros de disponibilidad y fechas independientes para precio e inventario. Los datos son ficticios. El acceso del personal y la edición de inventario quedan pendientes de integrar con la API y el servicio de identidad del proyecto.

## Vista local

Desde esta carpeta, ejecuta `python -m http.server 8000` y abre <http://localhost:8000>. Se requiere conexión para cargar React 19 desde esm.sh. Los módulos ES se sirven directamente, sin compilación.

## GitHub Pages

Sube los archivos de esta carpeta a la raíz de un repositorio dedicado de GitHub, incluyendo `.nojekyll`. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`. GitHub muestra la URL cuando termina el despliegue.
