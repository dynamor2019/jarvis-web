const http = require('http');
const next = require('next');
const path = require('path');

const app_dir = process.cwd();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOSTNAME || process.env.HOST || '0.0.0.0';

const app = next({
  dev: false,
  dir: app_dir,
  conf: {
    distDir: '.next_build',
    output: 'standalone',
    experimental: {
      mcpServer: false,
    },
  },
});

app.prepare()
  .then(() => {
    const handle = app.getRequestHandler();
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, host, () => {
      console.log(`PRODUCTION_SERVER_UP http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error('PRODUCTION_SERVER_FAIL', err && err.stack ? err.stack : err);
    process.exit(1);
  });
