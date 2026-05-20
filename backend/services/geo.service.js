function normalizeCoordinates(coordinates) {
  const { lat, lng } = coordinates;

  if (![lat, lng].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new Error('Coordinates must include numeric lat and lng values.');
  }

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  };
}

function calculateDistanceKm(pointA, pointB) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Number((earthRadiusKm * arc).toFixed(3));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

module.exports = {
  calculateDistanceKm,
  normalizeCoordinates
};
