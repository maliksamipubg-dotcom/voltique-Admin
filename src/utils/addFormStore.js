const STORAGE_KEY = 'voltique_add_product_draft'

let draftImages = null

export const saveAddForm = (state) => {
  const { images: draft, ...serializable } = state
  draftImages = draft
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // Ignore storage quota / availability errors — the form still works for this session.
  }
}

export const loadAddForm = () => {
  let saved = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {
    saved = null
  }
  return {
    ...(saved || {}),
    images: draftImages || []
  }
}

export const clearAddForm = () => {
  draftImages = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors.
  }
}
