const pool = require('../database');

function fallo(status, message) {
  return Object.assign(new Error(message), { status });
}

async function transaccion(operacion) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

function validar(validacion) {
  try { return validacion(); }
  catch (error) { throw fallo(400, error.message); }
}

module.exports = { fallo, transaccion, validar };
