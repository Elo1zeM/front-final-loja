
const API_BASE = window.API_BASE || '';
const API_FALLBACK = window.API_FALLBACK || '';

function formatCurrency(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

async function fetchProducts() {
  if (!API_BASE) return loadLocalProducts();
  const baseUrls = [API_BASE];
  if (API_FALLBACK) baseUrls.push(API_FALLBACK);
  let lastError;

  for (const base of baseUrls) {
    const url = base.replace(/\/$/, '') + '/produtos';
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        lastError = data || new Error(`Erro ${res.status}`);
        console.warn('[produtos] fetch failed:', url, lastError);
        continue;
      }
      return data;
    } catch (err) {
      lastError = err;
      console.warn('[produtos] network error:', url, err);
    }
  }

  console.warn('[produtos] usando fallback local', lastError);
  return loadLocalProducts();
}

function refreshFavoritesUi() {
  const favs = loadFavorites();
  document.querySelectorAll('.product-fav').forEach((el) => {
    const id = el.getAttribute('data-id');
    const img = el.querySelector('img');
    if (!img) return;
    if (favs.includes(String(id))) img.src = 'assets/images/ui/heart-3-fill.png';
    else img.src = 'assets/images/ui/heart-3-line.png';
    el.classList.toggle('favorited', favs.includes(String(id)));
  });
}

function loadLocalProducts() {
  try { return JSON.parse(localStorage.getItem('b7store_products') || '[]'); } catch (e) { return []; }
}

function saveLocalProduct(product) {
  const products = loadLocalProducts();
  products.push(product);
  localStorage.setItem('b7store_products', JSON.stringify(products));
  return products;
}

function loadFavorites() { try { return JSON.parse(localStorage.getItem('b7store_favorites') || '[]'); } catch (e) { return []; } }
function saveFavorites(arr) { localStorage.setItem('b7store_favorites', JSON.stringify(arr)); }

function createProductCard(product) {
  const item = document.createElement('div');
  item.className = 'product-item';
  const prodId = product.id || product._id || product.produto_id || product.createdAt || product.nome || '';

  item.innerHTML = `
    <a href="product.html?id=${prodId}">
      <div class="product-photo">
        <img src="${product.imagem || product.image || 'assets/images/products/camiseta-css.png'}" alt="${product.nome || product.name}" />
      </div>
      <div class="product-name">${product.nome || product.name || 'Produto sem nome'}</div>
      <div class="product-price">${formatCurrency(product.preco || product.price || 0)}</div>
      <div class="product-info">${product.descricao || product.description || 'Sem descrição'}</div>
    </a>
    <div class="product-fav" data-id="${prodId}">
      <img src="assets/images/ui/heart-3-line.png" alt="favorito" />
    </div>
  `;

  // favorite UI
  const favEl = item.querySelector('.product-fav');
  const favImg = favEl && favEl.querySelector('img');
  const idStr = String(prodId);

  function isFav() { return loadFavorites().includes(idStr); }
  function updateFavUi(state) { if (!favImg) return; favImg.src = state ? 'assets/images/ui/heart-3-fill.png' : 'assets/images/ui/heart-3-line.png'; favEl.classList.toggle('favorited', !!state); }

  if (favEl) {
    updateFavUi(isFav());
    favEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const favs = loadFavorites();
      const idx = favs.indexOf(idStr);
      if (idx === -1) favs.push(idStr); else favs.splice(idx, 1);
      saveFavorites(favs);
      updateFavUi(idx === -1);
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'b7store_favorites', newValue: JSON.stringify(favs) })); } catch (e) {}
    });
  }

  return item;
}

function renderProductsList(products) {
  const grid = document.getElementById('product-grid');
  const countElement = document.querySelector('.product-qt span');
  grid.innerHTML = '';

  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">Nenhum produto cadastrado ainda.</div>';
    if (countElement) countElement.textContent = '0';
    return;
  }

  products.forEach((product) => grid.appendChild(createProductCard(product)));
  if (countElement) countElement.textContent = products.length.toString();
}

let infoShown = '';
let infoButtons = document.querySelectorAll('.top-button');
let orderArea = document.querySelector('.order-area');
let filtersArea = document.querySelector('.products .filters');

