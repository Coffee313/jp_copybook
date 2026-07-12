const fs = require('node:fs');
const path = require('node:path');

const sourceDir = process.argv[2];
const outputFile = process.argv[3];
const strokeOutputFile = process.argv[4];
const referenceFile = process.argv[5];
if (!sourceDir || !outputFile) throw new Error('Usage: node generate-kanjivg-directions.js <kanji-svg-dir> <output-file>');

const commandLengths = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

function strokeDirection(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
  let command = '', x = 0, y = 0, startX = 0, startY = 0, index = 0;
  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
    const upper = command.toUpperCase();
    const length = commandLengths[upper];
    if (length === undefined || index + length > tokens.length) break;
    if (upper === 'Z') break;
    const values = tokens.slice(index, index + length).map(Number);
    index += length;
    const relative = command === command.toLowerCase();
    let nextX = x, nextY = y;
    if (upper === 'H') nextX = (relative ? x : 0) + values[0];
    else if (upper === 'V') nextY = (relative ? y : 0) + values[0];
    else {
      nextX = (relative ? x : 0) + values[length - 2];
      nextY = (relative ? y : 0) + values[length - 1];
    }
    x = nextX; y = nextY;
    if (upper === 'M') { startX = x; startY = y; command = relative ? 'l' : 'L'; continue; }
    const dx = x - startX, dy = y - startY;
    if (Math.hypot(dx, dy) >= 8) return vectorDirection(dx, dy);
  }
  return vectorDirection(x - startX, y - startY);
}

function vectorDirection(dx, dy) {
  if (Math.hypot(dx, dy) < 2) return '?';
  const names = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return names[Math.round(Math.atan2(dy, dx) / (Math.PI / 4) + 8) % 8];
}

const directions = {};
const strokePaths = {};
const supportedCharacters = referenceFile
  ? new Set([...fs.readFileSync(referenceFile, 'utf8').matchAll(/\["([^"]+)","[^"]*"(?:,\d+)?\]/g)].map(match => match[1]))
  : null;
for (const file of fs.readdirSync(sourceDir).filter(file => /^[0-9a-f]{5}\.svg$/i.test(file))) {
  const character = String.fromCodePoint(parseInt(path.basename(file, '.svg'), 16));
  const svg = fs.readFileSync(path.join(sourceDir, file), 'utf8');
  const strokes = [...svg.matchAll(/<path\b[^>]*\bid="[^"]+-s(\d+)"[^>]*\bd="([^"]+)"/g)]
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map(match => strokeDirection(match[2]));
  if (strokes.length) directions[character] = strokes;
  if (strokeOutputFile && (!supportedCharacters || supportedCharacters.has(character))) {
    const paths = [...svg.matchAll(/<path\b[^>]*\bid="[^"]+-s(\d+)"[^>]*\bd="([^"]+)"/g)]
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map(match => match[2]);
    if (paths.length) strokePaths[character] = paths;
  }
}

const header = `/* Derived from KanjiVG (https://kanjivg.tagaini.net/), CC BY-SA 3.0. */\n`;
fs.writeFileSync(outputFile, `${header}window.KANJIVG_DIRECTIONS=${JSON.stringify(directions)};\n`);
if (strokeOutputFile) fs.writeFileSync(strokeOutputFile, `${header}window.KANJIVG_STROKES=${JSON.stringify(strokePaths)};\n`);
