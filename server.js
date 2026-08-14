/**
 * Servidor de arranque para hostings tipo cPanel (Phusion Passenger /
 * "Setup Node.js App"). Esos paneles no saben ejecutar `next start`
 * directamente — necesitan un archivo .js que arranquen con `require()` y
 * que escuche en el puerto que ellos asignan (process.env.PORT).
 *
 * En Vercel/un VPS con systemd esto NO hace falta — ahí simplemente se usa
 * `npm run build` + `npm start` (que corre `next start`). Este archivo solo
 * es la puerta de entrada que pide cPanel; por dentro sigue siendo el mismo
 * Next.js de producción.
 */
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`Master Vip Store listo en el puerto ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error al arrancar Next.js:", err);
    process.exit(1);
  });
