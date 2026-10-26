// Same output as https://www.scottmurray.me/kml/circle/ (verified point-for-point):
// spherical destination formula with WGS84 equatorial radius, starting at 1°
// and stepping 1° counter-clockwise. The site adds a 361st point that repeats the
// first to close the ring; we skip it so each circle has exactly 360 unique points.
const EARTH_RADIUS_M = 6378137;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const round6 = (n: number) => Number(n.toFixed(6));

export type Point = { lat: number; lng: number };

export function circlePoints(center: Point, radiusM: number): Point[] {
  const d = radiusM / EARTH_RADIUS_M;
  const lat1 = toRad(center.lat);
  const lng1 = toRad(center.lng);
  const points: Point[] = [];

  for (let i = 1; i <= 360; i++) {
    const bearing = toRad(-i);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    points.push({ lat: round6(toDeg(lat2)), lng: round6(toDeg(lng2)) });
  }
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
