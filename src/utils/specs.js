const escapeSpecText = (text) => (text || '')
  .replace(/\\/g, '\\\\')
  .replace(/([.;])(?=\s)/g, '\\$1');

const unescapeSpecText = (text) => {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\' && (text[i + 1] === '\\' || text[i + 1] === '.' || text[i + 1] === ';')) {
      out += text[i + 1];
      i += 1;
    } else {
      out += text[i];
    }
  }
  return out;
};

const findValueEnd = (str) => {
  for (let i = 0; i < str.length; i += 1) {
    if (str[i] === '\\') {
      i += 1;
      continue;
    }
    if ((str[i] === '.' || str[i] === ';') && /\s/.test(str[i + 1] || '')) {
      return i;
    }
  }
  return -1;
};

export const serializeSpecs = (specs, description = '') => {
  const specString = (specs || [])
    .filter((s) => s && s.name && s.name.trim() && s.value && s.value.trim())
    .map((s) => `${escapeSpecText(s.name.trim())}: ${escapeSpecText(s.value.trim())}`)
    .join('. ');
  return specString ? `${specString}. ${description}` : description;
};

export const parseSpecs = (desc) => {
  const specs = [];
  let rest = desc || '';
  while (rest) {
    const m = rest.match(/^([^:]{1,100}?):\s*/);
    if (!m) break;
    const name = unescapeSpecText(m[1].trim());
    if (!name) break;
    const afterName = rest.slice(m[0].length);
    const valueEnd = findValueEnd(afterName);
    if (valueEnd === -1) break;
    const value = unescapeSpecText(afterName.slice(0, valueEnd).trim());
    if (!value) break;
    specs.push({ name, value });
    rest = afterName.slice(valueEnd + 1);
  }
  return { specs, rest: rest.trim() };
};

export const getSpecValue = (desc, specName) => {
  const text = desc || '';
  const namePattern = String(specName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = text.match(new RegExp(`(?:^|[.;]\\s*)\\s*${namePattern}\\s*:`, 'i'));
  if (!m) return null;
  const after = text.slice(m.index + m[0].length);
  const valueEnd = findValueEnd(after);
  const raw = valueEnd === -1 ? after : after.slice(0, valueEnd);
  const value = unescapeSpecText(raw.trim());
  return value || null;
};
