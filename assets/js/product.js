// AREA DE DESCRIÇÃO & carregamento do produto
const descButton = document.querySelector('.desc-header .btn-icon');
const descBody = document.querySelector('.desc-body');

if (descButton && descBody) {
    descButton.addEventListener('click', () => {
        if (descBody.style.display === 'none') {
            descBody.style.display = 'block';
        } else {
            descBody.style.display = 'none';
        }
    });
}

function getQueryId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id;
}

async function fetchProductById(id) {
    if (!id) return null;
    const base = window.API_BASE || '';
    if (!base) {
        // fallback to localStorage
        const local = JSON.parse(localStorage.getItem('b7store_products') || '[]');
        return local.find((p) => String(p.id) === String(id) || String(p._id) === String(id)) || null;
    }
    try {
        const res = await fetch(base.replace(/\/$/, '') + '/produtos/' + id, { method: 'GET', mode: 'cors' });
        if (!res.ok) return null;
        return await res.json().catch(() => null);
    } catch (err) {
        console.warn('[product] fetch error', err);
        const local = JSON.parse(localStorage.getItem('b7store_products') || '[]');
        return local.find((p) => String(p.id) === String(id) || String(p._id) === String(id)) || null;
    }
}

function setProductOnPage(product) {
    if (!product) return;
    const titleEl = document.querySelector('.info .name');
    const codeEl = document.querySelector('.info .id');
    const priceToEl = document.querySelector('.info .price-to');
    const priceEl = priceToEl && priceToEl.querySelector('span');
    const photoImg = document.querySelector('.photo-area .photo img');
    const descBodyEl = document.querySelector('.desc-body');
    const paymentsEl = document.querySelector('.info .payments');

    if (titleEl) titleEl.textContent = product.nome || product.name || titleEl.textContent;
    if (codeEl) codeEl.textContent = 'CÓD: ' + (product.id || product._id || '0000');
    if (priceToEl) {
        priceToEl.textContent = formatCurrency(product.preco || product.price || 0);
    }
    if (photoImg) photoImg.src = product.imagem || product.image || photoImg.src;
    if (descBodyEl) descBodyEl.textContent = product.descricao || product.description || descBodyEl.textContent;
}

function formatCurrency(value) {
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

window.addEventListener('DOMContentLoaded', async () => {
    const id = getQueryId();
    if (!id) return;
    const product = await fetchProductById(id);
    if (product) setProductOnPage(product);
});

// Favorite toggle on product page
function loadFavorites() { try { return JSON.parse(localStorage.getItem('b7store_favorites') || '[]'); } catch (e) { return []; } }
function saveFavorites(arr) { localStorage.setItem('b7store_favorites', JSON.stringify(arr)); }

function initProductFavorite(id) {
    if (!id) return;
    const favBtn = Array.from(document.querySelectorAll('.buttons .btn-icon')).find((el) => {
        const img = el.querySelector('img');
        return img && img.src && img.src.includes('heart-3');
    });
    if (!favBtn) return;
    const img = favBtn.querySelector('img');
    const idStr = String(id);
    function update() { const favs = loadFavorites(); img.src = favs.includes(idStr) ? 'assets/images/ui/heart-3-fill.png' : 'assets/images/ui/heart-3-line.png'; }
    update();
    favBtn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const favs = loadFavorites();
        const idx = favs.indexOf(idStr);
        if (idx === -1) favs.push(idStr); else favs.splice(idx, 1);
        saveFavorites(favs);
        update();
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    const id = getQueryId();
    if (id) initProductFavorite(id);
});