const express = require('express');
const db = require('../data/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categorias = await db.fetchAll('categorias', '*', 'nome');
    res.json(categorias);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const categoria = await db.fetchById('categorias', req.params.id);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'O campo nome é obrigatório.' });
    }

    const [novaCategoria] = await db.insert('categorias', [{ nome, descricao }]);
    res.status(201).json(novaCategoria);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;
    const [categoriaAtualizada] = await db.update('categorias', req.params.id, { nome, descricao });
    res.json(categoriaAtualizada);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [categoriaRemovida] = await db.remove('categorias', req.params.id);
    res.json(categoriaRemovida);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
