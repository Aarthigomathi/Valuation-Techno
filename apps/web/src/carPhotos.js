// Per-model car photos (violet studio set in /public/cars).
// Harrier & Hector temporarily use the closest matching SUV/MPV photos.
const MAP = [
  ['creta', 'creta'], ['swift', 'swift'], ['innova', 'innova'], ['city', 'city'],
  ['xuv', 'xuv700'], ['nexon', 'nexon'], ['seltos', 'seltos'], ['baleno', 'baleno'],
  ['ecosport', 'ecosport'], ['harrier', 'xuv700'], ['hector', 'innova'],
];
export function carPhotoFor(job) {
  const m = `${job?.make || ''} ${job?.model || ''}`.toLowerCase();
  if (m.includes('i20')) return '/cars/i20.jpg';
  for (const [key, slug] of MAP) if (m.includes(key)) return `/cars/${slug}.jpg`;
  return '/real-car.jpg';
}
