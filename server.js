// Hostinger root entry point fallback
try {
  require('./backend/server.js');
} catch (e) {
  require('./src/index.js');
}
