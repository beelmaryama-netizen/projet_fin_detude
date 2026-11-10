const path = require('path'); const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname,'../.env'), quiet: true });
const mobile = path.resolve(__dirname,'../../mobile');
const result = spawnSync(process.execPath, [path.join(mobile,'node_modules/vitest/vitest.mjs'), 'run', 'src/services/api/live.integration.test.ts'], { cwd: mobile, stdio: 'inherit', env: { ...process.env, MAGICPRO_LIVE_TEST: '1', MAGICPRO_TEST_ADMIN_PASSWORD: process.env.ADMIN_PASSWORD } });
process.exit(result.status ?? 1);
