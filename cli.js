#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { analyze, findRhymes, vowelHarmonyAnalysis, structuralPattern, fingerprint } from './hangul.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`hangul-analyzer — Structural analysis of Korean text

Usage:
  hangul-analyzer <file>           Analyze a text file
  hangul-analyzer -t "한글 텍스트"  Analyze inline text
  hangul-analyzer --fingerprint <file>  Show phonetic fingerprint only

Options:
  -t, --text       Analyze text from argument
  -f, --fingerprint  Show fingerprint only
  -r, --rhymes     Show rhyme analysis only
  -s, --structure   Show syllable structure only
  -h, --help       Show this help`);
  process.exit(0);
}

let text;
const hasFlag = (f) => args.includes(f);
const flagIdx = (f) => args.indexOf(f);

if (hasFlag('-t') || hasFlag('--text')) {
  const idx = hasFlag('-t') ? flagIdx('-t') : flagIdx('--text');
  text = args[idx + 1];
} else {
  const file = args.find(a => !a.startsWith('-'));
  if (file) {
    text = readFileSync(file, 'utf8');
  }
}

if (!text) {
  console.error('No text provided. Use -t "text" or provide a file path.');
  process.exit(1);
}

const fpOnly = hasFlag('-f') || hasFlag('--fingerprint');
const rhymesOnly = hasFlag('-r') || hasFlag('--rhymes');
const structOnly = hasFlag('-s') || hasFlag('--structure');
const showAll = !fpOnly && !rhymesOnly && !structOnly;

if (showAll || fpOnly) {
  const fp = fingerprint(text);
  if (!fp) {
    console.log('No Korean syllables found.');
    process.exit(0);
  }

  console.log(`음절: ${fp.totalSyllables}`);
  console.log(`밝기: ${fp.brightness > 0 ? '+' : ''}${fp.brightness} (${fp.brightness > 0 ? '양성' : fp.brightness < 0 ? '음성' : '균형'})`);
  console.log(`무게: ${fp.weight} (${fp.weight > 0.5 ? '무거움' : fp.weight > 0.3 ? '중간' : '가벼움'})`);
  console.log(`리듬: ${fp.rhythmRegularity} (${fp.rhythmRegularity > 0.7 ? '규칙적' : fp.rhythmRegularity > 0.4 ? '보통' : '불규칙'})`);
  console.log(`자음 다양성: ${fp.consonantDiversity}`);
  console.log(`모음 다양성: ${fp.vowelDiversity}`);
  console.log(`대표음: ${fp.topCho.join('')} / ${fp.topJung.join('')}`);

  if (fpOnly) process.exit(0);
  console.log();
}

if (showAll) {
  const result = analyze(text);
  console.log(`받침: ${result.withJong}/${result.totalSyllables} (${(result.jongRatio * 100).toFixed(1)}%)`);
  console.log(`모음: 양성 ${result.vowelHarmony.bright}, 음성 ${result.vowelHarmony.dark}, 중성 ${result.vowelHarmony.neutral}`);

  const topCho = Object.entries(result.choFreq).slice(0, 5);
  console.log(`\n초성: ${topCho.map(([k, v]) => `${k}(${v})`).join(' ')}`);
  const topJung = Object.entries(result.jungFreq).slice(0, 5);
  console.log(`중성: ${topJung.map(([k, v]) => `${k}(${v})`).join(' ')}`);
  console.log();
}

if (showAll || rhymesOnly) {
  const rhymes = findRhymes(text);
  const top = Object.entries(rhymes).slice(0, 8);
  if (top.length > 0) {
    console.log('운율:');
    for (const [ending, chars] of top) {
      const unique = [...new Set(chars)];
      console.log(`  [${ending}] ${unique.join(' ')} (${chars.length})`);
    }
    console.log();
  }
}

if (showAll || structOnly) {
  const lines = text.split('\n').filter(l => l.trim());
  console.log('구조:');
  for (const line of lines) {
    const clean = line.replace(/\s/g, '');
    const struct = structuralPattern(clean);
    const count = [...clean].filter(ch => {
      const c = ch.charCodeAt(0);
      return c >= 0xAC00 && c <= 0xD7A3;
    }).length;
    console.log(`  [${String(count).padStart(2)}] ${line}`);
    console.log(`       ${struct}`);
  }
}
