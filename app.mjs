import { createElement as h, useDeferredValue, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { branches, findProducts, getOffers, states } from './catalog.mjs';

const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
const date = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
});
const suggestions = ['Acetaminofén', 'Ibuprofeno', 'Loratadina'];

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
      h('summary', null, 'Información de la sucursal'),
      h('p', null, branch.area, ' · ', branch.hours),
      h('p', null, 'Teléfono sin publicar'),
    ),
  );
}

function Filter({ label, value, onChange, options }) {
  return h('label', null, label,
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
      h('summary', null, 'Ver precios por sucursal'),
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
      h('a', { href: './', className: 'brand' }, h('span', { 'aria-hidden': true }, '+'), 'FarmaciaRD'),
      h('a', { href: '#catalogo' }, 'Catálogo'),
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
            h('button', { type: 'submit' }, 'Buscar'),
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
        h('p', { className: 'notice' }, h('strong', null, 'Demostración. '), 'Los empaques, precios, inventarios y sucursales son ficticios.'),
        h('h2', { id: 'catalog-title', tabIndex: -1 }, query.trim() ? 'Resultados de búsqueda' : 'Catálogo de medicamentos'),
        h('div', { className: 'filters' },
          h(Filter, { label: 'Sucursal', value: branch, onChange: setBranch,
            options: [['', 'Todas las sucursales'], ...branches.map(({ id, name }) => [id, name])] }),
          h(Filter, { label: 'Disponibilidad', value: availability, onChange: setAvailability,
            options: [['', 'Todos los estados'], ...Object.entries(states)] }),
          h(Filter, { label: 'Orden por producto', value: sort, onChange: setSort,
            options: [['branch', 'Por sucursal'], ['price', 'Menor precio']] }),
        ),
        h('div', { className: 'results-bar' },
          h('p', { role: 'status' }, results.length, results.length === 1 ? ' presentación' : ' presentaciones'),
          h('button', { type: 'button', onClick: clearFilters }, 'Limpiar filtros'),
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