infoButtons.forEach((item) => {
  item.addEventListener('click', () => {
    let name = item.getAttribute('data-name');
    if (name === infoShown) {
      infoShown = '';
    } else {
      infoShown = name;
    }
    renderInfo();
  });
});

function renderInfo() {
  orderArea.style.display = 'none';
  filtersArea.style.display = 'none';

  switch (infoShown) {
    case 'order':
      orderArea.style.display = 'block';
      break;
    case 'filter':
      filtersArea.style.display = 'block';
      break;
  }
}

// AREA DO FILTRO
let filterIcons = document.querySelectorAll('.filter-icon');
filterIcons.forEach((item) => {
  item.addEventListener('click', () => {
    let body = item.closest('.filter').querySelector('.filter-body');
    if (body.style.display === 'none') {
      body.style.display = 'block';
    } else {
      body.style.display = 'none';
    }
  });
});

window.addEventListener('DOMContentLoaded', async () => {
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  const selected = getSelectedCategory();
  let toRender = products || [];
  if (selected) {
    const match = findCategoryId(selected, categories);
    if (match != null) {
      toRender = toRender.filter((p) => String(p.categoria_id) === String(match) || String(p.categoria) === String(match) || String(p.categoria) === String(selected));
    } else {
      // try matching by name stored on product
      toRender = toRender.filter((p) => String(p.categoria).toLowerCase() === String(selected).toLowerCase());
    }
  }
  // update breadcrumb display if present (keep Home as a link)
  try {
    const bc = document.querySelector('.breadcrumb');
    if (bc) {
      if (selected) bc.innerHTML = `<a href="index.html">Home</a> &gt; ${selected}`;
      else bc.innerHTML = `<a href="index.html">Home</a>`;
    }
  } catch (e) {}
  renderProductsList(toRender);
});

// fetch categories helper
async function fetchCategories() {
  if (!API_BASE) return [];
  try {
    const res = await fetch(API_BASE.replace(/\/$/, '') + '/categorias', { method: 'GET', mode: 'cors' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('[produtos] categorias fetch failed', err);
    return [];
  }
}

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('categoria')) return params.get('categoria');
  const bc = document.querySelector('.breadcrumb');
  if (bc && bc.textContent) {
    const parts = bc.textContent.split('>');
    if (parts.length) return parts[parts.length - 1].trim();
  }
  return null;
}

function findCategoryId(name, categories) {
  if (!name || !categories) return null;
  const lower = String(name).trim().toLowerCase();
  const found = categories.find((c) => c.nome && c.nome.toLowerCase() === lower);
  return found ? found.id : null;
}

// Poll backend periodically so newly added products appear on the site
function startProductsPolling(intervalMs = 8000) {
  // avoid multiple intervals
  if (window._productsPolling) return;
  window._productsPolling = setInterval(async () => {
    try {
      const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
      const selected = getSelectedCategory();
      let toRender = products || [];
      if (selected) {
        const match = findCategoryId(selected, categories);
        if (match != null) {
          toRender = toRender.filter((p) => String(p.categoria_id) === String(match) || String(p.categoria) === String(match) || String(p.categoria) === String(selected));
        } else {
          toRender = toRender.filter((p) => String(p.categoria).toLowerCase() === String(selected).toLowerCase());
        }
      }
      renderProductsList(toRender);
      refreshFavoritesUi();
    } catch (err) {
      console.warn('[produtos] polling error', err);
    }
  }, intervalMs);
}

// Re-render when localStorage is updated (fallback path)
window.addEventListener('storage', (e) => {
  if (e.key === 'b7store_products') {
    try {
      const local = JSON.parse(e.newValue || '[]');
      renderProductsList(local);
    } catch (err) {
      console.warn('[produtos] storage event parse error', err);
    }
  }
  if (e.key === 'b7store_favorites') {
    try {
      refreshFavoritesUi();
    } catch (err) {
      console.warn('[produtos] favorites storage event parse error', err);
    }
  }
});

// Start polling after initial load
window.addEventListener('load', () => startProductsPolling());