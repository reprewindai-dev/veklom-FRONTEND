const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, listing_id: `listing_${i % 1000}` }));
const all = Array.from({ length: 1000 }, (_, i) => ({ id: `listing_${i}` }));

// Baseline
console.time('baseline');
for (let i = 0; i < 100; i++) {
  items.map(a => {
    return all.find(l => l.id === a.listing_id);
  });
}
console.timeEnd('baseline');

// Optimized
console.time('optimized');
for (let i = 0; i < 100; i++) {
  const allMap = new Map(all.map(l => [l.id, l]));
  items.map(a => {
    return allMap.get(a.listing_id);
  });
}
console.timeEnd('optimized');
