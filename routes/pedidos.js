const express = require('express');
const supabase = require('../data/supabase');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { cliente, total, status = 'pendente', itens } = req.body;

    if (!cliente || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'O corpo deve conter cliente e um array de itens.' });
    }

    const { data: pedidoCriado, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{ cliente, total, status }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    const itensInsercao = itens.map((item) => ({
      pedido_id: pedidoCriado.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco: item.preco,
    }));

    const { data: itensCriados, error: itensError } = await supabase
      .from('pedido_itens')
      .insert(itensInsercao)
      .select();

    if (itensError) throw itensError;

    res.status(201).json({ pedido: pedidoCriado, itens: itensCriados });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
