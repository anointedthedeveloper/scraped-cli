module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>scraped-cli API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #e4e4e7;
      min-height: 100vh;
      padding: 48px 24px;
    }

    .container { max-width: 820px; margin: 0 auto; }

    .badge {
      display: inline-block;
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
    }

    h1 {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #fff 40%, #71717a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }

    .subtitle {
      color: #71717a;
      font-size: 1.05rem;
      margin-bottom: 48px;
      line-height: 1.6;
    }

    .subtitle a { color: #a78bfa; text-decoration: none; }
    .subtitle a:hover { text-decoration: underline; }

    h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }

    .section { margin-bottom: 48px; }

    .endpoint {
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #27272a;
    }

    .method {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 5px;
      letter-spacing: 0.05em;
    }

    .get  { background: #14532d; color: #4ade80; }
    .post { background: #1e3a5f; color: #60a5fa; }

    .path {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #e4e4e7;
    }

    .endpoint-body { padding: 20px; }

    .desc { color: #71717a; font-size: 0.9rem; margin-bottom: 16px; line-height: 1.6; }

    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; color: #52525b; font-weight: 500; padding: 6px 12px; border-bottom: 1px solid #27272a; }
    td { padding: 8px 12px; border-bottom: 1px solid #18181b; color: #a1a1aa; vertical-align: top; }
    td:first-child { font-family: 'SF Mono', 'Fira Code', monospace; color: #e4e4e7; }
    td code { background: #18181b; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; color: #a78bfa; }

    pre {
      background: #0d0d0f;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 20px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.82rem;
      line-height: 1.7;
      color: #a1a1aa;
      margin-top: 16px;
    }

    .key   { color: #60a5fa; }
    .str   { color: #4ade80; }
    .num   { color: #fb923c; }
    .bool  { color: #a78bfa; }
    .null  { color: #71717a; }

    .try-it {
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
    }

    .input-row { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }

    input, select {
      background: #0a0a0a;
      border: 1px solid #27272a;
      color: #e4e4e7;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s;
    }

    input { flex: 1; min-width: 200px; }
    input:focus, select:focus { border-color: #a78bfa; }

    button {
      background: #a78bfa;
      color: #0a0a0a;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
      white-space: nowrap;
    }

    button:hover { opacity: 0.85; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }

    #result {
      background: #0d0d0f;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 20px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      line-height: 1.7;
      color: #a1a1aa;
      max-height: 420px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      display: none;
    }

    .status-ok  { color: #4ade80; font-size: 0.8rem; margin-bottom: 8px; }
    .status-err { color: #f87171; font-size: 0.8rem; margin-bottom: 8px; }

    footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid #18181b;
      color: #3f3f46;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    footer a { color: #52525b; text-decoration: none; }
    footer a:hover { color: #a1a1aa; }
  </style>
</head>
<body>
<div class="container">

  <span class="badge">v1.1.0 · REST API</span>
  <h1>scraped-cli API</h1>
  <p class="subtitle">
    Intelligent web data aggregation for people &amp; places.<br/>
    Built by <a href="https://github.com/anointedthedeveloper" target="_blank">anointedthedeveloper</a> ·
    <a href="https://www.npmjs.com/package/scraped-cli" target="_blank">npm package</a>
  </p>

  <!-- ENDPOINTS -->
  <div class="section">
    <h2>Endpoints</h2>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/search?q={query}&amp;type={type}</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Search for a person or place and get aggregated structured data from across the web.</p>
        <table>
          <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>q</td><td>string</td><td>✅ Yes</td><td>The name or place to search for</td></tr>
          <tr><td>type</td><td>string</td><td>No</td><td><code>people</code>, <code>places</code>, or <code>auto</code> (default)</td></tr>
        </table>
      </div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/search</span>
      </div>
      <div class="endpoint-body">
        <p class="desc">Same as GET but accepts a JSON body. Useful when the query contains special characters.</p>
        <table>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>query</td><td>string</td><td>✅ Yes</td><td>The name or place to search for</td></tr>
          <tr><td>type</td><td>string</td><td>No</td><td><code>people</code>, <code>places</code>, or <code>auto</code></td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- EXAMPLES -->
  <div class="section">
    <h2>Examples</h2>

    <p class="desc" style="margin-bottom:12px">Browser / curl</p>
    <pre>GET https://scraped-cli-bl8d.vercel.app/api/search?q=Anointed&type=people

GET https://scraped-cli-bl8d.vercel.app/api/search?q=Lagos+Island&type=places

curl "https://scraped-cli-bl8d.vercel.app/api/search?q=Anointed+Agunloye&type=people"</pre>

    <p class="desc" style="margin-top:24px;margin-bottom:12px">JavaScript (fetch)</p>
    <pre><span class="key">const</span> res = <span class="key">await</span> fetch(
  <span class="str">"https://scraped-cli-bl8d.vercel.app/api/search?q=Anointed&type=people"</span>
);
<span class="key">const</span> data = <span class="key">await</span> res.json();
console.log(data.results);</pre>

    <p class="desc" style="margin-top:24px;margin-bottom:12px">POST request</p>
    <pre><span class="key">const</span> res = <span class="key">await</span> fetch(<span class="str">"https://scraped-cli-bl8d.vercel.app/api/search"</span>, {
  method: <span class="str">"POST"</span>,
  headers: { <span class="str">"Content-Type"</span>: <span class="str">"application/json"</span> },
  body: JSON.stringify({ query: <span class="str">"Anointed Agunloye"</span>, type: <span class="str">"people"</span> })
});
<span class="key">const</span> data = <span class="key">await</span> res.json();</pre>

    <p class="desc" style="margin-top:24px;margin-bottom:12px">Response shape</p>
    <pre>{
  <span class="key">"query"</span>: <span class="str">"Anointed"</span>,
  <span class="key">"type"</span>:  <span class="str">"people"</span>,
  <span class="key">"results"</span>: [
    {
      <span class="key">"name"</span>:      <span class="str">"Anointed Agunloye"</span>,
      <span class="key">"usernames"</span>: [<span class="str">"anointedthedeveloper"</span>],
      <span class="key">"bio"</span>:       <span class="str">"If it compiles, ship it."</span>,
      <span class="key">"location"</span>:  <span class="str">"Nigeria"</span>,
      <span class="key">"phones"</span>:    [],
      <span class="key">"socials"</span>: {
        <span class="key">"github"</span>:  <span class="str">"https://github.com/anointedthedeveloper"</span>,
        <span class="key">"website"</span>: <span class="str">"https://anobyte.online"</span>
      },
      <span class="key">"images"</span>:    [<span class="str">"https://avatars.githubusercontent.com/..."</span>],
      <span class="key">"confidence"</span>: <span class="num">0.63</span>,
      <span class="key">"possibleMatch"</span>: <span class="bool">false</span>
    }
  ]
}</pre>
  </div>

  <!-- TRY IT -->
  <div class="section">
    <h2>Try it live</h2>
    <div class="try-it">
      <div class="input-row">
        <input id="q" type="text" placeholder="e.g. Anointed Agunloye" value="Anointed" />
        <select id="type">
          <option value="auto">auto</option>
          <option value="people" selected>people</option>
          <option value="places">places</option>
        </select>
        <button id="btn" onclick="runSearch()">Search</button>
      </div>
      <div id="status"></div>
      <div id="result"></div>
    </div>
  </div>

  <footer>
    <span>scraped-cli © 2024 anointedthedeveloper</span>
    <span>
      <a href="https://github.com/anointedthedeveloper/scraped-cli" target="_blank">GitHub</a> ·
      <a href="https://www.npmjs.com/package/scraped-cli" target="_blank">npm</a>
    </span>
  </footer>

</div>

<script>
  async function runSearch() {
    const q = document.getElementById('q').value.trim();
    const type = document.getElementById('type').value;
    const btn = document.getElementById('btn');
    const resultEl = document.getElementById('result');
    const statusEl = document.getElementById('status');

    if (!q) return;

    btn.disabled = true;
    btn.textContent = 'Searching…';
    statusEl.innerHTML = '';
    resultEl.style.display = 'none';

    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q) + '&type=' + type);
      const data = await res.json();

      statusEl.innerHTML = res.ok
        ? '<div class="status-ok">✓ ' + res.status + ' OK · ' + (data.results?.length || 0) + ' result(s)</div>'
        : '<div class="status-err">✗ ' + res.status + ' Error</div>';

      resultEl.textContent = JSON.stringify(data, null, 2);
      resultEl.style.display = 'block';
    } catch (e) {
      statusEl.innerHTML = '<div class="status-err">✗ Network error: ' + e.message + '</div>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Search';
    }
  }

  document.getElementById('q').addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });
</script>
</body>
</html>`);
};
