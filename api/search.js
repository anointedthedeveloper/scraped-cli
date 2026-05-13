const { aggregateSearch } = require('../src/search');

// Vercel serverless function
// GET  /api/search?q=Anointed&type=people
// POST /api/search  { "query": "Anointed", "type": "people" }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let query, type;

    if (req.method === 'POST') {
      ({ query, type = 'auto' } = req.body || {});
    } else {
      query = req.query.q;
      type = req.query.type || 'auto';
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Missing required parameter: q (query)' });
    }

    const validTypes = ['people', 'places', 'auto'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Use: ${validTypes.join(', ')}` });
    }

    const result = await aggregateSearch(query.trim(), type);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
