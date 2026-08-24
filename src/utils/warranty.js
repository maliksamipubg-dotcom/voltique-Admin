// Client-side helpers shared by the Warranty Card pages. Mirrors the backend
// logic in backend/utils/warrantyHelper.js so the Admin Panel can preview the
// same warranty resolution (product warranty data -> description fallback).

const NO_WARRANTY_RE = /^(no\s*warranty|no|none|nil|null|n\/a|na|without\s*warranty|0)(\s*(months?|mos?|years?|yrs?|days?|weeks?))?$|^0\s*$|^out\s*of\s*warranty$/i

const UNIT_TO_MONTHS = {
  year: 12, years: 12, yr: 12, yrs: 12,
  month: 1, months: 1, mo: 1, mos: 1,
  week: 0.25, weeks: 0.25,
  day: 1 / 30, days: 1 / 30,
}

export const parseWarrantyMonths = (label) => {
  const text = String(label || '').trim().replace(/\s+/g, ' ')
  if (!text || NO_WARRANTY_RE.test(text)) return null
  let months = 0
  let matched = false
  const re = /(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?|weeks?|days?)\b/gi
  let m
  while ((m = re.exec(text)) !== null) {
    matched = true
    const value = parseFloat(m[1])
    const unit = m[2].toLowerCase()
    months += value * (UNIT_TO_MONTHS[unit] != null ? UNIT_TO_MONTHS[unit] : 0)
  }
  if (!matched) return null
  return Math.round(months) > 0 ? Math.round(months) : null
}

export const normalizeWarrantyLabel = (label) =>
  String(label || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()) || 'No Warranty'

export const resolveProductWarranty = (product) => {
  let raw = ''
  if (product && product.warranty != null && String(product.warranty).trim() !== '') {
    raw = String(product.warranty).trim()
  }
  if (!raw && product && typeof product.description === 'string') {
    const m = product.description.match(/(?:^|[.;]\s*)Warranty\s*:\s*((?:[^.;\\]|\\.)+)/i)
    if (m) raw = m[1].trim()
  }
  const months = parseWarrantyMonths(raw)
  if (!months) return { hasWarranty: false, periodLabel: 'No Warranty', periodMonths: null }
  return { hasWarranty: true, periodLabel: normalizeWarrantyLabel(raw), periodMonths: months }
}

export const addMonthsToDate = (timestamp, months) => {
  const d = new Date(timestamp)
  const whole = Math.floor(months)
  const fraction = months - whole
  const day = d.getDate()
  d.setMonth(d.getMonth() + whole)
  if (Number.isInteger(months)) {
    if (d.getDate() !== day) d.setDate(0)
  } else if (fraction > 0) {
    d.setDate(d.getDate() + Math.round(fraction * 30))
  }
  return d.getTime()
}

export const DEFAULT_COVERS = ['Manufacturing defects', 'Charging circuit faults', 'Internal component defects']

export const DEFAULT_EXCLUDES = ['Physical damage', 'Water/liquid damage', 'Burn damage', 'Incorrect usage', 'Unauthorized repairs']

export const DEFAULT_TERMS = [
  'This warranty card is valid only for the original purchaser and is non-transferable.',
  'The original purchase invoice or receipt must be presented for any warranty claim.',
  'The warranty period starts from the purchase date mentioned on this card.',
  'Voltique Hub will repair or replace defective parts at its own discretion.',
  'Repair or replacement time may vary depending on parts availability.',
  'The warranty becomes void if the product seal or warranty sticker is removed or damaged.',
].join(' ')

// "24 August 2026"
export const fmtLongDate = (ts) => {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}
