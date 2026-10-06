/**
 * Cloudflare Worker - Display Luxorita Sitemaps from Victor1cnd/sitemaps repo
 * Auto-updates when Victor1cnd/sitemaps Sitemaps file is modified
 */

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Victor1cnd/sitemaps/main/Sitemaps';
const CACHE_TTL = 3600; // 1 hour

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve main page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getHTML(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
    
    // API: Get all URLs
    if (url.pathname === '/api/urls') {
      return handleUrlsAPI();
    }
    
    // API: Search URLs
    if (url.pathname === '/api/search') {
      const query = url.searchParams.get('q');
      return handleSearch(query);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleUrlsAPI() {
  try {
    const urls = await fetchSitemapUrls();
    return new Response(JSON.stringify({ urls, total: urls.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleSearch(query) {
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const urls = await fetchSitemapUrls();
    const results = urls.filter(url =>
      url.toLowerCase().includes(query.toLowerCase())
    );
    
    return new Response(JSON.stringify({ query, results, count: results.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function fetchSitemapUrls() {
  const response = await fetch(GITHUB_RAW_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }
  
  const content = await response.text();
  const urls = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('https://') || line.match(/^<url><loc>/))
    .map(line => {
      // Handle both plain URLs and XML format
      const xmlMatch = line.match(/<loc>(.*?)<\/loc>/);
      return xmlMatch ? xmlMatch[1] : line;
    })
    .filter(line => line.length > 0);
  
  return urls;
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luxorita Sitemaps - 24K Gold & Diamond Jewelry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 { font-size: 2.5em; margin-bottom: 10px; }
    header p { opacity: 0.9; font-size: 1.1em; }
    
    .search-section {
      padding: 30px 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    .search-box {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    .search-box input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 1em;
      transition: border-color 0.3s;
    }
    .search-box input:focus {
      outline: none;
      border-color: #667eea;
    }
    .search-box button {
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }
    .search-box button:hover { background: #764ba2; }
    
    .stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .stat {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      background: white;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .stat-number {
      font-size: 1.8em;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label { color: #666; font-size: 0.9em; margin-top: 5px; }
    
    .results-section {
      padding: 40px;
    }
    .url-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .url-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s;
      overflow: hidden;
    }
    .url-card:hover {
      background: white;
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      transform: translateY(-2px);
    }
    .url-card a {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
      font-size: 0.95em;
    }
    .url-card a:hover { text-decoration: underline; }
    
    .loading { text-align: center; padding: 40px; color: #667eea; font-size: 1.2em; }
    .error { color: #d32f2f; padding: 20px; background: #ffebee; border-radius: 6px; margin-top: 20px; }
    .pagination {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 30px;
      flex-wrap: wrap;
    }
    .pagination button {
      padding: 8px 16px;
      background: #e9ecef;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .pagination button:hover { background: #667eea; color: white; }
    .pagination button.active { background: #667eea; color: white; }
    
    .meta {
      font-size: 0.85em;
      color: #999;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>✨ Luxorita Sitemaps</h1>
      <p>24K Gold & Diamond Jewelry Collection - Live from Victor1cnd/sitemaps</p>
    </header>
    
    <div class="search-section">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Search URLs (e.g., ring, bracelet, dubai, tokyo)...">
        <button onclick="performSearch()">🔍 Search</button>
      </div>
      <div class="stats" id="stats"></div>
    </div>
    
    <div class="results-section">
      <h2 id="title">📦 Loading URLs from GitHub...</h2>
      <div id="results" class="url-grid"></div>
      <div class="pagination" id="pagination"></div>
      <div class="meta" id="meta"></div>
    </div>
  </div>
  
  <script>
    let allUrls = [];
    let currentPage = 1;
    const itemsPerPage = 24;
    
    async function loadUrls() {
      try {
        const response = await fetch('/api/urls');
        const data = await response.json();
        allUrls = data.urls;
        displayStats(data.total);
        displayPage(1);
      } catch (error) {
        document.getElementById('results').innerHTML = \`<div class="error">❌ Error loading URLs: \${error.message}</div>\`;
      }
    }
    
    function displayStats(total) {
      document.getElementById('stats').innerHTML = \`
        <div class="stat">
          <div class="stat-number">\${total}</div>
          <div class="stat-label">Total URLs</div>
        </div>
        <div class="stat">
          <div class="stat-number">\${Math.ceil(total / itemsPerPage)}</div>
          <div class="stat-label">Pages</div>
        </div>
        <div class="stat">
          <div class="stat-number">⚡ Live</div>
          <div class="stat-label">Auto-Updated from Repo</div>
        </div>
      \`;
    }
    
    function displayPage(page) {
      currentPage = page;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageUrls = allUrls.slice(start, end);
      
      document.getElementById('title').textContent = \`📍 Displaying \${start + 1}-\${Math.min(end, allUrls.length)} of \${allUrls.length} URLs\`;
      document.getElementById('results').innerHTML = pageUrls
        .map(url => \`<div class="url-card"><a href="\${url}" target="_blank">\${url}</a></div>\`)
        .join('');
      
      document.getElementById('meta').textContent = \`Last updated: \${new Date().toLocaleString()}\`;
      displayPagination(page, Math.ceil(allUrls.length / itemsPerPage));
    }
    
    function displayPagination(current, total) {
      let html = '';
      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);
      
      if (current > 1) html += \`<button onclick="displayPage(1)">« First</button>\`;
      
      for (let i = start; i <= end; i++) {
        html += \`<button onclick="displayPage(\${i})" class="\${i === current ? 'active' : ''}">\${i}</button>\`;
      }
      
      if (current < total) html += \`<button onclick="displayPage(\${total})">Last »</button>\`;
      
      document.getElementById('pagination').innerHTML = html;
    }
    
    async function performSearch() {
      const query = document.getElementById('searchInput').value.trim();
      if (!query) {
        loadUrls();
        return;
      }
      
      try {
        const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
        const data = await response.json();
        allUrls = data.results;
        document.getElementById('title').textContent = \`🔍 Search Results for "\${query}" (\${data.count} found)\`;
        document.getElementById('results').innerHTML = allUrls
          .map(url => \`<div class="url-card"><a href="\${url}" target="_blank">\${url}</a></div>\`)
          .join('') || '<div class="error">No results found</div>';
        document.getElementById('pagination').innerHTML = '';
      } catch (error) {
        document.getElementById('results').innerHTML = \`<div class="error">Search error: \${error.message}</div>\`;
      }
    }
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
    
    loadUrls();
    
    // Refresh every 30 minutes
    setInterval(loadUrls, 1800000);
  </script>
</body>
</html>\`;
}
