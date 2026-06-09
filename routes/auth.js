const express = require('express');
const supabase = require('../data/supabase');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    // Tenta criar usuário via Supabase (requer chave de serviço no backend)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) return res.status(400).json({ error: error.message || error });
    return res.json({ user: data });
  } catch (err) {
    console.error('[auth][register] error', err);
    return res.status(500).json({ error: err.message || 'Erro no servidor' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message || error });

    // Retornar usuário e token (se houver)
    return res.json({ user: data.user || null, token: data.session ? data.session.access_token : null });
  } catch (err) {
    console.error('[auth][login] error', err);
    return res.status(500).json({ error: err.message || 'Erro no servidor' });
  }
});

module.exports = router;
