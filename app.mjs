import { createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { branches, getFreshness, getOfferFreshness, getResults, products, sortOffers, states } from './catalog.mjs';

const currency = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
const date = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santo_Domingo',
});
const suggestions = [...new Set(products.map(({ name }) => name))].slice(0, 3);
const cities = [...new Set(branches.map(({ city }) => city))];
const defaults = { city: '', branchId: '', availability: '', order: 'name' };

const iconPaths = {
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  close: 'M6 6l12 12M18 6 6 18',
  available: 'M4 12l5 5L20 6',
  out: 'M6 12h12',
  unknown: 'M12 17h.01M9 9a3 3 0 1 1 4.2 2.7c-.7.3-1.2.8-1.2 1.8',
  chevron: 'm6 9 6 6 6-6',
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

function Status({ state, children }) {
  return h('span', { className: 'status ' + state },
    h(Icon, { name: state }), h('span', null, children ?? states[state]),
  );
}

function Timestamp({ label, value, now }) {
  const freshness = getFreshness(value, now);
  return h('div', { className: 'timestamp' },
    h('dt', null, label),
    h('dd', null, freshness
      ? h('time', { dateTime: value }, freshness.label,
        h('small', null, date.format(new Date(value))))
      : 'Fecha de actualización no disponible'),
  );
}

function Offer({ offer, highlight, group, now }) {
  const { branch, price, state, priceUpdatedAt, stockUpdatedAt } = offer;
  const freshness = getOfferFreshness(offer, now);
  const historicalStock = freshness.currentState === 'unknown' && state !== 'unknown';
  const priceNotice = price === null ? null : !freshness.price ? 'Precio sin fecha'
    : freshness.price.stale ? 'Precio antiguo' : null;
  const inventoryNotice = historicalStock
    ? freshness.stock ? 'Inventario antiguo' : 'Inventario sin fecha' : null;
  const updateLabel = inventoryNotice ?? [states[freshness.currentState], priceNotice].filter(Boolean).join(' · ');

  return h('li', { className: 'offer' + (highlight ? ' offer-' + highlight : '') },
    h('details', { className: 'branch-details', name: group },
      h('summary', { className: 'offer-row' + (price === null ? ' offer-row-unpriced' : '') },
        h('span', { className: 'offer-branch' },
          h('strong', null, branch.name),
          h('span', { className: 'offer-location' }, branch.city, ' · ', branch.area),
        ),
        price === null
          ? h('span', { className: 'no-price' }, 'Sin precio publicado')
          : h('span', { className: 'offer-value' },
            h('strong', { className: 'offer-price' }, currency.format(price)),
            highlight && h('small', { className: 'best-label' }, 'Menor registrado')),
        h('span', { className: 'offer-update' },
          h(Status, { state: priceNotice || inventoryNotice ? 'unknown' : freshness.currentState }, updateLabel)),
        h('span', { className: 'offer-toggle' }, 'Ver detalles', h(Icon, { name: 'chevron' })),
      ),
      h('div', { className: 'offer-detail' },
        historicalStock && h('p', null, 'Inventario sin vigencia confirmada. Último estado registrado: ',
          states[state].toLowerCase(), '.'),
        priceNotice && h('p', null, priceNotice, '.'),
        h('dl', { className: 'timestamps' },
          h(Timestamp, { label: 'Precio actualizado', value: priceUpdatedAt, now }),
          h(Timestamp, { label: 'Inventario actualizado', value: stockUpdatedAt, now }),
        ),
        h('p', null, 'Horario de muestra · ', branch.hours),
        h('p', null, 'Teléfono sin publicar'),
      ),
    ),
  );
}

function Select({ label, icon, value, onChange, options }) {
  return h('label', { className: 'field' },
    h('span', { className: 'field-label' }, icon && h(Icon, { name: icon }), label),
    h('select', { value, onChange: event => onChange(event.target.value) },
      options.map(([key, name]) => h('option', { key, value: key }, name)),
    ),
  );
}

function Product({ result, now }) {
  const { product, offers, availableCount, currentCount, bestRecorded, bestCurrent } = result;
  const [offerOrder, setOfferOrder] = useState('price');
  const best = bestCurrent ?? bestRecorded;
  const titleId = 'product-' + product.id;
  const soldOut = offers.every(offer => getOfferFreshness(offer, now).currentState === 'out');
  const status = currentCount ? 'available' : soldOut ? 'out' : 'unknown';
  const availabilityLabel = currentCount
    ? currentCount + (currentCount === 1 ? ' sucursal con inventario reciente' : ' sucursales con inventario reciente')
    : availableCount ? 'Sin disponibilidad vigente confirmada' : states[status];

  return h('article', { className: 'product', 'aria-labelledby': titleId },
    h('div', { className: 'product-heading' },
      h('div', { className: 'product-image', 'data-product': product.id, 'aria-hidden': true }),
      h('div', null,
        h('h3', { id: titleId }, product.name),
        h('p', { className: 'strength' }, product.strength),
        h('p', { className: 'muted' }, product.form, ' · ', product.pack),
      ),
    ),
    h('div', { className: 'product-availability' },
      h(Status, { state: status }, availabilityLabel),
      availableCount !== currentCount && h('p', { className: 'registered-count' },
        'Registro de disponibilidad en ', availableCount, availableCount === 1 ? ' sucursal' : ' sucursales'),
    ),
    h('div', { className: 'product-value' }, best
      ? h('div', null,
        h('p', { className: 'price-label' }, bestCurrent ? 'Menor precio con datos recientes' : 'Menor precio registrado'),
        h('strong', { className: 'product-price' + (bestCurrent ? '' : ' price-recorded') }, currency.format(best.price)),
        h('p', { className: 'best-branch' }, h(Icon, { name: 'pin' }), best.branch.name),
      )
      : h('strong', null, availableCount
        ? 'Sin precio publicado para las sucursales con registro de disponibilidad'
        : 'Sin precio asociado a disponibilidad registrada')),
    h('details', { className: 'comparison' },
      h('summary', { 'aria-label': 'Comparar sucursales para ' + product.name + ' ' + product.strength },
        h(Icon, { name: 'compare' }), 'Comparar sucursales', h(Icon, { name: 'chevron' })),
      h('div', { className: 'comparison-content' },
        !best && h('p', { className: 'comparison-note' }, h(Icon, { name: 'info' }),
          'Ninguna oferta tiene a la vez precio publicado y registro de disponibilidad.'),
        offers.length > 1 && h(Select, { label: 'Ordenar sucursales', value: offerOrder,
          onChange: setOfferOrder, options: [['price', 'Menor precio'], ['name', 'Nombre de sucursal']] }),
        h('ul', { className: 'offers' }, sortOffers(offers, offerOrder).map(offer =>
          h(Offer, { key: offer.branch.id, offer, group: 'offers-' + product.id, now,
            highlight: offer === bestRecorded ? (offer === bestCurrent ? 'best' : 'recorded') : undefined }))),
      ),
    ),
  );
}

function Search({ id, query, setQuery, onSubmit, variant }) {
  const input = useRef(null);

  function clear() {
    setQuery('');
    input.current?.focus();
  }

  return h('form', { role: 'search', 'aria-label': variant === 'hero' ? 'Búsqueda principal' : 'Búsqueda en catálogo',
    className: 'search search-' + variant, onSubmit: event => {
      event.preventDefault();
      onSubmit();
    } },
    h('label', { className: 'sr-only', htmlFor: id }, 'Buscar medicamento por nombre, concentración o presentación'),
    h('div', { className: 'search-field' },
      h(Icon, { name: 'search' }),
      h('input', { id, ref: input, type: 'search', autoComplete: 'off', enterKeyHint: 'search',
        placeholder: 'Ej. acetaminofén 500 mg', value: query,
        onChange: event => setQuery(event.target.value),
        onKeyDown: event => {
          if (event.key === 'Escape' && query) {
            event.preventDefault();
            clear();
          }
        } }),
      query && h('button', { type: 'button', className: 'icon-button', onClick: clear,
        'aria-label': 'Limpiar búsqueda' }, h(Icon, { name: 'close' })),
    ),
    h('button', { type: 'submit', className: variant === 'hero' ? 'button button-primary' : 'button button-secondary' }, 'Buscar'),
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(defaults);
  const [now, setNow] = useState(Date.now);
  const { city, branchId, availability, order } = filters;
  const results = getResults(query, filters, order, now);
  const hasQuery = Boolean(query.trim());
  const hasFilters = Boolean(city || branchId || availability);
  const hasChanges = Boolean(query || hasFilters || order !== defaults.order);
  const branchOptions = branches.filter(branch => !city || branch.city === city);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.dispatchEvent(new Event('catalog-ready'));
    if (window.location.hash !== '#catalogo') return;
    const frame = requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);

  function goTo(id) {
    document.getElementById(id)?.focus();
  }

  function setCity(value) {
    setFilters(previous => ({
      ...previous,
      city: value,
      branchId: branches.some(branch => branch.id === previous.branchId && (!value || branch.city === value))
        ? previous.branchId : '',
    }));
  }

  function changeFilter(key, value) {
    setFilters(previous => ({ ...previous, [key]: value }));
  }

  function clearAll() {
    setQuery('');
    setFilters(defaults);
    goTo('catalog-search');
  }

  return h('div', null,
    h('a', { className: 'skip-link', href: '#catalogo', onClick: () => goTo('catalog-title') }, 'Ir al catálogo'),
    h('header', { className: 'header' }, h('div', { className: 'shell header-inner' },
      h('a', { href: './', className: 'brand' },
        h('img', { src: './logo-web.svg', alt: 'FarmaciaRD, inicio', width: 300, height: 208 })),
      h('nav', { 'aria-label': 'Navegación principal' },
        h('a', { href: '#catalogo', className: 'nav-link', onClick: () => goTo('catalog-title') }, 'Catálogo')),
    )),
    h('main', null,
      h('section', { className: 'hero', 'aria-labelledby': 'title' },
        h('div', { className: 'shell hero-inner' },
          h('h1', { id: 'title' }, 'Encuentra tu medicamento al mejor precio'),
          h('p', { className: 'subtitle' }, 'Compara precios y disponibilidad entre sucursales farmacéuticas de República Dominicana.'),
          h(Search, { id: 'hero-search', query, setQuery, variant: 'hero', onSubmit: () => goTo('results') }),
          h('div', { className: 'suggestions' },
            h('span', null, 'Prueba con'),
            suggestions.map(name => h('button', { key: name, type: 'button', className: 'button chip',
              onClick: () => { setQuery(name); goTo('results'); } }, name)),
          ),
        ),
      ),
      h('section', { id: 'catalogo', className: 'shell catalog', 'aria-labelledby': 'catalog-title' },
        h('h2', { id: 'catalog-title', tabIndex: -1 }, 'Catálogo de medicamentos'),
        h('p', { className: 'notice' }, h(Icon, { name: 'info' }),
          h('span', null, h('strong', null, 'Prototipo académico. '),
            'Los empaques, sucursales, precios e inventarios son ficticios.')),
        h('div', { className: 'catalog-tools' },
          h(Search, { id: 'catalog-search', query, setQuery, variant: 'catalog', onSubmit: () => goTo('results') }),
          h('fieldset', { className: 'filters' },
            h('legend', { className: 'sr-only' }, 'Filtros y orden del catálogo'),
            h(Select, { label: 'Ciudad o zona', icon: 'pin', value: city, onChange: setCity,
              options: [['', 'Todas las ciudades'], ...cities.map(name => [name, name])] }),
            h(Select, { label: 'Sucursal', icon: 'pin', value: branchId, onChange: value => changeFilter('branchId', value),
              options: [['', 'Todas las sucursales'], ...branchOptions.map(({ id, name }) => [id, name])] }),
            h(Select, { label: 'Disponibilidad registrada', icon: 'stock', value: availability,
              onChange: value => changeFilter('availability', value),
              options: [['', 'Todos los estados'], ...Object.entries(states)] }),
            h(Select, { label: 'Orden del catálogo', icon: 'sort', value: order, onChange: value => changeFilter('order', value),
              options: [['name', 'Nombre A–Z'], ['price', 'Menor precio registrado']] }),
          ),
        ),
        h('div', { className: 'results-bar' },
          h('h3', { id: 'results', tabIndex: -1 },
            h('span', { role: 'status' }, results.length, results.length === 1 ? ' presentación' : ' presentaciones',
              hasFilters ? ' con los filtros aplicados' : '')),
          h('button', { type: 'button', className: 'button button-text', disabled: !hasChanges, onClick: clearAll },
            h(Icon, { name: 'reset' }), 'Restablecer todo'),
        ),
        results.length ? h('div', { className: 'products' }, results.map(result =>
          h(Product, { key: result.product.id, result, now })))
          : h('div', { className: 'empty' },
            h(Icon, { name: 'search' }),
            h('h3', null, hasFilters ? 'Ninguna presentación coincide con estos filtros' : 'No encontramos ese medicamento'),
            h('p', null, hasFilters ? 'Cambia la ciudad, la sucursal o la disponibilidad para ampliar la consulta.'
              : 'Revisa el nombre o prueba con la concentración o la presentación.'),
            hasFilters || hasQuery ? h('button', { type: 'button', className: 'button button-primary', onClick: clearAll },
              hasFilters ? 'Restablecer búsqueda y filtros' : 'Limpiar búsqueda') : null,
          ),
      ),
    ),
    h('footer', { className: 'shell footer' }, 'FarmaciaRD · Prototipo académico'),
  );
}

const root = document.getElementById('root');
createRoot(root, {
  onUncaughtError(error) {
    console.error(error);
    document.dispatchEvent(new Event('catalog-load-error'));
  },
}).render(h(App));
