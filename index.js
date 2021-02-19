const express = require('express');
const path = require('path');

const devMode = process.env.NODE_ENV === 'dev';
const port = Number(process.env.PORT) || 8080;

if (devMode) {
  var Bundler = require('parcel-bundler');

  function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
  }
}

class App {
  express;
  listener;
  client;
  server;
  serverBundle;

  constructor() {
    if (devMode) {
      this.client = new Bundler(path.join(__dirname, 'client/index.html'), {
        target: 'browser',
        outDir: './dist-client',
      });

      this.server = new Bundler(path.join(__dirname, 'server/api.ts'), {
        target: 'node',
        outDir: './dist-server',
      });
      this.server.on('bundled', bundle => this.serverBundle = bundle);
    }
  }

  async run() {
    if (this.listener) {
      this.listener.close();
    }

    this.express = express();

    if (!devMode) {
      this.express.use('/api', require(path.join(__dirname, 'dist-server/api.js')).default);
      this.express.use(express.static(path.join(__dirname, 'dist-client')));
    } else {
      this.serverBundle = await this.server.bundle();
      this.express.use('/api', async (req, res, next) => {
        requireUncached(this.serverBundle.name).default(req, res, next);
      });
      this.express.use(this.client.middleware());
    }

    console.log('Running on http://localhost:%s', port);
    this.listener = this.express.listen(port);
  }
}

(async () => {
  await new App().run();
})();
