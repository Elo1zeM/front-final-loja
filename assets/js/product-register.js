const API_BASE = window.API_BASE || '';

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('b7store_current_user') || 'null');
}

function showProductMessage(text) {
  const message = document.getElementById('product-message');
  if (!message) return;
  message.textContent = text;
  setTimeout(() => {
    message.textContent = '';
  }, 3500);
}

function loadLocalProducts() {
  return JSON.parse(localStorage.getItem('b7store_products') || '[]');
}

function saveLocalProduct(product) {
  const products = loadLocalProducts();
  products.push(product);
  localStorage.setItem('b7store_products', JSON.stringify(products));
  return products;
}

function renderProductsList(products) {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  if (!products || products.length === 0) {
    productList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">Nenhum produto cadastrado ainda.</div>';
    return;
  }
  products.reverse().forEach((product) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-gray-200 p-4';
    card.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
          <img src="${product.imagem || product.image || 'assets/images/products/camiseta-css.png'}" alt="${product.nome || product.name}" class="h-full w-full object-cover" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-base font-semibold text-gray-900">${product.nome || product.name}</div>
              <div class="text-sm text-gray-500">Categoria: ${product.categoria || product.categoria_id || product.category}</div>
            </div>
            <div class="text-right">
              <div class="text-base font-semibold text-gray-900">R$ ${parseFloat(product.preco || product.price).toFixed(2)}</div>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-600">${product.descricao || product.description || 'Sem descrição informada.'}</p>
        </div>
      </div>
    `;
    productList.appendChild(card);
  });
}

async function backendRequest(path, options = {}) {
  if (!API_BASE) throw new Error('API_BASE não configurado');
  const headers = options.headers || {};
  const token = sessionStorage.getItem('b7store_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const baseUrls = [API_BASE];
  if (window.API_FALLBACK) baseUrls.push(window.API_FALLBACK);

  let lastError;
  for (const base of baseUrls) {
    const url = base.replace(/\/$/, '') + path;
    console.log('[backendRequest] trying url=', url, 'options=', options);
    try {
      const res = await fetch(url, { ...options, headers, mode: 'cors' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastError = data || new Error(`Erro ${res.status}`);
        console.error('[backendRequest] status=', res.status, 'body=', data);
        continue;
      }
      return data;
    } catch (err) {
      lastError = err;
      console.warn('[backendRequest] failed for', url, err);
      if (!window.API_FALLBACK) throw err;
    }
  }
  throw lastError;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  const userInfo = document.getElementById('user-info');
  const form = document.getElementById('product-form');

  if (!user) {
    if (userInfo) userInfo.textContent = 'Usuário não autenticado';
    form.querySelectorAll('input, textarea, button').forEach((field) => (field.disabled = true));
    showProductMessage('Faça login em login.html para acessar o cadastro de produtos.');
    return;
  }

  userInfo.textContent = `Logado como ${user.name || user.email}`;

  // Fetch products from backend when available
  if (API_BASE) {
    try {
      const data = await backendRequest('/produtos', { method: 'GET' });
      renderProductsList(data || []);
    } catch (err) {
      console.warn('[product-register] backend unavailable, usando fallback local', err);
      renderProductsList(loadLocalProducts());
    }
  } else {
    renderProductsList(loadLocalProducts());
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const nome = document.getElementById('product-name').value.trim();
    const preco = document.getElementById('product-price').value;
    const categoriaValue = document.getElementById('product-category').value.trim();
    const imagem = document.getElementById('product-image').value.trim();
    const descricao = document.getElementById('product-description').value.trim();

    if (!nome || !preco || !categoriaValue) {
      showProductMessage('Preencha nome, preço e categoria.');
      return;
    }

    const product = {
      nome,
      preco: parseFloat(preco),
      descricao,
      categoria: categoriaValue,
      imagem,
      createdAt: new Date().toISOString(),
    };
    const categoriaId = Number(categoriaValue);
    if (!Number.isNaN(categoriaId)) {
      product.categoria_id = categoriaId;
    }

    if (API_BASE) {
      try {
        console.log('[product-register] sending', product);
        await backendRequest('/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        // reload list
        const data = await backendRequest('/produtos', { method: 'GET' });
        renderProductsList(data || []);
        form.reset();
        showProductMessage('Produto cadastrado com sucesso!');
        return;
      } catch (err) {
        console.warn('[product-register] backend POST failed, fallback local', err);
        const products = saveLocalProduct(product);
        renderProductsList(products);
        form.reset();
        const message = (err && err.error) || (err && err.message) || 'Backend indisponível. Produto salvo localmente.';
        showProductMessage(message);
        return;
      }
    }

    // fallback local storage behavior
    const products = saveLocalProduct(product);
    renderProductsList(products);
    form.reset();
    showProductMessage('Produto cadastrado com sucesso!');
  });
});
