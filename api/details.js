const { getDetails } = require('../src/search');

// GET  /api/details?name=Anointed+Agunloye&type=people
// POST /api/details  { "name": "Anointed Agunloye", "type": "people" }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let name, type;

    if (req.method === 'POST') {
      ({ name, type = 'people' } = req.body || {});
    } else {
      name = req.query.name;
      type = req.query.type || 'people';
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Missing required parameter: name' });
    }

    const validTypes = ['people', 'places'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Use: ${validTypes.join(', ')}` });
    }

    const result = await getDetails(name.trim(), type);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
