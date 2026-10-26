// Same output as https://www.scottmurray.me/kml/circle/ (verified point-for-point):
// spherical destination formula with WGS84 equatorial radius, starting at 1°
// and stepping 1° counter-clockwise. The site adds a 361st point that repeats the
// first to close the ring; we skip it so each circle has exactly 360 unique points.
const EARTH_RADIUS_M = 6378137;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const round6 = (n: number) => Number(n.toFixed(6));

export type Point = { lat: number; lng: number };

// Point `distanceM` away from `center` along `bearing` (radians, clockwise from north).
function destination(center: Point, distanceM: number, bearing: number): Point {
  const d = distanceM / EARTH_RADIUS_M;
  const lat1 = toRad(center.lat);
  const lng1 = toRad(center.lng);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: round6(toDeg(lat2)), lng: round6(toDeg(lng2)) };
}

export function circlePoints(center: Point, radiusM: number): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= 360; i++) points.push(destination(center, radiusM, toRad(-i)));
  return points;
}

// Spreads exactly `count` points evenly over the ring-shaped area between innerM and outerM
// (innerM = 0 fills the whole disc). Points sit on concentric rings spaced about as far
// apart as neighbouring points on a ring, so the spacing is roughly the same everywhere.
// Rows go from the inner ring outwards, counter-clockwise on each ring like circlePoints.
export function fillPoints(center: Point, innerM: number, outerM: number, count: number): Point[] {
  const spacing = Math.sqrt((Math.PI * (outerM ** 2 - innerM ** 2)) / count);
  const ringCount = Math.max(1, Math.round((outerM - innerM) / spacing));
  const ringGap = (outerM - innerM) / ringCount;
  const radii = Array.from({ length: ringCount }, (_, j) => innerM + ringGap * (j + 0.5));

  // points per ring proportional to its circumference, rounded so they add up to `count`
  const total = radii.reduce((sum, r) => sum + r, 0);
  const exact = radii.map((r) => (r / total) * count);
  const perRing = exact.map(Math.floor);
  const byRemainder = exact.map((e, j) => [e - perRing[j], j]).sort((a, b) => b[0] - a[0]);
  const missing = count - perRing.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k++) perRing[byRemainder[k][1]]++;

  const points: Point[] = [];
  radii.forEach((r, j) => {
    const n = perRing[j];
    // stagger every other ring by half a step so points don't line up in spokes
    const offset = j % 2 ? 0.5 : 0;
    for (let i = 0; i < n; i++) points.push(destination(center, r, (-2 * Math.PI * (i + 1 + offset)) / n));
  });
  return points;
}

// Accepts "lat, lng" – same order as Google Maps and the scottmurray.me Center field.
export function parseLatLng(input: string): Point | null {
  const parts = input.trim().split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  const [lat, lng] = parts;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
