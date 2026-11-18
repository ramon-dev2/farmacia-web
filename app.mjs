import { createElement as h, useDeferredValue, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { branches, findProducts, getOffers, states } from './catalog.mjs';

const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
const date = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
});

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

  return h('div', null,
    h('header', { className: 'header' }, h('div', { className: 'shell header-inner' },
      h('a', { href: './', className: 'brand' }, h('span', { 'aria-hidden': true }, '+'), 'FarmaciaRD'),
      h('a', { href: '#catalogo' }, 'Catálogo'),
    )),
    h('main', null,
      h('section', { className: 'hero', 'aria-labelledby': 'title' },
        h('div', { className: 'shell hero-inner' },
          h('div', null,
            h('p', { className: 'eyebrow' }, 'FARMACIARD / CATÁLOGO'),
            h('h1', { id: 'title' }, 'Encuentra tu medicamento.', h('br'), 'Compara por sucursal.'),
            h('p', { className: 'subtitle' }, 'Consulta el precio, la disponibilidad y cuándo se actualizó cada dato.'),
          ),
          h('div', { className: 'hero-art', 'aria-hidden': true }, h('span', null, '+')),
        ),
      ),
      h('section', { id: 'catalogo', className: 'shell catalog', 'aria-labelledby': 'catalog-title' },
        h('p', { className: 'notice' }, h('strong', null, 'Demostración. '), 'Los precios, inventarios y sucursales son ficticios.'),
        h('h2', { id: 'catalog-title' }, 'Explora el catálogo'),
        h('div', { className: 'filters' },
          h('label', null, 'Buscar medicamento',
            h('input', { type: 'search', placeholder: 'Ej. acetaminofén 500 mg', value: query,
              onChange: event => setQuery(event.target.value) })),
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
        results.length ? results.map(({ product, offers }) =>
          h('section', { className: 'product', key: product.id, 'aria-labelledby': product.id },
            h('div', { className: 'product-title' },
              h('h3', { id: product.id }, product.name, ' ', product.strength),
              h('p', null, product.form, ' · ', product.pack),
            ),
            h('div', { className: 'offers' },
              offers.map(offer => h(Offer, { key: offer.branch.id, offer }))),
          )) : h('p', { className: 'empty' }, 'No encontramos presentaciones con esos filtros.'),
      ),
    ),
    h('footer', { className: 'shell footer' }, 'FarmaciaRD · Demo del catálogo público'),
  );
}

createRoot(document.getElementById('root')).render(h(App));
