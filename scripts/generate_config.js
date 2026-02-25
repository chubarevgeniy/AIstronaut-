import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../game_config.json');
const tsPath = path.join(__dirname, '../src/engine/GameConfig.ts');
const gdPath = path.join(__dirname, '../godot_project/scripts/GameConfig.gd');
const csPath = path.join(__dirname, '../unity_project/Assets/Scripts/Core/GameConfig.cs');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// TypeScript Generation
let tsContent = `// Auto-generated from game_config.json\nexport const GameConfig = {\n`;
for (const [key, value] of Object.entries(config)) {
    tsContent += `    ${key}: ${JSON.stringify(value)},\n`;
}
tsContent += `};\n`;

fs.writeFileSync(tsPath, tsContent);
console.log(`Generated ${tsPath}`);

// Godot Generation
let gdContent = `class_name GameConfig\n# Auto-generated from game_config.json\n\n`;

const floatKeys = [
    'gravityConstant',
    'gravityRadiusScale',
    'thrustPower',
    'minPlanetRadius',
    'maxPlanetRadius',
    'chunkSize',
    'shipCollisionRadius',
    'fuelSpawnInterval',
    'engineVolume',
    'musicVolume',
    'starFuelBurnRate',
    'nearMissSpeedThreshold',
    'nearMissFuelReward',
    'nearMissCooldown',
    'nearMissDistance',
    'debugStartDistance',
    'landingMaxSpeed'
];

// Keys to exclude from Godot (Web specific)
const excludeKeys = ['engineType', 'musicType'];

for (const [key, value] of Object.entries(config)) {
    if (excludeKeys.includes(key)) continue;

    // Convert camelCase to SNAKE_CASE
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase();

    let gdValue = value;
    if (floatKeys.includes(key) && Number.isInteger(value)) {
        gdValue = value.toFixed(1);
    }

    gdContent += `const ${snakeKey} = ${gdValue}\n`;
}

fs.writeFileSync(gdPath, gdContent);
console.log(`Generated ${gdPath}`);

// C# Generation (Unity)
let csContent = `using UnityEngine;

namespace Core {
    public static class GameConfig {
`;

for (const [key, value] of Object.entries(config)) {
    // Convert camelCase to PascalCase for C#
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);

    let csValue = value;
    let type = 'float';

    if (floatKeys.includes(key)) {
        type = 'float';
        if (Number.isInteger(value)) {
            csValue = `${value}.0f`;
        } else {
            csValue = `${value}f`;
        }
    } else if (typeof value === 'boolean') {
        type = 'bool';
        csValue = value ? 'true' : 'false';
    } else if (Number.isInteger(value)) {
        type = 'int';
    }

    csContent += `        public const ${type} ${pascalKey} = ${csValue};\n`;
}

csContent += `    }
}
`;

// Ensure directory exists
const csDir = path.dirname(csPath);
if (!fs.existsSync(csDir)) {
    fs.mkdirSync(csDir, { recursive: true });
}

fs.writeFileSync(csPath, csContent);
console.log(`Generated ${csPath}`);
