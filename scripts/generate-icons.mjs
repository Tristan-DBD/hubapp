import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function main() {
  const src = path.join(root, 'assets', 'app-icon', 'hub-icon.png');

  if (!fs.existsSync(src)) {
    console.error('❌ hub-icon.png not found in assets/app-icon/');
    process.exit(1);
  }

  for (const [dir, size] of Object.entries(SIZES)) {
    const outDir = path.join(root, 'android', 'app', 'src', 'main', 'res', dir);
    if (!fs.existsSync(outDir)) {
      console.warn(`⚠️  ${dir} doesn't exist, skipping`);
      continue;
    }

    const out1 = path.join(outDir, 'ic_launcher.png');
    const out2 = path.join(outDir, 'ic_launcher_round.png');

    const buf = await sharp(src).resize(size, size).png().toBuffer();
    fs.writeFileSync(out1, buf);
    fs.writeFileSync(out2, buf);
    console.log(`✅ ${dir} (${size}×${size})`);
  }

  console.log('\n🎉 Done! App icons generated.');
}

main().catch(console.error);
