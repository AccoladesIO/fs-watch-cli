const fs = require('fs');
fs.appendFileSync(process.env.STYE_TEST_OUT, 's');
setTimeout(() => {
    fs.appendFileSync(process.env.STYE_TEST_OUT, 'f');
}, Number(process.env.STYE_TEST_MS || 300));