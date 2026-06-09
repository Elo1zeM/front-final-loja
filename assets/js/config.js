// Configure aqui a URL do seu backend.
// Se você estiver usando o Live Server, este frontend rodará em http://127.0.0.1:5501 ou http://localhost:5501.
// Nesse caso, use o backend local em http://localhost:3000.
// Quando estiver em produção no Vercel, use a URL do backend no Vercel com /api no final.

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const LOCAL_API = 'http://localhost:3000';
const VERCEL_API = 'https://back-final-loja-n78pjxzfo-elo1zems-projects.vercel.app/api';
window.API_BASE = isLocalHost ? LOCAL_API : VERCEL_API;
window.API_FALLBACK = isLocalHost ? VERCEL_API : '';
