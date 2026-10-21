// Копирует assets/story.json в public/story.json,
// чтобы сюжет попадал на хостинг отдельным статическим файлом.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'assets', 'story.json'),
  path.join(root, 'public', 'story.json')
);
console.log('story.json скопирован в public/');