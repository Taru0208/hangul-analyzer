import { analyze, findRhymes, vowelHarmonyAnalysis, structuralPattern, fingerprint, compare } from './hangul.js';

// 윤동주 — 서시 (Prologue)
const seosi = `죽는 날까지 하늘을 우러러
한 점 부끄럼이 없기를
잎새에 이는 바람에도
나는 괴로워했다
별을 노래하는 마음으로
모든 죽어가는 것을 사랑해야지
그리고 나한테 주어진 길을
걸어가야겠다`;

// 김소월 — 진달래꽃 (Azaleas)
const azaleas = `나 보기가 역겨워
가실 때에는
말없이 고이 보내 드리오리다
영변에 약산
진달래꽃
아름 따다 가실 길에 뿌리오리다`;

// 김춘수 — 꽃 (Flower)
const flower = `내가 그의 이름을 불러 주기 전에는
그는 다만
하나의 몸짓에 지나지 않았다
내가 그의 이름을 불러 주었을 때
그는 나에게로 와서
꽃이 되었다`;

function analyzePoem(title, text) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(50)}\n`);

  const result = analyze(text);
  console.log(`총 음절: ${result.totalSyllables}`);
  console.log(`받침 있음: ${result.withJong} (${(result.jongRatio * 100).toFixed(1)}%)`);
  console.log(`받침 없음: ${result.withoutJong} (${((1 - result.jongRatio) * 100).toFixed(1)}%)`);

  console.log(`\n모음 성향: ${result.vowelHarmony.tendency}`);
  console.log(`  양성(밝음): ${result.vowelHarmony.bright}`);
  console.log(`  음성(어두움): ${result.vowelHarmony.dark}`);
  console.log(`  중성: ${result.vowelHarmony.neutral}`);

  console.log('\n— 초성 빈도 (상위 5) —');
  const topCho = Object.entries(result.choFreq).slice(0, 5);
  for (const [jamo, count] of topCho) {
    const bar = '█'.repeat(Math.round(count / result.totalSyllables * 30));
    console.log(`  ${jamo}  ${bar} ${count}`);
  }

  console.log('\n— 중성 빈도 (상위 5) —');
  const topJung = Object.entries(result.jungFreq).slice(0, 5);
  for (const [jamo, count] of topJung) {
    const bar = '█'.repeat(Math.round(count / result.totalSyllables * 30));
    console.log(`  ${jamo}  ${bar} ${count}`);
  }

  const rhymes = findRhymes(text);
  const topRhymes = Object.entries(rhymes).slice(0, 5);
  if (topRhymes.length > 0) {
    console.log('\n— 운율 패턴 (같은 중성+종성) —');
    for (const [ending, chars] of topRhymes) {
      const unique = [...new Set(chars)];
      console.log(`  [${ending}] ${unique.join(', ')} (${chars.length}회)`);
    }
  }

  console.log('\n— 모음조화 패턴 —');
  const harmony = vowelHarmonyAnalysis(text);
  for (const { word, pattern } of harmony.slice(0, 8)) {
    console.log(`  ${word.padEnd(8)} ${pattern}  (${describePattern(pattern)})`);
  }

  // Per-line structural pattern
  console.log('\n— 음절 구조 (행별) —');
  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const struct = structuralPattern(line.replace(/\s/g, ''));
    const syllableCount = [...line].filter(ch => {
      const code = ch.charCodeAt(0);
      return code >= 0xAC00 && code <= 0xD7A3;
    }).length;
    console.log(`  ${line.padEnd(20)} [${syllableCount}음절] ${struct}`);
  }
}

function describePattern(pattern) {
  const bright = (pattern.match(/\+/g) || []).length;
  const dark = (pattern.match(/-/g) || []).length;
  if (bright > 0 && dark === 0) return '양성';
  if (dark > 0 && bright === 0) return '음성';
  if (bright > dark) return '양성 우세';
  if (dark > bright) return '음성 우세';
  return '혼합';
}

analyzePoem('윤동주 — 서시 (序詩)', seosi);
analyzePoem('김소월 — 진달래꽃', azaleas);
analyzePoem('김춘수 — 꽃', flower);

// Fingerprint comparison
console.log(`\n${'═'.repeat(50)}`);
console.log('  Phonetic Fingerprints');
console.log(`${'═'.repeat(50)}\n`);

const poems = [
  { name: '서시', text: seosi },
  { name: '진달래꽃', text: azaleas },
  { name: '꽃', text: flower }
];

for (const { name, text } of poems) {
  const fp = fingerprint(text);
  const brightBar = '█'.repeat(Math.round(Math.abs(fp.brightness) * 10));
  const brightDir = fp.brightness > 0 ? '양성 ' + brightBar : brightBar + ' 음성';
  console.log(`[${name}]`);
  console.log(`  밝기: ${fp.brightness > 0 ? '+' : ''}${fp.brightness} ${brightDir}`);
  console.log(`  무게: ${fp.weight} ${'█'.repeat(Math.round(fp.weight * 10))}`);
  console.log(`  리듬 규칙성: ${fp.rhythmRegularity}`);
  console.log(`  평균 행 길이: ${fp.avgLineLength}음절`);
  console.log(`  자음 다양성: ${fp.consonantDiversity}`);
  console.log(`  모음 다양성: ${fp.vowelDiversity}`);
  console.log(`  대표 초성: ${fp.topCho.join(' ')}`);
  console.log(`  대표 중성: ${fp.topJung.join(' ')}`);
  console.log();
}

console.log('— 유사도 비교 —');
for (let i = 0; i < poems.length; i++) {
  for (let j = i + 1; j < poems.length; j++) {
    const sim = compare(poems[i].text, poems[j].text);
    const bar = '█'.repeat(Math.round(sim * 20));
    console.log(`  ${poems[i].name} ↔ ${poems[j].name}: ${sim} ${bar}`);
  }
}
