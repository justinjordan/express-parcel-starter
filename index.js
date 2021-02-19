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

      this.server = new Bundler(path.join(__dirname, 'server/index.ts'), {
        target: 'node',
        outDir: './dist-server',
      });

      // restart server on change
      this.server.on('bundled', bundle => {
        this.serverBundle = bundle;
        this.listen();
      });
    }
  }

  async run() {
    if (devMode) {
      // start server build
      this.server.bundle();
    } else {
      // run production server
      this.listen();
    }
  }

  async listen() {
    if (this.listener) {
      // close previous Express instance
      this.listener.close();
    }

    this.express = express();

    if (devMode) {
      requireUncached(this.serverBundle.name).default(this.express);
      this.express.use(this.client.middleware());
    } else {
      require(path.join(__dirname, 'dist-server/index.js')).default(this.express);
      this.express.use(express.static(path.join(__dirname, 'dist-client')));
    }

    console.log('Running on http://localhost:%s', port);
    this.listener = this.express.listen(port);
  }
}

(async () => {
  await new App().run();
})();
