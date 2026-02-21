const { computeNatalChart } = require('./_lib/natalChart');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month, day, hour, minute, latitude, longitude, city, utcOffset } = req.body || {};

  if (!year || !month || !day || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'year, month, day, latitude, and longitude are required.' });
  }

  try {
    const chart = computeNatalChart({
      year,
      month,
      day,
      hour: typeof hour === 'number' ? hour : -1,
      minute: typeof minute === 'number' ? minute : 0,
      latitude,
      longitude,
      city: city || '',
      utcOffset: typeof utcOffset === 'number' ? utcOffset : 0,
    });
    return res.status(200).json({ chart });
  } catch (err) {
    console.error('Natal chart computation error:', err?.message);
    return res.status(500).json({ error: 'Failed to compute natal chart.' });
  }
};
