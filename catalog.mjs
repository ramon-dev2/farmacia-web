export const branches = [
  { id: 'central', name: 'Sucursal Central', city: 'Santo Domingo', area: 'Piantini', hours: 'Lun–sáb, 8:00 a. m.–8:00 p. m.' },
  { id: 'este', name: 'Sucursal Este', city: 'Santo Domingo Este', area: 'Alma Rosa', hours: 'Lun–sáb, 8:00 a. m.–7:00 p. m.' },
  { id: 'norte', name: 'Sucursal Norte', city: 'Santiago', area: 'Los Jardines', hours: 'Lun–sáb, 9:00 a. m.–7:00 p. m.' },
];

export const products = [
  { id: 'acetaminofen', name: 'Acetaminofén', strength: '500 mg', form: 'Tabletas', pack: 'Caja de 20', prices: [145, 159, 152], states: ['available', 'out', 'available'] },
  { id: 'ibuprofeno', name: 'Ibuprofeno', strength: '400 mg', form: 'Tabletas', pack: 'Caja de 10', prices: [175, 165, null], states: ['available', 'available', 'unknown'] },
  { id: 'loratadina', name: 'Loratadina', strength: '10 mg', form: 'Tabletas', pack: 'Caja de 10', prices: [210, null, 195], states: ['out', 'unknown', 'available'] },
  { id: 'omeprazol', name: 'Omeprazol', strength: '20 mg', form: 'Cápsulas', pack: 'Caja de 14', prices: [260, 245, 275], states: ['available', 'available', 'out'] },
  { id: 'cetirizina', name: 'Cetirizina', strength: '10 mg', form: 'Tabletas', pack: 'Caja de 10', prices: [190, 205, null], states: ['available', 'out', 'unknown'] },
  { id: 'acetaminofen-jarabe', name: 'Acetaminofén', strength: '160 mg/5 mL', form: 'Jarabe', pack: 'Frasco de 60 mL', prices: [null, 230, 225], states: ['unknown', 'available', 'available'] },
];

export const states = { available: 'Disponible', out: 'Agotado', unknown: 'Sin confirmar' };
const alphabet = new Intl.Collator('es-DO', { sensitivity: 'base', numeric: true });
const relative = new Intl.RelativeTimeFormat('es-DO', { numeric: 'always' });
const day = 24 * 60 * 60 * 1000;
const staleAfterDays = 7;

function normalize(value) {
  const normalized = value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return (normalized.match(/\d+(?:[.,]\d+)?\s*(?:mg|ml|g)\b|\d+(?:[.,]\d+)?|\p{L}+/gu) ?? [])
    .map(token => token.replace(/\s+/g, '').replace(',', '.'));
}

export function findProducts(query) {
  const words = normalize(query);
  return products.filter(({ name, strength, form, pack }) => {
    const description = normalize([name, strength, form, pack].join(' '));
    return words.every(word => description.some(token =>
      /^\d/.test(word)
        ? token === word || (/^\d+(?:\.\d+)?$/.test(word) && token.replace(/[a-z]+$/, '') === word)
        : token.includes(word)
    ));
  });
}

export function getOffers(product, { city = '', branchId = '', availability = '' } = {}) {
  return branches.map((branch, index) => ({
    branch,
    price: product.prices[index],
    state: product.states[index],
    priceUpdatedAt: product.prices[index] === null ? null : '2026-10-18T13:00:00Z',
    stockUpdatedAt: product.states[index] === 'unknown' ? null : '2026-10-18T15:30:00Z',
  })).filter(({ branch, state }) =>
    (!city || branch.city === city) && (!branchId || branch.id === branchId) &&
    (!availability || state === availability)
  );
}

function comparePrices(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function byBranch(a, b) {
  return alphabet.compare(a.branch.name, b.branch.name);
}

export function sortOffers(offers, order) {
  return [...offers].sort((a, b) =>
    (order === 'price' ? comparePrices(a.price, b.price) : 0) || byBranch(a, b)
  );
}

export function getOfferFreshness(offer, now = Date.now()) {
  const price = getFreshness(offer.priceUpdatedAt, now);
  const stock = getFreshness(offer.stockUpdatedAt, now);
  return { price, stock, currentState: stock && !stock.stale ? offer.state : 'unknown' };
}

export function summarizeOffers(offers, now = Date.now()) {
  const available = offers.filter(offer => offer.state === 'available');
  const published = sortOffers(available.filter(offer => offer.price !== null), 'price');
  const bestRecorded = published[0] ?? null;
  const current = available.filter(offer => getOfferFreshness(offer, now).currentState === 'available');
  const bestCurrent = sortOffers(current, 'price').find(offer => {
    const { price } = getOfferFreshness(offer, now);
    return offer.price !== null && price && !price.stale;
  }) ?? null;
  return { availableCount: available.length, currentCount: current.length, bestRecorded, bestCurrent };
}

export function getResults(query, filters, order, now = Date.now()) {
  return findProducts(query)
    .map(product => {
      const offers = getOffers(product, filters);
      return { product, offers, ...summarizeOffers(offers, now) };
    })
    .filter(result => result.offers.length)
    .sort((a, b) =>
      (order === 'price' ? comparePrices(a.bestRecorded?.price ?? null, b.bestRecorded?.price ?? null) : 0) ||
      alphabet.compare(a.product.name, b.product.name) ||
      alphabet.compare(a.product.strength, b.product.strength)
    );
}

export function getFreshness(value, now = Date.now()) {
  const timestamp = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp) || timestamp > now) return null;
  const minutes = Math.floor((now - timestamp) / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor(minutes / 60);
  const label = days ? relative.format(-days, 'day')
    : hours ? relative.format(-hours, 'hour')
    : minutes ? relative.format(-minutes, 'minute') : 'hace menos de un minuto';
  return { label, stale: now - timestamp >= staleAfterDays * day };
}
