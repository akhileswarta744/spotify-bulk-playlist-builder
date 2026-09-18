let app: any;
try {
  app = require('../server/dist/server').default || require('../server/dist/server');
} catch {
  app = require('../server/src/server').default || require('../server/src/server');
}

export default app;