import { createElement as h, useDeferredValue, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { branches, findProducts, getOffers, states } from './catalog.mjs';

const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
const date = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
});
const suggestions = ['Acetaminofén', 'Ibuprofeno', 'Loratadina'];

const iconPaths = {
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  catalog: 'M4 6h16M4 12h16M4 18h16',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  stock: 'M4 7l8-4 8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4m-8 4v10',
  sort: 'M8 4v16m-4-4 4 4 4-4m3-10h5m-5 6h4m-4 6h3',
  compare: 'M6 20v-5m6 5V9m6 11V4M3 20h18',
  reset: 'M4 11a8 8 0 1 1 2 6M4 5v6h6',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 11v5m0-8h.01',
};

function Icon({ name }) {
  return h('svg', { className: 'icon', viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
    strokeLinejoin: 'round', 'aria-hidden': true, focusable: false },
    h('path', { d: iconPaths[name] }),
  );
}

function Timestamp({ label, value }) {
  return h('small', null, label, ' · ', value
    ? h('time', { dateTime: value }, date.format(new Date(value)))
    : 'Sin fecha');
}

function Offer({ offer }) {
  const { branch, price, state, priceUpdatedAt, stockUpdatedAt } = offer;
  return h('article', { className: 'offer' },
    h('div', { className: 'offer-top' },
      h('div', null, h('h4', null, branch.name), h('p', null, branch.city)),
      h('span', { className: 'status ' + state }, states[state]),
    ),
    h('strong', { className: 'price' }, price === null ? 'Precio sin publicar' : currency.format(price)),
    h(Timestamp, { label: 'Precio', value: priceUpdatedAt }),
    h(Timestamp, { label: 'Disponibilidad', value: stockUpdatedAt }),
    h('details', null,
      h('summary', null, h(Icon, { name: 'pin' }), 'Información de la sucursal'),
      h('p', null, branch.area, ' · ', branch.hours),
      h('p', null, 'Teléfono sin publicar'),
    ),
  );
}

function Filter({ label, icon, value, onChange, options }) {
  return h('label', null, h('span', { className: 'filter-label' }, h(Icon, { name: icon }), label),
    h('select', { value, onChange: event => onChange(event.target.value) },
      options.map(([key, name]) => h('option', { key, value: key }, name)),
    ),
  );
}

function Product({ product, offers }) {
  const availablePrices = offers
    .filter(({ state, price }) => state === 'available' && price !== null)
    .map(({ price }) => price);
  const lowest = availablePrices.length ? Math.min(...availablePrices) : null;

  return h('article', { className: 'product' },
    h('div', { className: 'product-image', 'data-product': product.id, 'aria-hidden': true }),
    h('div', { className: 'product-title' },
      h('span', { className: 'product-form' }, product.form),
      h('h3', null, product.name, ' ', product.strength),
      h('p', null, product.pack),
    ),
    h('div', { className: 'product-price' },
      h('strong', null, lowest === null ? 'Sin precio disponible' : 'Desde ' + currency.format(lowest)),
      h('small', null, offers.length, offers.length === 1 ? ' sucursal en la consulta' : ' sucursales en la consulta'),
    ),
    h('details', { className: 'comparison' },
      h('summary', null, h(Icon, { name: 'compare' }), 'Ver precios por sucursal'),
      h('div', { className: 'offers' }, offers.map(offer => h(Offer, { key: offer.branch.id, offer }))),
    ),
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('branch');
  const deferredQuery = useDeferredValue(query);
  const results = findProducts(deferredQuery)
    .map(product => ({ product, offers: getOffers(product, branch, availability, sort) }))
    .filter(({ offers }) => offers.length);

  function clearFilters() {
    setQuery('');
    setBranch('');
    setAvailability('');
    setSort('branch');
  }

  function goToCatalog() {
    document.getElementById('catalog-title').focus();
    document.getElementById('catalogo').scrollIntoView();
  }

  return h('div', null,
    h('header', { className: 'header' }, h('div', { className: 'shell header-inner' },
      h('a', { href: './', className: 'brand' },
        h('img', { src: './logo-web.svg', alt: 'FarmaciaRD', width: 300, height: 208 })),
      h('a', { href: '#catalogo', className: 'nav-link' }, h(Icon, { name: 'catalog' }), 'Catálogo'),
    )),
    h('main', null,
      h('section', { className: 'hero', 'aria-labelledby': 'title' },
        h('div', { className: 'shell hero-inner' },
          h('h1', { id: 'title' }, 'Compara precios de medicamentos'),
          h('p', { className: 'subtitle' }, 'Consulta precios y disponibilidad por sucursal en República Dominicana.'),
          h('form', { role: 'search', className: 'search', onSubmit: event => {
            event.preventDefault();
            goToCatalog();
          } },
            h('label', { className: 'sr-only', htmlFor: 'medicine-search' }, 'Buscar medicamento'),
            h('input', { id: 'medicine-search', type: 'search', placeholder: 'Ej. acetaminofén 500 mg',
              value: query, onChange: event => setQuery(event.target.value) }),
            h('button', { type: 'submit' }, h(Icon, { name: 'search' }), 'Buscar'),
          ),
          h('div', { className: 'suggestions' },
            h('span', null, 'Prueba con'),
            suggestions.map(name => h('button', { key: name, type: 'button', onClick: () => {
              setQuery(name);
              goToCatalog();
            } }, name)),
          ),
        ),
      ),
      h('section', { id: 'catalogo', className: 'shell catalog', 'aria-labelledby': 'catalog-title' },
        h('p', { className: 'notice' }, h(Icon, { name: 'info' }),
          h('span', null, h('strong', null, 'Demostración. '), 'Los empaques, precios, inventarios y sucursales son ficticios.')),
        h('h2', { id: 'catalog-title', tabIndex: -1 }, query.trim() ? 'Resultados de búsqueda' : 'Catálogo de medicamentos'),
        h('div', { className: 'filters' },
          h(Filter, { label: 'Sucursal', icon: 'pin', value: branch, onChange: setBranch,
            options: [['', 'Todas las sucursales'], ...branches.map(({ id, name }) => [id, name])] }),
          h(Filter, { label: 'Disponibilidad', icon: 'stock', value: availability, onChange: setAvailability,
            options: [['', 'Todos los estados'], ...Object.entries(states)] }),
          h(Filter, { label: 'Orden por producto', icon: 'sort', value: sort, onChange: setSort,
            options: [['branch', 'Por sucursal'], ['price', 'Menor precio']] }),
        ),
        h('div', { className: 'results-bar' },
          h('p', { role: 'status' }, results.length, results.length === 1 ? ' presentación' : ' presentaciones'),
          h('button', { type: 'button', onClick: clearFilters }, h(Icon, { name: 'reset' }), 'Limpiar filtros'),
        ),
        results.length ? h('div', { className: 'products' }, results.map(({ product, offers }) =>
          h(Product, { key: product.id, product, offers })))
          : h('p', { className: 'empty' }, 'No encontramos presentaciones con esos filtros.'),
      ),
    ),
    h('footer', { className: 'shell footer' }, 'FarmaciaRD · Demo del catálogo público'),
  );
}

createRoot(document.getElementById('root')).render(h(App));
