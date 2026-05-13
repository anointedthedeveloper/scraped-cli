module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>scraped-cli API</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e4e4e7;min-height:100vh;padding:48px 24px}
.container{max-width:860px;margin:0 auto}
.badge{display:inline-block;background:#18181b;border:1px solid #27272a;color:#a1a1aa;font-size:12px;padding:4px 10px;border-radius:999px;margin-bottom:20px;letter-spacing:.05em}
h1{font-size:2.4rem;font-weight:700;letter-spacing:-.03em;background:linear-gradient(135deg,#fff 40%,#71717a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}
.subtitle{color:#71717a;font-size:1.05rem;margin-bottom:48px;line-height:1.6}
.subtitle a{color:#a78bfa;text-decoration:none}
.subtitle a:hover{text-decoration:underline}
h2{font-size:.9rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px}
.section{margin-bottom:52px}
.endpoint{background:#111113;border:1px solid #27272a;border-radius:12px;overflow:hidden;margin-bottom:14px}
.endpoint-header{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid #27272a}
.method{font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px;letter-spacing:.05em}
.get{background:#14532d;color:#4ade80}.post{background:#1e3a5f;color:#60a5fa}
.path{font-family:'SF Mono','Fira Code',monospace;font-size:.88rem;color:#e4e4e7}
.endpoint-body{padding:20px}
.desc{color:#71717a;font-size:.88rem;margin-bottom:14px;line-height:1.6}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{text-align:left;color:#52525b;font-weight:500;padding:6px 12px;border-bottom:1px solid #27272a}
td{padding:8px 12px;border-bottom:1px solid #18181b;color:#a1a1aa;vertical-align:top}
td:first-child{font-family:'SF Mono','Fira Code',monospace;color:#e4e4e7}
td code{background:#18181b;padding:2px 6px;border-radius:4px;font-size:.78rem;color:#a78bfa}
pre{background:#0d0d0f;border:1px solid #27272a;border-radius:10px;padding:18px;overflow-x:auto;font-family:'SF Mono','Fira Code',monospace;font-size:.8rem;line-height:1.75;color:#a1a1aa;margin-top:14px}
.k{color:#60a5fa}.s{color:#4ade80}.n{color:#fb923c}.b{color:#a78bfa}.cm{color:#52525b}
.tabs{display:flex;gap:4px;margin-bottom:16px}
.tab{background:#18181b;border:1px solid #27272a;color:#71717a;padding:8px 18px;border-radius:8px;font-size:.85rem;cursor:pointer;transition:all .15s}
.tab.active{background:#27272a;color:#e4e4e7;border-color:#3f3f46}
.panel{display:none}.panel.active{display:block}
.try-it{background:#111113;border:1px solid #27272a;border-radius:12px;padding:24px}
.input-row{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
input,select{background:#0a0a0a;border:1px solid #27272a;color:#e4e4e7;padding:10px 14px;border-radius:8px;font-size:.88rem;outline:none;transition:border-color .15s}
input{flex:1;min-width:180px}
input:focus,select:focus{border-color:#a78bfa}
button{background:#a78bfa;color:#0a0a0a;border:none;padding:10px 22px;border-radius:8px;font-size:.88rem;font-weight:600;cursor:pointer;transition:opacity .15s;white-space:nowrap}
button:hover{opacity:.85}button:disabled{opacity:.4;cursor:not-allowed}
.result-box{background:#0d0d0f;border:1px solid #27272a;border-radius:10px;padding:18px;font-family:'SF Mono','Fira Code',monospace;font-size:.78rem;line-height:1.75;color:#a1a1aa;max-height:480px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;display:none;margin-top:12px}
.st-ok{color:#4ade80;font-size:.8rem;margin-bottom:8px}
.st-err{color:#f87171;font-size:.8rem;margin-bottom:8px}
.chip{display:inline-block;background:#18181b;border:1px solid #27272a;color:#a1a1aa;font-size:.75rem;padding:2px 8px;border-radius:999px;margin:2px}
footer{margin-top:64px;padding-top:24px;border-top:1px solid #18181b;color:#3f3f46;font-size:.85rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
footer a{color:#52525b;text-decoration:none}footer a:hover{color:#a1a1aa}
</style>
</head>
<body>
<div class="container">

<span class="badge">v1.2.0 · REST API</span>
<h1>scraped-cli API</h1>
<p class="subtitle">
  Intelligent web data aggregation for people &amp; places — schools, malls, hospitals, developers, founders and more.<br/>
  Built by <a href="https://github.com/anointedthedeveloper" target="_blank">anointedthedeveloper</a> ·
  <a href="https://www.npmjs.com/package/scraped-cli" target="_blank">npm</a> ·
  <a href="https://github.com/anointedthedeveloper/scraped-cli" target="_blank">GitHub</a>
</p>

<!-- ENDPOINTS -->
<div class="section">
<h2>Endpoints</h2>

<div class="endpoint">
  <div class="endpoint-header"><span class="method get">GET</span><span class="path">/api/search?q={query}&amp;type={type}</span></div>
  <div class="endpoint-body">
    <p class="desc">Search for a person or place. Returns multiple results each with a unique <code>uid</code> you can pass to <code>/api/details</code> for a deeper lookup.</p>
    <table>
      <tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr>
      <tr><td>q</td><td>string</td><td>✅</td><td>Name or place to search</td></tr>
      <tr><td>type</td><td>string</td><td>No</td><td><code>people</code>, <code>places</code>, or <code>auto</code> (default)</td></tr>
    </table>
  </div>
</div>

<div class="endpoint">
  <div class="endpoint-header"><span class="method post">POST</span><span class="path">/api/search</span></div>
  <div class="endpoint-body">
    <p class="desc">Same as GET but accepts a JSON body.</p>
    <table>
      <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
      <tr><td>query</td><td>string</td><td>✅</td><td>Name or place to search</td></tr>
      <tr><td>type</td><td>string</td><td>No</td><td><code>people</code>, <code>places</code>, or <code>auto</code></td></tr>
    </table>
  </div>
</div>

<div class="endpoint">
  <div class="endpoint-header"><span class="method get">GET</span><span class="path">/api/details?name={name}&amp;type={type}</span></div>
  <div class="endpoint-body">
    <p class="desc">Deep targeted search for a specific person or place. Scrapes multiple sources specifically for that name and returns a merged, enriched profile with all social links, phones, emails, and images found.</p>
    <table>
      <tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr>
      <tr><td>name</td><td>string</td><td>✅</td><td>Exact name from a search result</td></tr>
      <tr><td>type</td><td>string</td><td>No</td><td><code>people</code> (default) or <code>places</code></td></tr>
    </table>
  </div>
</div>
</div>

<!-- SOCIAL PLATFORMS -->
<div class="section">
<h2>Extracted Social Platforms</h2>
<p class="desc" style="margin-bottom:12px">The API extracts links for all of these platforms from every page it scrapes:</p>
<div>
  <span class="chip">GitHub</span><span class="chip">Twitter / X</span><span class="chip">LinkedIn</span>
  <span class="chip">Instagram</span><span class="chip">TikTok</span><span class="chip">Facebook</span>
  <span class="chip">YouTube</span><span class="chip">Dev.to</span><span class="chip">Medium</span>
  <span class="chip">Hashnode</span><span class="chip">Pinterest</span><span class="chip">Snapchat</span>
  <span class="chip">Threads</span><span class="chip">Behance</span><span class="chip">Dribbble</span>
  <span class="chip">Product Hunt</span>
</div>
</div>

<!-- PLACE CATEGORIES -->
<div class="section">
<h2>Place Categories (auto-detected)</h2>
<div>
  <span class="chip">school</span><span class="chip">hospital</span><span class="chip">mall</span>
  <span class="chip">restaurant</span><span class="chip">hotel</span><span class="chip">bank</span>
  <span class="chip">church / mosque</span><span class="chip">government</span><span class="chip">tech hub</span>
  <span class="chip">place (default)</span>
</div>
</div>

<!-- EXAMPLES -->
<div class="section">
<h2>Examples</h2>
<pre><span class="cm"># People search</span>
GET /api/search?q=Anointed+Agunloye&type=people

<span class="cm"># Places — school, mall, hospital etc.</span>
GET /api/search?q=University+of+Lagos&type=places
GET /api/search?q=Ikeja+City+Mall&type=places
GET /api/search?q=Lagos+Island+General+Hospital&type=places

<span class="cm"># Deep details for a specific result</span>
GET /api/details?name=Anointed+Agunloye&type=people
GET /api/details?name=Ikeja+City+Mall&type=places</pre>

<p class="desc" style="margin-top:24px;margin-bottom:10px">JavaScript — search then get details</p>
<pre><span class="cm">// 1. Search</span>
<span class="k">const</span> res  = <span class="k">await</span> fetch(<span class="s">'/api/search?q=Anointed&type=people'</span>);
<span class="k">const</span> data = <span class="k">await</span> res.json();
<span class="k">const</span> first = data.results[<span class="n">0</span>];

<span class="cm">// 2. Use the uid to fetch deep details</span>
<span class="k">const</span> detail = <span class="k">await</span> fetch(<span class="s">\`/api/details?name=\${encodeURIComponent(first.name)}&type=people\`</span>);
<span class="k">const</span> profile = <span class="k">await</span> detail.json();</pre>

<p class="desc" style="margin-top:24px;margin-bottom:10px">People response shape</p>
<pre>{
  <span class="k">"query"</span>: <span class="s">"Anointed"</span>,
  <span class="k">"type"</span>: <span class="s">"people"</span>,
  <span class="k">"results"</span>: [{
    <span class="k">"uid"</span>:         <span class="s">"a3f1c9e2b7d04812"</span>,
    <span class="k">"name"</span>:        <span class="s">"Anointed Agunloye"</span>,
    <span class="k">"usernames"</span>:   [<span class="s">"anointedthedeveloper"</span>],
    <span class="k">"bio"</span>:         <span class="s">"If it compiles, ship it."</span>,
    <span class="k">"location"</span>:    <span class="s">"Nigeria"</span>,
    <span class="k">"phones"</span>:      [],
    <span class="k">"emails"</span>:      [],
    <span class="k">"socials"</span>: {
      <span class="k">"github"</span>:    <span class="s">"https://github.com/anointedthedeveloper"</span>,
      <span class="k">"twitter"</span>:   <span class="s">"https://twitter.com/..."</span>,
      <span class="k">"instagram"</span>: <span class="s">"https://instagram.com/..."</span>
    },
    <span class="k">"images"</span>:      [<span class="s">"https://..."</span>],
    <span class="k">"confidence"</span>:  <span class="n">0.72</span>,
    <span class="k">"possibleMatch"</span>: <span class="b">false</span>
  }]
}</pre>

<p class="desc" style="margin-top:24px;margin-bottom:10px">Places response shape</p>
<pre>{
  <span class="k">"query"</span>: <span class="s">"Ikeja City Mall"</span>,
  <span class="k">"type"</span>: <span class="s">"places"</span>,
  <span class="k">"results"</span>: [{
    <span class="k">"uid"</span>:         <span class="s">"b9e2a1f3c04d7812"</span>,
    <span class="k">"name"</span>:        <span class="s">"Ikeja City Mall"</span>,
    <span class="k">"category"</span>:    <span class="s">"mall"</span>,
    <span class="k">"address"</span>:     <span class="s">"Obafemi Awolowo Way, Ikeja, Lagos"</span>,
    <span class="k">"phones"</span>:      [<span class="s">"+234 ..."</span>],
    <span class="k">"emails"</span>:      [<span class="s">"info@..."</span>],
    <span class="k">"hours"</span>:       <span class="s">"Mon–Sun 10am–9pm"</span>,
    <span class="k">"website"</span>:     <span class="s">"https://ikejaicitymall.com"</span>,
    <span class="k">"socials"</span>: {
      <span class="k">"instagram"</span>: <span class="s">"https://instagram.com/..."</span>,
      <span class="k">"facebook"</span>:  <span class="s">"https://facebook.com/..."</span>
    },
    <span class="k">"description"</span>: <span class="s">"Premier shopping destination in Lagos..."</span>,
    <span class="k">"images"</span>:      [<span class="s">"https://..."</span>],
    <span class="k">"confidence"</span>:  <span class="n">0.81</span>
  }]
}</pre>
</div>

<!-- PLAYGROUND -->
<div class="section">
<h2>Try it live</h2>
<div class="try-it">
  <div class="tabs">
    <button class="tab active" onclick="switchTab('search',this)">Search</button>
    <button class="tab" onclick="switchTab('details',this)">Details</button>
  </div>

  <div id="panel-search" class="panel active">
    <div class="input-row">
      <input id="sq" type="text" placeholder="e.g. Anointed Agunloye" value="Anointed"/>
      <select id="stype">
        <option value="auto">auto</option>
        <option value="people" selected>people</option>
        <option value="places">places</option>
      </select>
      <button id="sbtn" onclick="runSearch()">Search</button>
    </div>
    <div id="sstatus"></div>
    <div id="sresult" class="result-box"></div>
  </div>

  <div id="panel-details" class="panel">
    <div class="input-row">
      <input id="dname" type="text" placeholder="e.g. Anointed Agunloye" value="Anointed Agunloye"/>
      <select id="dtype">
        <option value="people" selected>people</option>
        <option value="places">places</option>
      </select>
      <button id="dbtn" onclick="runDetails()">Get Details</button>
    </div>
    <div id="dstatus"></div>
    <div id="dresult" class="result-box"></div>
  </div>
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
function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
}

async function runSearch() {
  const q = document.getElementById('sq').value.trim();
  const type = document.getElementById('stype').value;
  const btn = document.getElementById('sbtn');
  const statusEl = document.getElementById('sstatus');
  const resultEl = document.getElementById('sresult');
  if (!q) return;
  btn.disabled = true; btn.textContent = 'Searching…';
  statusEl.innerHTML = ''; resultEl.style.display = 'none';
  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(q) + '&type=' + type);
    const data = await res.json();
    statusEl.innerHTML = res.ok
      ? '<div class="st-ok">✓ ' + res.status + ' OK · ' + (data.results?.length || 0) + ' result(s) — use uid with /api/details for deep lookup</div>'
      : '<div class="st-err">✗ ' + res.status + ' Error</div>';
    resultEl.textContent = JSON.stringify(data, null, 2);
    resultEl.style.display = 'block';
  } catch(e) {
    statusEl.innerHTML = '<div class="st-err">✗ ' + e.message + '</div>';
  } finally { btn.disabled = false; btn.textContent = 'Search'; }
}

async function runDetails() {
  const name = document.getElementById('dname').value.trim();
  const type = document.getElementById('dtype').value;
  const btn = document.getElementById('dbtn');
  const statusEl = document.getElementById('dstatus');
  const resultEl = document.getElementById('dresult');
  if (!name) return;
  btn.disabled = true; btn.textContent = 'Loading…';
  statusEl.innerHTML = ''; resultEl.style.display = 'none';
  try {
    const res = await fetch('/api/details?name=' + encodeURIComponent(name) + '&type=' + type);
    const data = await res.json();
    statusEl.innerHTML = res.ok
      ? '<div class="st-ok">✓ ' + res.status + ' OK · ' + (data.sources?.length || 0) + ' source(s) scraped</div>'
      : '<div class="st-err">✗ ' + res.status + ' Error</div>';
    resultEl.textContent = JSON.stringify(data, null, 2);
    resultEl.style.display = 'block';
  } catch(e) {
    statusEl.innerHTML = '<div class="st-err">✗ ' + e.message + '</div>';
  } finally { btn.disabled = false; btn.textContent = 'Get Details'; }
}

document.getElementById('sq').addEventListener('keydown', e => { if(e.key==='Enter') runSearch(); });
document.getElementById('dname').addEventListener('keydown', e => { if(e.key==='Enter') runDetails(); });
</script>
</body>
</html>`);
};
