import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decompose, compose, analyze, findRhymes,
  vowelHarmonyAnalysis, structuralPattern, isSyllable,
  fingerprint, compare
} from './hangul.js';

describe('decompose', () => {
  it('decomposes 한 correctly', () => {
    const d = decompose('한');
    assert.equal(d.cho, 'ㅎ');
    assert.equal(d.jung, 'ㅏ');
    assert.equal(d.jong, 'ㄴ');
    assert.equal(d.hasJong, true);
  });

  it('decomposes 가 (no jongseong)', () => {
    const d = decompose('가');
    assert.equal(d.cho, 'ㄱ');
    assert.equal(d.jung, 'ㅏ');
    assert.equal(d.jong, null);
    assert.equal(d.hasJong, false);
  });

  it('decomposes 뷁 (complex)', () => {
    const d = decompose('뷁');
    assert.equal(d.cho, 'ㅂ');
    assert.equal(d.jung, 'ㅞ');
    assert.equal(d.jong, 'ㄺ');
  });

  it('returns null for non-Hangul', () => {
    assert.equal(decompose('A'), null);
    assert.equal(decompose('1'), null);
    assert.equal(decompose('あ'), null);
  });
});

describe('compose', () => {
  it('composes 한 from jamo', () => {
    assert.equal(compose('ㅎ', 'ㅏ', 'ㄴ'), '한');
  });

  it('composes 가 without jongseong', () => {
    assert.equal(compose('ㄱ', 'ㅏ'), '가');
  });

  it('roundtrips decompose → compose', () => {
    const chars = '한글은아름다운문자입니다';
    for (const ch of chars) {
      const d = decompose(ch);
      const recomposed = compose(d.cho, d.jung, d.jong || undefined);
      assert.equal(recomposed, ch, `Failed roundtrip for ${ch}`);
    }
  });
});

describe('isSyllable', () => {
  it('identifies Hangul syllables', () => {
    assert.equal(isSyllable('가'), true);
    assert.equal(isSyllable('힣'), true);  // last syllable
    assert.equal(isSyllable('A'), false);
    assert.equal(isSyllable('ㄱ'), false);  // jamo, not syllable
  });
});

describe('analyze', () => {
  it('counts syllables correctly', () => {
    const result = analyze('한글');
    assert.equal(result.totalSyllables, 2);
    assert.equal(result.withJong, 2);  // 한(ㄴ), 글(ㄹ)
  });

  it('detects vowel harmony tendency', () => {
    // 양성모음 위주
    const bright = analyze('하하하');
    assert.equal(bright.vowelHarmony.tendency, '양성 (bright)');

    // 음성모음 위주
    const dark = analyze('허허허');
    assert.equal(dark.vowelHarmony.tendency, '음성 (dark)');
  });

  it('computes frequency distributions', () => {
    const result = analyze('가가나');
    assert.equal(result.choFreq['ㄱ'], 2);
    assert.equal(result.choFreq['ㄴ'], 1);
  });

  it('handles mixed text (ignores non-Hangul)', () => {
    const result = analyze('Hello 세계! 123');
    assert.equal(result.totalSyllables, 2);
  });
});

describe('findRhymes', () => {
  it('finds syllables with same ending', () => {
    // 산, 간, 만 all end in ㅏ+ㄴ
    const rhymes = findRhymes('산간만');
    assert.ok(rhymes['ㅏㄴ']);
    assert.equal(rhymes['ㅏㄴ'].length, 3);
  });
});

describe('vowelHarmonyAnalysis', () => {
  it('maps words to harmony patterns', () => {
    const patterns = vowelHarmonyAnalysis('아버지');
    assert.equal(patterns.length, 1);
    assert.equal(patterns[0].word, '아버지');
    // 아(ㅏ=+) 버(ㅓ=-) 지(ㅣ=·)
    assert.equal(patterns[0].pattern, '+-·');
  });
});

describe('structuralPattern', () => {
  it('shows CV/CVC structure', () => {
    const pattern = structuralPattern('한글');
    assert.equal(pattern, 'CVC CVC');
  });

  it('handles open syllables', () => {
    const pattern = structuralPattern('가나다');
    assert.equal(pattern, 'CV CV CV');
  });

  it('handles mixed', () => {
    const pattern = structuralPattern('사랑');
    assert.equal(pattern, 'CV CVC');
  });
});

describe('poetry analysis', () => {
  it('analyzes 서시 opening', () => {
    const text = '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를';
    const result = analyze(text);
    assert.ok(result.totalSyllables > 0);

    const harmony = vowelHarmonyAnalysis(text);
    assert.ok(harmony.length > 0);

    const rhymes = findRhymes(text);
    assert.ok(Object.keys(rhymes).length > 0);
  });
});

describe('fingerprint', () => {
  it('returns null for empty text', () => {
    assert.equal(fingerprint(''), null);
    assert.equal(fingerprint('Hello 123'), null);
  });

  it('computes fingerprint for Korean text', () => {
    const fp = fingerprint('하늘을 우러러 한 점 부끄럼이 없기를');
    assert.ok(fp);
    assert.ok(fp.totalSyllables > 0);
    assert.ok(fp.brightness >= -1 && fp.brightness <= 1);
    assert.ok(fp.weight >= 0 && fp.weight <= 1);
    assert.ok(fp.consonantDiversity >= 0 && fp.consonantDiversity <= 1);
    assert.ok(fp.vowelDiversity >= 0 && fp.vowelDiversity <= 1);
    assert.ok(fp.topCho.length > 0);
    assert.ok(fp.topJung.length > 0);
  });

  it('bright text has positive brightness', () => {
    const fp = fingerprint('하하하 나나나 오호호');
    assert.ok(fp.brightness > 0);
  });

  it('dark text has negative brightness', () => {
    const fp = fingerprint('허허허 너너너 우후후');
    assert.ok(fp.brightness < 0);
  });

  it('heavy text has high weight', () => {
    // All closed syllables
    const fp = fingerprint('한글문장');
    assert.ok(fp.weight > 0.5);
  });

  it('light text has low weight', () => {
    // All open syllables
    const fp = fingerprint('가나다라마바사');
    assert.equal(fp.weight, 0);
  });
});

describe('compare', () => {
  it('identical texts have similarity 1', () => {
    const sim = compare('한글은 아름다운 문자입니다', '한글은 아름다운 문자입니다');
    assert.equal(sim, 1);
  });

  it('similar texts have high similarity', () => {
    const sim = compare(
      '하늘을 우러러 한 점 부끄럼이 없기를',
      '하늘을 바라보며 한 줌 부끄러움이 없도록'
    );
    assert.ok(sim > 0.8, `Expected > 0.8, got ${sim}`);
  });

  it('very different texts have lower similarity', () => {
    const sim = compare(
      '하하하 나나나 가가가',  // all bright, all open
      '헉 뻥 뿅 쿵 퍽 쩝'     // mixed, all closed
    );
    assert.ok(sim < 0.8, `Expected < 0.8, got ${sim}`);
  });

  it('returns null for non-Korean text', () => {
    assert.equal(compare('Hello', 'World'), null);
  });
});
