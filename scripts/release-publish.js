const { execSync } = require('child_process');
const { version } = require('../package.json');

const tag = `v${version}`;
const apk = 'android/app/build/outputs/apk/release/app-release.apk';
const root = __dirname + '/..';

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function silent(cmd) {
  try { execSync(cmd, { stdio: 'pipe', cwd: root }); return true; } catch { return false; }
}

try {
  console.log(`🔨 Building APK v${version}...`);
  run('npm run release');

  // Clean up previous tag/release if any (so script is idempotent)
  silent(`git tag -d ${tag}`);
  silent(`git push origin --delete ${tag}`);
  silent(`gh release delete ${tag} --yes`);

  console.log(`🏷️  Creating git tag ${tag}...`);
  run(`git tag ${tag}`);
  run('git push origin --tags');

  console.log(`📦 Publishing GitHub Release ${tag}...`);
  run(`gh release create ${tag} "${apk}" --generate-notes`);

  console.log(`✅ Done! https://github.com/Tristan-DBD/hubapp/releases/tag/${tag}`);
} catch (err) {
  console.error(`❌ Failed: ${err.message}`);
  process.exit(1);
}
