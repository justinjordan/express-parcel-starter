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

      this.server.on('bundled', () => this.run());
    }
  }

  run() {
    if (this.listener) {
      this.listener.close();
    }

    this.express = express();

    if (!devMode) {
      this.express.use('/api', require(path.join(__dirname, 'dist-server/api.js')).default);
      this.express.use(express.static(path.join(__dirname, 'dist-client')));
    } else {
      this.express.use('/api', async (req, res, next) => {
        const bundle = await this.server.bundle();
        const handler = requireUncached(bundle.name);
        handler.default(req, res, next);
      });
      this.express.use(this.client.middleware());
    }

    console.log('Serving on port %s', port);
    this.listener = this.express.listen(port);
  }
}

new App().run();
