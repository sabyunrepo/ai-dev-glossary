import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const input = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../../../../terms.js', import.meta.url));
const context = { window: {} };
const errors = [];
const warnings = [];

try {
  vm.runInNewContext(await readFile(input, 'utf8'), context, { timeout: 1000 });
  const terms = context.window.GLOSSARY_TERMS;
  if (!Array.isArray(terms) || !terms.length) throw new Error('용어 배열이 없어요.');
  const ids = new Set();
  for (const term of terms) {
    const label = term.id || term.term || '이름 없는 항목';
    for (const field of ['id', 'term', 'category', 'short', 'analogy', 'example', 'emoji', 'analogyEmoji']) {
      if (typeof term[field] !== 'string' || !term[field].trim()) errors.push(`${label}: ${field} 값이 필요해요.`);
    }
    if (!/^t\d+$/.test(term.id || '')) errors.push(`${label}: ID는 t와 숫자로 적어주세요.`);
    if (ids.has(term.id)) errors.push(`${label}: ID가 중복돼요.`);
    ids.add(term.id);
    for (const field of ['aliases', 'related']) {
      if (!Array.isArray(term[field]) || term[field].some(value => typeof value !== 'string')) errors.push(`${label}: ${field}는 글자 배열이어야 해요.`);
    }
    for (const [field, limit] of Object.entries({ short: 90, analogy: 150, example: 120, note: 200 })) {
      if ((term[field]?.length || 0) > limit) warnings.push(`${label}: ${field}가 길어요 (${term[field].length}자). 짧게 다듬을지 살펴보세요.`);
    }
    if (term.sources !== undefined && (!Array.isArray(term.sources) || term.sources.some(source => typeof source.label !== 'string' || !source.label.trim() || typeof source.url !== 'string' || !/^https:\/\//.test(source.url)))) {
      errors.push(`${label}: 출처에는 이름과 https 주소가 필요해요.`);
    }
    if (term.illustration !== undefined) {
      const picture = term.illustration;
      if (!picture || typeof picture !== 'object') {
        errors.push(`${label}: 그림 정보가 올바르지 않아요.`);
      } else {
        if (typeof picture.alt !== 'string' || !picture.alt.trim()) errors.push(`${label}: 그림의 쉬운 대체 설명이 필요해요.`);
        if (!Number.isInteger(picture.width) || picture.width <= 0 || !Number.isInteger(picture.height) || picture.height <= 0) errors.push(`${label}: 그림의 실제 가로·세로 크기가 필요해요.`);
        if (typeof picture.src !== 'string' || !/^assets\/illustrations\/t\d+\.webp$/.test(picture.src)) {
          errors.push(`${label}: 그림은 assets/illustrations 안의 WebP 파일이어야 해요.`);
        } else {
          if (picture.src !== `assets/illustrations/${term.id}.webp`) errors.push(`${label}: 그림 파일 이름이 용어 ID와 달라요.`);
          try { await access(resolve(dirname(input), picture.src)); }
          catch { errors.push(`${label}: 그림 파일 ${picture.src}가 없어요.`); }
        }
      }
    }
    const sample = term.formatExample;
    if (!sample) continue;
    for (const field of ['label', 'language', 'code', 'note']) {
      if (typeof sample[field] !== 'string' || !sample[field].trim()) errors.push(`${label}: 예시의 ${field}가 필요해요.`);
    }
    if (/^json$/i.test(sample.language || '')) {
      try { JSON.parse(sample.code); }
      catch (error) { errors.push(`${label}: JSON 예시를 읽을 수 없어요 (${error.message}).`); }
    }
    if (sample.annotations !== undefined && (!Array.isArray(sample.annotations) || sample.annotations.some(item => typeof item.code !== 'string' || typeof item.text !== 'string' || !item.code.trim() || !item.text.trim()))) {
      errors.push(`${label}: 줄별 설명에는 code와 text가 필요해요.`);
    }
  }
  for (const term of terms) {
    if (!Array.isArray(term.related)) continue;
    if (new Set(term.related).size !== term.related.length) errors.push(`${term.id}: 같은 관련 용어가 반복돼요.`);
    for (const id of term.related) {
      if (!ids.has(id)) errors.push(`${term.id}: 관련 용어 ${id}가 없어요.`);
      if (id === term.id) errors.push(`${term.id}: 자기 자신을 관련 용어로 연결했어요.`);
    }
  }
  for (const warning of warnings) console.warn(`확인: ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`오류: ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`${terms.length}개 용어 확인 완료 · 설명 그림 ${terms.filter(term => term.illustration).length}개 · 파일 예시 ${terms.filter(term => term.formatExample).length}개 · 관련 링크 정상`);
  }
} catch (error) {
  console.error(`오류: ${error.message}`);
  process.exitCode = 1;
}
