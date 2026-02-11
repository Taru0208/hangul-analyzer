/**
 * Hangul Structural Analyzer
 *
 * Korean syllable blocks are algorithmically composed from jamo (자모).
 * Unicode Hangul syllables (AC00-D7A3) encode structure directly:
 *   syllable = (초성 × 21 + 중성) × 28 + 종성 + 0xAC00
 *
 * This module decomposes, analyzes, and finds patterns in Korean text.
 */

// 초성 (initial consonants) - 19 total
const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 중성 (medial vowels) - 21 total
const JUNGSEONG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 종성 (final consonants) - 28 total (index 0 = no final consonant)
const JONGSEONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Phonetic categories
const CONSONANT_NAMES = {
  'ㄱ': '기역', 'ㄲ': '쌍기역', 'ㄴ': '니은', 'ㄷ': '디귿', 'ㄸ': '쌍디귿',
  'ㄹ': '리을', 'ㅁ': '미음', 'ㅂ': '비읍', 'ㅃ': '쌍비읍', 'ㅅ': '시옷',
  'ㅆ': '쌍시옷', 'ㅇ': '이응', 'ㅈ': '지읒', 'ㅉ': '쌍지읒', 'ㅊ': '치읓',
  'ㅋ': '키읔', 'ㅌ': '티읕', 'ㅍ': '피읖', 'ㅎ': '히읗'
};

const VOWEL_TYPES = {
  bright: ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'],  // 양성모음
  dark: ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'],     // 음성모음
  neutral: ['ㅡ', 'ㅢ', 'ㅣ']                                           // 중성모음
};

const SYLLABLE_BASE = 0xAC00;
const SYLLABLE_END = 0xD7A3;

/**
 * Check if a character is a Hangul syllable block
 */
function isSyllable(ch) {
  const code = ch.charCodeAt(0);
  return code >= SYLLABLE_BASE && code <= SYLLABLE_END;
}

/**
 * Decompose a single Hangul syllable into its jamo components
 */
function decompose(ch) {
  if (!isSyllable(ch)) return null;

  const code = ch.charCodeAt(0) - SYLLABLE_BASE;
  const jongIdx = code % 28;
  const jungIdx = ((code - jongIdx) / 28) % 21;
  const choIdx = Math.floor(((code - jongIdx) / 28) / 21);

  return {
    syllable: ch,
    cho: CHOSEONG[choIdx],
    jung: JUNGSEONG[jungIdx],
    jong: JONGSEONG[jongIdx] || null,
    choIdx, jungIdx, jongIdx,
    hasJong: jongIdx !== 0
  };
}

/**
 * Compose jamo into a syllable block
 */
function compose(cho, jung, jong = '') {
  const choIdx = CHOSEONG.indexOf(cho);
  const jungIdx = JUNGSEONG.indexOf(jung);
  const jongIdx = jong ? JONGSEONG.indexOf(jong) : 0;

  if (choIdx < 0 || jungIdx < 0 || jongIdx < 0) return null;

  const code = SYLLABLE_BASE + (choIdx * 21 + jungIdx) * 28 + jongIdx;
  return String.fromCharCode(code);
}

/**
 * Analyze a Korean text — decompose all syllables and compute statistics
 */
function analyze(text) {
  const syllables = [];
  const choFreq = {};
  const jungFreq = {};
  const jongFreq = {};
  let totalSyllables = 0;
  let withJong = 0;
  let brightVowels = 0;
  let darkVowels = 0;
  let neutralVowels = 0;

  for (const ch of text) {
    const d = decompose(ch);
    if (!d) continue;

    syllables.push(d);
    totalSyllables++;

    choFreq[d.cho] = (choFreq[d.cho] || 0) + 1;
    jungFreq[d.jung] = (jungFreq[d.jung] || 0) + 1;
    if (d.jong) {
      jongFreq[d.jong] = (jongFreq[d.jong] || 0) + 1;
      withJong++;
    }

    if (VOWEL_TYPES.bright.includes(d.jung)) brightVowels++;
    else if (VOWEL_TYPES.dark.includes(d.jung)) darkVowels++;
    else neutralVowels++;
  }

  return {
    syllables,
    totalSyllables,
    withJong,
    withoutJong: totalSyllables - withJong,
    jongRatio: totalSyllables ? withJong / totalSyllables : 0,
    choFreq: sortByValue(choFreq),
    jungFreq: sortByValue(jungFreq),
    jongFreq: sortByValue(jongFreq),
    vowelHarmony: {
      bright: brightVowels,
      dark: darkVowels,
      neutral: neutralVowels,
      tendency: brightVowels > darkVowels ? '양성 (bright)' :
                darkVowels > brightVowels ? '음성 (dark)' : '균형 (balanced)'
    }
  };
}

/**
 * Find rhyming patterns — syllables that share the same 중성+종성
 */
