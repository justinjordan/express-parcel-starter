const express = require('express');
const path = require('path');

const devMode = process.env.NODE_ENV === 'dev';
const port = Number(process.env.PORT) || 8080;

let app, listener;

if (!devMode) {
  run();
} else {
  var Bundler = require('parcel-bundler');
  var fresh = require('fresh-require');

  var client = new Bundler(path.join(__dirname, 'client/index.html'), {
    target: 'browser',
    outDir: './dist-client',
  });

  var server = new Bundler(path.join(__dirname, 'server/index.ts'), {
    target: 'node',
    outDir: './dist-server',
    contentHash: true,
  });

  // restart server on change
  server.on('bundled', run);
  server.bundle();
}

function run(devBundle) {
  if (listener) {
    listener.close(); // close previous Express instance
  }

  app = express();

  if (devBundle) {
    fresh(devBundle.name, require).default(app);
    app.use(client.middleware());
  } else {
    require(path.join(__dirname, 'dist-server/index.js')).default(app);
    app.use(express.static(path.join(__dirname, 'dist-client')));
  }

  console.log('Running on http://localhost:%s', port);
  listener = app.listen(port);
}
