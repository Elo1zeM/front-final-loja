const supabase = require('./supabase');

async function fetchAll(table, select = '*', orderBy = 'id') {
  const { data, error } = await supabase.from(table).select(select).order(orderBy, { ascending: true });
  if (error) throw error;
  return data;
}

async function fetchById(table, id, select = '*') {
  const { data, error } = await supabase.from(table).select(select).eq('id', id).single();
  if (error) throw error;
  return data;
}

async function insert(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw error;
  return data;
}

async function update(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
  if (error) throw error;
  return data;
}

async function remove(table, id) {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select();
  if (error) throw error;
  return data;
}

module.exports = {
  fetchAll,
  fetchById,
  insert,
  update,
  remove,
  supabase,
};