function findRhymes(text) {
  const analysis = analyze(text);
  const endings = {};

  for (const s of analysis.syllables) {
    const key = s.jung + (s.jong || '');
    if (!endings[key]) endings[key] = [];
    endings[key].push(s.syllable);
  }

  return Object.fromEntries(
    Object.entries(endings)
      .filter(([, v]) => v.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
  );
}

/**
 * Detect vowel harmony patterns (모음조화)
 * Traditional Korean follows vowel harmony: bright vowels pair with bright, dark with dark
 */
function vowelHarmonyAnalysis(text) {
  const analysis = analyze(text);
  const words = text.split(/\s+/);
  const wordPatterns = [];

  for (const word of words) {
    const pattern = [];
    for (const ch of word) {
      const d = decompose(ch);
      if (!d) continue;
      if (VOWEL_TYPES.bright.includes(d.jung)) pattern.push('+');
      else if (VOWEL_TYPES.dark.includes(d.jung)) pattern.push('-');
      else pattern.push('·');
    }
    if (pattern.length > 0) {
      wordPatterns.push({ word, pattern: pattern.join('') });
    }
  }

  return wordPatterns;
}

/**
 * Structural signature — reduce a syllable to its CV(C) pattern
 */
function structuralPattern(text) {
  const result = [];
  for (const ch of text) {
    const d = decompose(ch);
    if (!d) {
      if (ch.trim()) result.push(ch);
      continue;
    }
    result.push(d.hasJong ? 'CVC' : 'CV');
  }
  return result.join(' ');
}

/**
 * Compute a phonetic fingerprint — a compact summary of a text's sound profile.
 * Returns normalized vectors (0-1) that can be compared across texts.
 *
 * The fingerprint captures:
 * - Consonant distribution (which sounds dominate)
 * - Vowel brightness (양성 vs 음성 balance)
 * - Syllable weight (open vs closed ratio)
 * - Rhythmic density (how many heavy syllables per line)
 */
function fingerprint(text) {
  const result = analyze(text);
  if (result.totalSyllables === 0) return null;

  const total = result.totalSyllables;

  // Consonant profile: normalize cho frequency to [0,1]
  const choProfile = {};
  for (const c of CHOSEONG) {
    choProfile[c] = (result.choFreq[c] || 0) / total;
  }

  // Vowel profile: normalize jung frequency to [0,1]
  const jungProfile = {};
  for (const v of JUNGSEONG) {
    jungProfile[v] = (result.jungFreq[v] || 0) / total;
  }

  // Brightness: -1 (all dark) to +1 (all bright)
  const { bright, dark, neutral } = result.vowelHarmony;
  const brightnessRaw = bright - dark;
  const brightnessMax = bright + dark || 1;
  const brightness = brightnessRaw / brightnessMax;

  // Weight: 0 (all open) to 1 (all closed)
  const weight = result.jongRatio;

  // Rhythmic analysis: variance in syllable count per line
  const lines = text.split('\n').filter(l => l.trim());
  const lineLengths = lines.map(line => {
    let count = 0;
    for (const ch of line) { if (isSyllable(ch)) count++; }
    return count;
  }).filter(n => n > 0);

  const avgLineLength = lineLengths.length
    ? lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length
    : 0;
  const lineVariance = lineLengths.length > 1
    ? lineLengths.reduce((sum, n) => sum + (n - avgLineLength) ** 2, 0) / lineLengths.length
    : 0;
  const rhythmRegularity = avgLineLength > 0
    ? 1 - Math.min(1, Math.sqrt(lineVariance) / avgLineLength)
    : 0;

  // Consonant diversity: Shannon entropy normalized to [0,1]
  const choEntropy = shannonEntropy(Object.values(choProfile).filter(v => v > 0));
  const maxChoEntropy = Math.log2(CHOSEONG.length);
  const consonantDiversity = maxChoEntropy > 0 ? choEntropy / maxChoEntropy : 0;

  // Vowel diversity
  const jungEntropy = shannonEntropy(Object.values(jungProfile).filter(v => v > 0));
  const maxJungEntropy = Math.log2(JUNGSEONG.length);
  const vowelDiversity = maxJungEntropy > 0 ? jungEntropy / maxJungEntropy : 0;

  return {
    totalSyllables: total,
    brightness: round(brightness, 3),
    weight: round(weight, 3),
    rhythmRegularity: round(rhythmRegularity, 3),
    avgLineLength: round(avgLineLength, 1),
    consonantDiversity: round(consonantDiversity, 3),
    vowelDiversity: round(vowelDiversity, 3),
    choProfile,
    jungProfile,
    // Top 3 most frequent sounds
    topCho: Object.entries(result.choFreq).slice(0, 3).map(([k]) => k),
    topJung: Object.entries(result.jungFreq).slice(0, 3).map(([k]) => k)
  };
}

/**
 * Compare two texts by computing cosine similarity between their fingerprints.
 * Returns a value from 0 (completely different) to 1 (identical profile).
 */
function compare(textA, textB) {
  const fpA = fingerprint(textA);
  const fpB = fingerprint(textB);
  if (!fpA || !fpB) return null;

  // Build vectors from cho + jung profiles
  const vecA = [];
  const vecB = [];
  for (const c of CHOSEONG) {
    vecA.push(fpA.choProfile[c] || 0);
    vecB.push(fpB.choProfile[c] || 0);
  }
  for (const v of JUNGSEONG) {
    vecA.push(fpA.jungProfile[v] || 0);
    vecB.push(fpB.jungProfile[v] || 0);
  }
  // Add scalar features
  vecA.push(fpA.brightness, fpA.weight, fpA.rhythmRegularity);
  vecB.push(fpB.brightness, fpB.weight, fpB.rhythmRegularity);

  return round(cosineSimilarity(vecA, vecB), 4);
}

function shannonEntropy(probs) {
  return -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function round(n, digits) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function sortByValue(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => b[1] - a[1])
  );
}

export {
  CHOSEONG, JUNGSEONG, JONGSEONG, CONSONANT_NAMES, VOWEL_TYPES,
  isSyllable, decompose, compose, analyze, findRhymes,
  vowelHarmonyAnalysis, structuralPattern, fingerprint, compare
};
