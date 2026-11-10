const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(root, '.env'))) { console.log('Configuration existante conservée.'); process.exit(0); }
const password = crypto.randomBytes(24).toString('hex');
const adminPassword = 'Mp!' + crypto.randomBytes(16).toString('hex');
const sql = "CREATE DATABASE IF NOT EXISTS magicpro_api_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS magicpro_api_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'magicpro_api'@'127.0.0.1' IDENTIFIED BY '" + password + "'; ALTER USER 'magicpro_api'@'127.0.0.1' IDENTIFIED BY '" + password + "'; GRANT ALL ON magicpro_api_local.* TO 'magicpro_api'@'127.0.0.1'; GRANT ALL ON magicpro_api_test.* TO 'magicpro_api'@'127.0.0.1';";
execFileSync(path.join(process.env.LOCALAPPDATA, 'MagicPro/server/mariadb-11.4.8-winx64/bin/mariadb.exe'), ['-h','127.0.0.1','-P','3307','-u','root'], { input: sql, stdio: ['pipe','pipe','pipe'] });
const common = '\nJWT_ACCESS_SECRET=' + crypto.randomBytes(48).toString('hex') + '\nJWT_ACCESS_EXPIRES=15m\nREFRESH_TOKEN_DAYS=7\n';
fs.writeFileSync(path.join(root,'.env'), 'PORT=3000\nDATABASE_URL=mysql://magicpro_api:' + password + '@127.0.0.1:3307/magicpro_api_local' + common + 'ADMIN_EMAIL=admin@magicpro.ca\nADMIN_PASSWORD=' + adminPassword + '\n');
fs.writeFileSync(path.join(root,'.env.test'), 'NODE_ENV=test\nDATABASE_URL=mysql://magicpro_api:' + password + '@127.0.0.1:3307/magicpro_api_test' + common);
fs.mkdirSync(path.join(root,'tmp'), { recursive: true });
fs.writeFileSync(path.join(root,'tmp','LOCAL_ACCESS.md'), '# Accès local MagicPro\nAdministrateur : admin@magicpro.ca\nMot de passe : ' + adminPassword + '\n\nClient de test : client@test.ca / Client123!\nEmployé de test : employe@magicpro.ca / Employe123! (à changer à la première connexion)\n');
console.log('Configuration locale et bases dédiées créées. Identifiants : backend/tmp/LOCAL_ACCESS.md');
