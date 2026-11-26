const pool = require('./database');
const usuarios = require('./services/usuarios');

async function main() {
  const { FERRE_ADMIN_EMAIL, FERRE_ADMIN_PASSWORD } = process.env;
  const usuario = await usuarios.crear({
    correo: FERRE_ADMIN_EMAIL, password: FERRE_ADMIN_PASSWORD,
    nombre: process.env.FERRE_ADMIN_NOMBRE || 'Gestión',
    apellido: process.env.FERRE_ADMIN_APELLIDO || 'FerreReconstruye',
    rol: 'Administrador', estado: 'Activo'
  });
  console.log('Administrador creado:', usuario.correo);
}

main().catch(error => {
  console.error(error.code === 'ER_DUP_ENTRY' ? 'Ya existe una cuenta con ese correo.' :
    error.status ? error.message : 'No se pudo crear el administrador. Revisa la conexión.');
  process.exitCode = 1;
}).finally(() => pool.end());
