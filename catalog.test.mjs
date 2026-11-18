import assert from 'node:assert/strict';
import test from 'node:test';
import { findProducts, getFreshness, getOfferFreshness, getOffers, getResults, products, sortOffers, summarizeOffers } from './catalog.mjs';

test('busca sin distinguir acentos o mayúsculas y reconoce unidades sin espacio', () => {
  assert.deepEqual(findProducts('ACETAMINOFEN'), findProducts('acetaminofén'));
  assert.deepEqual(findProducts('ACETAMINOFEN 500mg caja').map(({ id }) => id), ['acetaminofen']);
  assert.deepEqual(findProducts('jarabe frasco 60ml').map(({ id }) => id), ['acetaminofen-jarabe']);
  assert.deepEqual(findProducts('20 mg').map(({ id }) => id), ['omeprazol']);
  assert.deepEqual(findProducts('no existe'), []);
});

test('combina búsqueda, ciudad, sucursal y disponibilidad', () => {
  const filters = { city: 'Santiago', branchId: 'norte', availability: 'available' };
  const [result, ...others] = getResults('loratadina', filters, 'name');
  assert.equal(others.length, 0);
  assert.equal(result.availableCount, 1);
  assert.equal(result.bestRecorded.branch.id, 'norte');
  assert.deepEqual(getResults('loratadina', { ...filters, branchId: 'central' }, 'name'), []);
  assert.deepEqual(getResults('loratadina', { ...filters, availability: 'out' }, 'name'), []);
});

test('ordena el catálogo por nombre o mejor precio y deja los precios no elegibles al final', () => {
  const alphabetical = getResults('', {}, 'name');
  assert.equal(alphabetical[0].product.name, 'Acetaminofén');
  assert.equal(alphabetical.at(-1).product.name, 'Omeprazol');
  const byPrice = getResults('', { branchId: 'este' }, 'price');
  assert.deepEqual(byPrice.map(({ bestRecorded }) => bestRecorded?.price ?? null), [165, 230, 245, null, null, null]);
  assert.deepEqual(byPrice.slice(3).map(({ product }) => product.id),
    ['acetaminofen', 'cetirizina', 'loratadina']);
});

test('distingue el orden de ofertas de la selección del menor precio disponible', () => {
  const offers = getOffers(products[0]);
  const [central, east, north] = offers;
  const comparable = [{ ...central, price: null }, { ...east, price: 1 }, north];
  assert.deepEqual(sortOffers(comparable, 'price').map(({ price }) => price), [1, 152, null]);
  assert.deepEqual(sortOffers(comparable, 'name').map(({ branch }) => branch.id), ['central', 'este', 'norte']);
  assert.equal(summarizeOffers(comparable).bestRecorded, north);
  assert.equal(summarizeOffers(comparable).availableCount, 2);
  assert.equal(summarizeOffers(comparable.slice(0, 2)).bestRecorded, null);
});

test('calcula antigüedad por campo y conserva el umbral de siete días', () => {
  const [offer] = getOffers(products[0]);
  const now = Date.parse('2026-10-25T13:00:00Z');
  assert.deepEqual(getFreshness(offer.priceUpdatedAt, now), { label: 'hace 7 días', stale: true });
  assert.deepEqual(getFreshness(offer.stockUpdatedAt, now), { label: 'hace 6 días', stale: false });
  assert.equal(getFreshness(null, now), null);
  assert.equal(getFreshness('sin fecha', now), null);
});

test('separa las ofertas históricas de las ofertas con precio e inventario recientes', () => {
  const [central, east, north] = getOffers(products[0]);
  const now = Date.parse('2026-10-26T00:00:00Z');
  const recent = '2026-10-24T15:30:00Z';
  const noPrice = { ...central, price: null, priceUpdatedAt: null, stockUpdatedAt: recent };
  const freshOut = { ...east, price: 1, priceUpdatedAt: recent, stockUpdatedAt: recent };
  const fresh = { ...north, priceUpdatedAt: recent, stockUpdatedAt: recent };
  const offers = [central, freshOut, fresh, noPrice];
  assert.equal(getOfferFreshness(central, now).currentState, 'unknown');
  assert.equal(getOfferFreshness(freshOut, now).currentState, 'out');
  assert.equal(getOfferFreshness({ ...fresh, stockUpdatedAt: null }, now).currentState, 'unknown');
  assert.deepEqual(summarizeOffers(offers, now), {
    availableCount: 3, currentCount: 2, bestRecorded: central, bestCurrent: fresh,
  });
  assert.equal(summarizeOffers([central, { ...fresh, priceUpdatedAt: central.priceUpdatedAt }], now).bestCurrent, null);
  assert.equal(summarizeOffers([central], now).currentCount, 0);
});
