const express = require('express');
const db = require('../data/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const produtos = await db.fetchAll('produtos', '*', 'nome');
    res.json(produtos);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const produto = await db.fetchById('produtos', req.params.id);
    res.json(produto);
  } catch (error) {
    next(error);
  }
});

async function resolveCategoryId(categoriaId, categoriaNome) {
  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
    const parsedId = Number(categoriaId);
    if (!Number.isNaN(parsedId)) return parsedId;
  }

  if (!categoriaNome) return null;

  const categorias = await db.fetchAll('categorias', '*', 'nome');
  const categoriaExistente = categorias.find(
    (item) => item.nome && item.nome.toLowerCase() === categoriaNome.trim().toLowerCase(),
  );

  if (categoriaExistente) return categoriaExistente.id;

  const [novaCategoria] = await db.insert('categorias', [{ nome: categoriaNome.trim(), descricao: null }]);
  return novaCategoria.id;
}

router.post('/', async (req, res, next) => {
  try {
    const { nome, preco, descricao, categoria_id, categoria, imagem } = req.body;
    if (!nome || preco === undefined) {
      return res.status(400).json({ error: 'Os campos nome e preco são obrigatórios.' });
    }

    const resolvedCategoryId = await resolveCategoryId(categoria_id, categoria);
    if (!resolvedCategoryId) {
      return res.status(400).json({ error: 'Categoria inválida. Informe o nome ou id da categoria.' });
    }

    const [novoProduto] = await db.insert('produtos', [
      { nome, preco, descricao, categoria_id: resolvedCategoryId, imagem },
    ]);
    res.status(201).json(novoProduto);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, preco, descricao, categoria_id, categoria, imagem } = req.body;
    const resolvedCategoryId = await resolveCategoryId(categoria_id, categoria);
    const [produtoAtualizado] = await db.update('produtos', req.params.id, {
      nome,
      preco,
      descricao,
      categoria_id: resolvedCategoryId,
      imagem,
    });
    res.json(produtoAtualizado);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [produtoRemovido] = await db.remove('produtos', req.params.id);
    res.json(produtoRemovido);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
