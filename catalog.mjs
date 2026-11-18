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

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function findProducts(query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return products.filter(({ name, strength, form, pack }) => {
    const description = normalize([name, strength, form, pack].join(' '));
    return words.every(word => description.includes(word));
  });
}

export function getOffers(product, branchId, availability, sortBy) {
  const offers = branches.map((branch, index) => ({
    branch,
    price: product.prices[index],
    state: product.states[index],
    priceUpdatedAt: product.prices[index] === null ? null : '2026-10-18T13:00:00Z',
    stockUpdatedAt: product.states[index] === 'unknown' ? null : '2026-10-18T15:30:00Z',
  })).filter(({ branch, state }) =>
    (!branchId || branch.id === branchId) && (!availability || state === availability)
  );
  return sortBy === 'price'
    ? offers.toSorted((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) || 0)
    : offers;
}
