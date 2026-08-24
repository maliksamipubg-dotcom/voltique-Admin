import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import {
  resolveProductWarranty,
  addMonthsToDate,
  parseWarrantyMonths,
  DEFAULT_COVERS,
  DEFAULT_EXCLUDES,
  DEFAULT_TERMS,
  fmtLongDate,
} from '../utils/warranty'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary bg-white text-sm'

const todayInputValue = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const inputToTs = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.setHours(12, 0, 0, 0)
}

const WarrantyCard = ({ token }) => {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', country: '' })
  const [orderNumber, setOrderNumber] = useState('')
  const [warrantyPeriod, setWarrantyPeriod] = useState('No Warranty')
  const [startDate, setStartDate] = useState(todayInputValue())
  const [customExpiry, setCustomExpiry] = useState('')
  const [expiryTouched, setExpiryTouched] = useState(false)
  const [model, setModel] = useState('Default')
  const [quantity, setQuantity] = useState(1)
  const [coversText, setCoversText] = useState(DEFAULT_COVERS.join('\n'))
  const [excludesText, setExcludesText] = useState(DEFAULT_EXCLUDES.join('\n'))
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)

  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setProducts(response.data.products)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Product warranty loads automatically from the selected product's own data.
  const selectProduct = (product) => {
    setSelected(product)
    const resolved = resolveProductWarranty(product)
    setWarrantyPeriod(resolved.periodLabel)
    setModel((Array.isArray(product.sizes) && product.sizes[0]) || 'Default')
    setQuantity(1)
    setExpiryTouched(false)
    setCustomExpiry('')
  }

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.subCategory || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const startTs = inputToTs(startDate) || Date.now()
  const periodMonths = warrantyPeriod && warrantyPeriod.trim().toLowerCase() !== 'no warranty'
    ? parseWarrantyMonths(warrantyPeriod)
    : null
  const hasWarranty = Boolean(periodMonths)

  const computedExpiryTs = hasWarranty ? addMonthsToDate(startTs, periodMonths) : null
  const expiryTs = expiryTouched && customExpiry ? inputToTs(customExpiry) : computedExpiryTs

  const downloadPdf = async (cardId, fallbackName) => {
    const response = await axios.post(backendUrl + '/api/warranty/pdf', { cardId }, { headers: { token }, responseType: 'blob' })
    const contentType = response.headers?.['content-type'] || ''
    const disposition = response.headers?.['content-disposition'] || ''
    let isPdf = contentType.includes('application/pdf')
    if (!isPdf && typeof response.data.arrayBuffer === 'function') {
      const head = new Uint8Array(await response.data.arrayBuffer()).slice(0, 4)
      isPdf = String.fromCharCode(...head) === '%PDF'
    }
    if (!isPdf) {
      let message = 'Failed to generate warranty card'
      try {
        const parsed = JSON.parse(await response.data.text())
        message = parsed.message || message
      } catch (parseErr) {
        console.log(parseErr)
      }
      toast.error(message)
      return
    }
    const match = /filename="?([^"]+)"?/.exec(disposition)
    const fileName = match ? match[1] : fallbackName
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', country: '' })
    setOrderNumber('')
    setSelected(null)
    setSearch('')
    setWarrantyPeriod('No Warranty')
    setStartDate(todayInputValue())
    setCustomExpiry('')
    setExpiryTouched(false)
    setModel('Default')
    setQuantity(1)
    setCoversText(DEFAULT_COVERS.join('\n'))
    setExcludesText(DEFAULT_EXCLUDES.join('\n'))
    setTerms(DEFAULT_TERMS)
    setNotes('')
  }

  const generateWarrantyCard = async () => {
    if (!customer.name.trim()) return toast.error('Customer Name is required')
    if (!customer.phone.trim()) return toast.error('Phone Number is required')
    if (!selected) return toast.error('Select a product')
    if (!inputToTs(startDate)) return toast.error('A valid warranty start date is required')

    setGenerating(true)
    try {
      const response = await axios.post(backendUrl + '/api/warranty/create-manual', {
        customer,
        orderNumber,
        product: {
          productId: selected._id,
          name: selected.name,
          image: selected.image || [],
          model,
          category: selected.category || '',
          quantity,
        },
        warrantyPeriod: warrantyPeriod.trim(),
        startDate: startTs,
        customExpiryDate: expiryTouched && customExpiry ? expiryTs : null,
        coverage: {
          covers: coversText.split('\n').map((l) => l.trim()).filter(Boolean),
          excludes: excludesText.split('\n').map((l) => l.trim()).filter(Boolean),
        },
        terms,
        notes,
      }, { headers: { token } })

      if (!response.data.success) {
        toast.error(response.data.message)
        return
      }

      const card = response.data.card
      toast.success(`Warranty card ${card.cardNumber} generated`)
      try {
        await downloadPdf(card._id, `Warranty-${card.cardNumber}.pdf`)
      } catch (err) {
        console.log(err)
      }
      resetForm()
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to generate warranty card')
    } finally {
      setGenerating(false)
    }
  }

  const warrantyInfo = useMemo(() => (selected ? resolveProductWarranty(selected) : null), [selected])

  return (
    <div>
      <div className='mb-5'>
        <h3 className='text-lg font-semibold text-gray-800'>Warranty Card Generator</h3>
        <p className='text-sm text-gray-500 mt-0.5'>Create a warranty card manually for WhatsApp / phone / walk-in orders. The warranty period loads automatically from the selected product.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'>
        {/* Left column: customer + warranty details */}
        <div className='flex flex-col gap-5 min-w-0'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
            <p className='text-sm font-semibold text-gray-800 mb-4'>Customer Details</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Customer Name <span className='text-red-500'>*</span></p>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputClass} type="text" placeholder='e.g. Ali Raza' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Phone Number <span className='text-red-500'>*</span></p>
                <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputClass} type="text" placeholder='e.g. 0300 1234567' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Email <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={inputClass} type="email" placeholder='e.g. customer@gmail.com' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Address <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className={inputClass} type="text" placeholder='e.g. House # 12, Street 5' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>City <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} className={inputClass} type="text" placeholder='e.g. Karachi' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>State / Province <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} className={inputClass} type="text" placeholder='e.g. Sindh' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Postal Code <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.postalCode} onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })} className={inputClass} type="text" placeholder='e.g. 75500' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Country <span className='text-gray-400'>(Optional)</span></p>
                <input value={customer.country} onChange={(e) => setCustomer({ ...customer, country: e.target.value })} className={inputClass} type="text" placeholder='e.g. Pakistan' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
            <p className='text-sm font-semibold text-gray-800 mb-4'>Warranty Information</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>
                  Warranty Period
                  {warrantyInfo && (
                    <span className='ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700'>Auto-loaded from product</span>
                  )}
                </p>
                <input value={warrantyPeriod} onChange={(e) => { setWarrantyPeriod(e.target.value); setExpiryTouched(false); setCustomExpiry('') }} className={inputClass} type="text" placeholder='e.g. 3 Months, 1 Year or No Warranty' />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Warranty Start Date</p>
                <input value={startDate} onChange={(e) => { setStartDate(e.target.value); setExpiryTouched(false); setCustomExpiry('') }} className={inputClass} type="date" />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Warranty Expiry Date</p>
                <input
                  value={expiryTouched ? customExpiry : (expiryTs ? new Date(expiryTs).toISOString().slice(0, 10) : '')}
                  onChange={(e) => { setCustomExpiry(e.target.value); setExpiryTouched(true) }}
                  disabled={!hasWarranty}
                  className={inputClass + ' disabled:bg-slate-50 disabled:text-gray-400'}
                  type="date"
                />
                <p className='mt-1 text-xs text-gray-400'>{hasWarranty ? 'Auto-calculated — edit to override.' : 'No warranty — no expiry date applies.'}</p>
              </div>
              <div>
                <p className='mb-1.5 text-sm text-gray-600'>Order Number <span className='text-gray-400'>(Optional)</span></p>
                <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={inputClass} type="text" placeholder='Only if related to a website order' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
            <p className='text-sm font-semibold text-gray-800 mb-4'>Warranty Terms <span className='text-xs font-normal text-gray-400'>(Editable)</span></p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <p className='mb-1.5 text-sm text-green-700 font-medium'>Warranty Covers <span className='text-gray-400'>(one per line)</span></p>
                <textarea value={coversText} onChange={(e) => setCoversText(e.target.value)} rows={5} className={inputClass + ' resize-y'} placeholder={'Manufacturing defects\nCharging circuit faults'} />
              </div>
              <div>
                <p className='mb-1.5 text-sm text-red-600 font-medium'>Does Not Cover <span className='text-gray-400'>(one per line)</span></p>
                <textarea value={excludesText} onChange={(e) => setExcludesText(e.target.value)} rows={5} className={inputClass + ' resize-y'} placeholder={'Physical damage\nWater/liquid damage'} />
              </div>
              <div className='sm:col-span-2'>
                <p className='mb-1.5 text-sm text-gray-600'>Terms & Conditions</p>
                <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} className={inputClass + ' resize-y'} placeholder='Terms & conditions shown on the card...' />
              </div>
              <div className='sm:col-span-2'>
                <p className='mb-1.5 text-sm text-gray-600'>Internal Notes <span className='text-gray-400'>(Optional — not printed on the card)</span></p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder='Any internal notes...' />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: product selection */}
        <div className='flex flex-col gap-5 min-w-0'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
              <p className='text-sm font-semibold text-gray-800'>Select Product <span className='text-red-500'>*</span></p>
              <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white flex-1 sm:max-w-[280px]'>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400 shrink-0'>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search products by name..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent' />
              </div>
            </div>

            {productsLoading ? (
              <div className='py-8 flex items-center justify-center'>
                <div className='w-6 h-6 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-8'>No products found</p>
            ) : (
              <div className='max-h-[340px] overflow-y-auto flex flex-col gap-1.5 pr-1'>
                {filteredProducts.map((product) => {
                  const isSelected = selected && selected._id === product._id
                  const pw = resolveProductWarranty(product)
                  return (
                    <button
                      type="button"
                      key={product._id}
                      onClick={() => selectProduct(product)}
                      className={`flex items-center gap-3 border rounded-lg p-2 text-left transition-colors ${isSelected ? 'border-primary bg-blue-50/60' : 'border-slate-200 hover:border-primary/60'}`}
                    >
                      {product.image && product.image[0] ? (
                        <img src={product.image[0]} alt="" className='w-10 h-10 object-contain rounded-md border border-slate-100 bg-white shrink-0' />
                      ) : (
                        <span className='w-10 h-10 rounded-md border border-slate-100 bg-slate-50 shrink-0'></span>
                      )}
                      <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-medium text-gray-800 leading-snug truncate'>{product.name}</span>
                        <span className='block text-xs text-gray-400'>{product.subCategory || 'Voltique Hub'}</span>
                      </span>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${pw.hasWarranty ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-gray-500'}`}>
                        {pw.periodLabel}
                      </span>
                      {isSelected && (
                        <span className='shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center'><CheckIcon /></span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
            <p className='text-sm font-semibold text-gray-800 mb-4'>Selected Product Details</p>
            {!selected ? (
              <p className='text-sm text-gray-400 text-center py-6'>No product selected yet. Search and pick a product above.</p>
            ) : (
              <div className='flex items-start gap-3'>
                {selected.image && selected.image[0] && (
                  <img src={selected.image[0]} alt="" className='w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white shrink-0' />
                )}
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-gray-800 leading-snug'>{selected.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5'>Warranty: <span className='font-semibold text-green-700'>{warrantyInfo?.periodLabel}</span></p>
                  <div className='flex flex-wrap items-center gap-3 mt-3'>
                    <div>
                      <p className='text-[11px] text-gray-400 mb-0.5'>Model / Variant</p>
                      <input value={model} onChange={(e) => setModel(e.target.value)} className='w-28 px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-primary text-sm' type="text" placeholder='Default' />
                    </div>
                    <div>
                      <p className='text-[11px] text-gray-400 mb-0.5'>Quantity</p>
                      <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className='w-20 px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-primary text-sm' type="number" min="1" step="1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live preview summary */}
          <div className='bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-5'>
            <p className='text-sm font-semibold text-gray-800 mb-3'>Card Preview</p>
            <div className='flex flex-col gap-2 text-sm'>
              <div className='flex justify-between gap-4'>
                <span className='text-gray-500'>Customer</span>
                <span className='font-medium text-gray-800 truncate max-w-[55%]'>{customer.name || '—'}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-gray-500'>Warranty Period</span>
                <span className={`font-semibold ${hasWarranty ? 'text-green-700' : 'text-red-500'}`}>{warrantyPeriod.trim() || 'No Warranty'}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-gray-500'>Start Date</span>
                <span className='font-medium text-gray-800'>{fmtLongDate(startTs)}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-gray-500'>Expiry Date</span>
                <span className='font-medium text-gray-800'>{hasWarranty ? fmtLongDate(expiryTs) : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3'>
        <button onClick={resetForm} disabled={generating} className='sm:w-48 py-3 px-4 border border-slate-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-60'>
          Reset
        </button>
        <button
          onClick={generateWarrantyCard}
          disabled={generating}
          className='sm:w-64 py-3 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
        >
          {generating ? 'Generating...' : 'Generate Warranty Card'}
        </button>
      </div>
    </div>
  )
}

export default WarrantyCard
