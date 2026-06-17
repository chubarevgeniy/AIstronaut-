import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../game_config.json');
const tsPath = path.join(__dirname, '../src/engine/GameConfig.ts');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

let tsContent = `// Auto-generated from game_config.json\nexport const GameConfig = {\n`;
for (const [key, value] of Object.entries(config)) {
    tsContent += `    ${key}: ${JSON.stringify(value)},\n`;
}
tsContent += `};\n`;

fs.writeFileSync(tsPath, tsContent);
console.log(`Generated ${tsPath}`);
