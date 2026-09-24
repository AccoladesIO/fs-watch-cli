const fs = require('fs');
fs.appendFileSync(process.env.FS_WATCH_TEST_OUT, 's');
setTimeout(() => {
    fs.appendFileSync(process.env.FS_WATCH_TEST_OUT, 'f');
}, Number(process.env.FS_WATCH_TEST_MS || 300));