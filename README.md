# hangul-analyzer

Structural analysis of Korean text. Decompose syllables, detect rhyme patterns, analyze vowel harmony, compare phonetic fingerprints.

Zero dependencies. Uses the mathematical structure of Unicode Hangul encoding.

## How it works

Korean syllable blocks encode their structure directly in Unicode:

```
code = (초성 × 21 + 중성) × 28 + 종성 + 0xAC00
```

This means decomposition is just arithmetic — no lookup tables needed:

```javascript
import { decompose, compose } from './hangul.js';

decompose('한');
// { cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄴ', hasJong: true }

compose('ㅎ', 'ㅏ', 'ㄴ');
// '한'
```

## Features

**Decompose & Compose** — Break syllables into jamo and reassemble them.

**Text Analysis** — Frequency distributions for consonants, vowels, and final consonants. Vowel harmony detection (양성/음성/중성).

**Rhyme Detection** — Find syllables that share the same vowel + final consonant.

**Structural Patterns** — Map text to CV/CVC patterns to see syllable weight.

**Phonetic Fingerprints** — Compact summary of a text's sound profile: brightness, weight, rhythm regularity, consonant/vowel diversity.

**Text Comparison** — Cosine similarity between phonetic fingerprints.

## CLI

```bash
# Analyze a file
node cli.js poem.txt

# Analyze inline text
node cli.js -t "죽는 날까지 하늘을 우러러"

# Fingerprint only
node cli.js -f -t "한글은 아름다운 문자입니다"

# Rhymes only
node cli.js -r poem.txt

# Syllable structure only
node cli.js -s poem.txt
```

## API

```javascript
import {
  decompose, compose, analyze, findRhymes,
  vowelHarmonyAnalysis, structuralPattern,
  fingerprint, compare
} from './hangul.js';

// Full analysis
const result = analyze('한글은 아름다운 문자입니다');
// { totalSyllables, withJong, jongRatio, choFreq, jungFreq, vowelHarmony, ... }

// Rhyme detection
findRhymes('산간만');
// { 'ㅏㄴ': ['산', '간', '만'] }

// Vowel harmony
vowelHarmonyAnalysis('아버지');
// [{ word: '아버지', pattern: '+-·' }]

// Phonetic fingerprint
fingerprint('죽는 날까지 하늘을 우러러');
// { brightness, weight, rhythmRegularity, consonantDiversity, ... }

// Compare two texts
compare(textA, textB);
// 0.0 to 1.0 (cosine similarity)
```

## Poetry Analysis Example

Comparing three classic Korean poems:

| Poem | Syllables | Open % | Brightness | Weight |
|------|-----------|--------|------------|--------|
| 서시 (윤동주) | 76 | 59.2% | +0.176 | 0.408 |
| 진달래꽃 (김소월) | 46 | 67.4% | +0.375 | 0.326 |
| 꽃 (김춘수) | 56 | 66.1% | +0.176 | 0.339 |

서시 has the heaviest syllable profile — more closed syllables give it weight. 진달래꽃 is the lightest and brightest. 꽃 sits between them.

Similarity: 서시 ↔ 꽃 = 0.98, 서시 ↔ 진달래꽃 = 0.91, 진달래꽃 ↔ 꽃 = 0.92.

```bash
node demo.js  # Run the full analysis
```

## Tests

```bash
node --test *.test.js
```

28 tests covering decomposition, composition, analysis, rhyme detection, vowel harmony, structural patterns, fingerprints, and comparison.

## License

MIT
