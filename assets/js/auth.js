// Frontend authentication: calls backend endpoints when available. Falls back to localStorage if backend fails.

const API_BASE = window.API_BASE || '';

function setCurrentUser(user, token) {
  sessionStorage.setItem('b7store_current_user', JSON.stringify(user));
  if (token) sessionStorage.setItem('b7store_token', token);
}

function showMessage(text, type = 'error') {
  const message = document.getElementById('message');
  if (!message) return;
  message.textContent = text;
  message.className = type === 'success' ? 'text-sm text-center text-green-600' : 'text-sm text-center text-red-600';
}

function toggleForm(showRegister) {
  document.getElementById('login-section').classList.toggle('hidden', showRegister);
  document.getElementById('register-section').classList.toggle('hidden', !showRegister);
  document.getElementById('form-title').textContent = showRegister ? 'Crie sua conta' : 'Acesse sua conta';
  document.getElementById('form-subtitle').innerHTML = showRegister
    ? 'Já possui conta? <a href="#" id="btn-login" class="font-medium text-black hover:underline">Faça login</a>'
    : 'Ou <a href="#" id="btn-register" class="font-medium text-black hover:underline">crie uma nova conta gratuitamente</a>';
  showMessage('');
  attachToggleHandlers();
}

function attachToggleHandlers() {
  const registerLink = document.getElementById('btn-register');
  const loginLink = document.getElementById('btn-login');

  if (registerLink) {
    registerLink.onclick = (event) => {
      event.preventDefault();
      toggleForm(true);
    };
  }

  if (loginLink) {
    loginLink.onclick = (event) => {
      event.preventDefault();
      toggleForm(false);
    };
  }
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
    try {
      const res = await fetch(url, { ...options, headers, mode: 'cors' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastError = data || new Error(`Erro ${res.status}`);
        continue;
      }
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[auth] backendRequest failed for ${url}:`, err);
      if (!window.API_FALLBACK) throw err;
    }
  }
  throw lastError;
}

document.addEventListener('DOMContentLoaded', () => {
  attachToggleHandlers();

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email-address').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    const localLogin = () => {
      const users = JSON.parse(localStorage.getItem('b7store_users') || '[]');
      const user = users.find((item) => item.email.toLowerCase() === email && item.password === password);
      if (!user) {
        showMessage('E-mail ou senha inválidos. Use admin@b7store.com / senha123 ou cadastre-se.');
        return false;
      }
      setCurrentUser(user);
      showMessage('Login realizado com sucesso! Redirecionando...', 'success');
      setTimeout(() => (window.location.href = 'cadastro-produto.html'), 800);
      return true;
    };

    if (API_BASE) {
      try {
        const data = await backendRequest('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        setCurrentUser(data.user || { email }, data.token || null);
        showMessage('Login realizado com sucesso! Redirecionando...', 'success');
        setTimeout(() => (window.location.href = 'cadastro-produto.html'), 800);
        return;
      } catch (err) {
        console.warn('[auth] backend login falhou, usando fallback local:', err);
        if (localLogin()) return;
        const msg = (err && err.message) || 'E-mail ou senha inválidos.';
        showMessage(msg);
        return;
      }
    }

    // Fallback local behaviour (legacy)
    localLogin();
  });

  document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;

    if (!name || !email || !password) {
      showMessage('Preencha nome, e-mail e senha para se cadastrar.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('As senhas não coincidem.');
      return;
    }

    const localRegister = () => {
      const users = JSON.parse(localStorage.getItem('b7store_users') || '[]');
      if (users.some((item) => item.email === email)) {
        showMessage('E-mail já cadastrado. Faça login ou use outro e-mail.');
        return false;
      }
      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem('b7store_users', JSON.stringify(users));
      showMessage('Conta criada com sucesso! Faça login agora.', 'success');
      toggleForm(false);
      return true;
    };

    if (API_BASE) {
      try {
        const data = await backendRequest('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        showMessage('Conta criada com sucesso! Faça login agora.', 'success');
        toggleForm(false);
        return;
      } catch (err) {
        console.warn('[auth] backend register falhou, usando fallback local:', err);
        if (localRegister()) return;
        const msg = (err && err.message) || 'Erro ao cadastrar.';
        showMessage(msg);
        return;
      }
    }

    // Fallback local registration
    localRegister();
  });
});
