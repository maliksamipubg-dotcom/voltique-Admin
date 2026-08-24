import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { fmtLongDate } from '../utils/warranty'

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const PrintIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const sourceBadgeClass = (source) =>
  source === 'Automatic Order' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'

const WarrantyHistory = ({ token }) => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const fetchCards = async () => {
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/warranty/list', {}, { headers: { token } })
      if (response.data.success) {
        setCards(response.data.cards)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [token])

  // Search by customer name, phone number, product, warranty card number or
  // order number — all from a single search box.
  const filtered = cards.filter((card) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (card.cardNumber || '').toLowerCase().includes(q) ||
      (card.orderNumber || '').toLowerCase().includes(q) ||
      (card.customer?.name || '').toLowerCase().includes(q) ||
      (card.customer?.phone || '').toLowerCase().includes(q) ||
      (card.customer?.email || '').toLowerCase().includes(q) ||
      (card.product?.name || '').toLowerCase().includes(q)
    )
  })

  const getPdfBlob = async (card) => {
    const response = await axios.post(backendUrl + '/api/warranty/pdf', { cardId: card._id }, { headers: { token }, responseType: 'blob' })
    const contentType = response.headers?.['content-type'] || ''
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
      return null
    }
    return response.data
  }

  const downloadCard = async (card) => {
    if (busyId) return
    setBusyId(card._id)
    try {
      const blob = await getPdfBlob(card)
      if (!blob) return
      const fileName = `Warranty-${card.cardNumber || card._id}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Warranty card downloaded')
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to download warranty card')
    } finally {
      setBusyId(null)
    }
  }

  const printCard = async (card) => {
    if (busyId) return
    setBusyId(card._id)
    try {
      const blob = await getPdfBlob(card)
      if (!blob) return
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to open warranty card')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await axios.post(backendUrl + '/api/warranty/delete', { cardId: deleteTarget._id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setDeleteTarget(null)
        await fetchCards()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const isExpired = (card) => card.warranty?.hasWarranty && card.expiryDate && card.expiryDate < Date.now()

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2'>
        <p className='text-lg font-semibold text-gray-800'>Warranty Card History</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white flex-1 sm:flex-none sm:min-w-[280px]'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400 shrink-0'>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search by card #, customer, phone, product, order #..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent' />
          </div>
          <button onClick={fetchCards} className='px-3 py-2 text-sm border border-slate-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors shrink-0'>Refresh</button>
        </div>
      </div>
      <p className='text-sm text-gray-500 mb-3'>{filtered.length} warranty card{filtered.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className='min-h-[40vh] flex items-center justify-center'>
          <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-3'>🛡️</p>
          <p className='font-medium'>No warranty cards found</p>
        </div>
      ) : (
        <div>
          {filtered.map((card) => (
            <div className='border-2 border-gray-200 rounded-xl bg-white mb-4 overflow-hidden' key={card._id}>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 px-5 py-3 border-b border-gray-100'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <p className='text-sm font-bold text-gray-800'>#{card.cardNumber}</p>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sourceBadgeClass(card.source)}`}>
                    {card.source === 'Automatic Order' ? 'Automatic Order' : 'Manual'}
                  </span>
                  {card.warranty?.hasWarranty ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isExpired(card) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {isExpired(card) ? 'Expired' : 'Active'}
                    </span>
                  ) : (
                    <span className='text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-gray-500'>No Warranty</span>
                  )}
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  {card.orderNumber && <span className='text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md'>Order #{card.orderNumber}</span>}
                  <span className='text-xs text-gray-400'>{new Date(card.date).toLocaleString()}</span>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 p-5'>
                <div className='min-w-0 flex gap-3'>
                  {card.product?.image && card.product.image[0] && (
                    <img src={card.product.image[0]} alt="" className='w-14 h-auto object-contain rounded-lg border border-slate-200 bg-white self-start' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-gray-800 leading-snug'>{card.product?.name}</p>
                    <p className='text-xs text-gray-400 mt-0.5'>Model: {card.product?.model || 'Default'} | Qty: {card.product?.quantity || 1}</p>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4'>
                      <div className='bg-slate-50 border border-slate-100 rounded-lg p-2.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Period</p>
                        <p className={`text-sm font-bold ${card.warranty?.hasWarranty ? 'text-green-700' : 'text-red-500'}`}>{card.warranty?.periodLabel || 'No Warranty'}</p>
                      </div>
                      <div className='bg-slate-50 border border-slate-100 rounded-lg p-2.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Start Date</p>
                        <p className='text-sm font-semibold text-gray-800'>{fmtLongDate(card.startDate)}</p>
                      </div>
                      <div className='bg-slate-50 border border-slate-100 rounded-lg p-2.5'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Expiry Date</p>
                        <p className='text-sm font-semibold text-gray-800'>{card.warranty?.hasWarranty ? fmtLongDate(card.expiryDate) : '—'}</p>
                      </div>
                    </div>
                    {card.notes && <p className='text-xs text-gray-500 mt-3 break-words italic'>Note: {card.notes}</p>}
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:pl-4 md:border-l md:border-gray-100'>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Customer</p>
                    <p className='text-sm font-semibold text-gray-800'>{card.customer?.name}</p>
                    <p className='text-sm text-gray-500'>{card.customer?.phone}</p>
                    {card.customer?.email && <p className='text-sm text-gray-500 break-words'>{card.customer?.email}</p>}
                    {(card.customer?.address || card.customer?.city) && (
                      <p className='text-sm text-gray-500 break-words'>
                        {[card.customer?.address, card.customer?.city, card.customer?.state, card.customer?.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-3 gap-2 mt-auto pt-2'>
                    <button
                      onClick={() => downloadCard(card)}
                      disabled={busyId !== null}
                      className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      <DownloadIcon /> {busyId === card._id ? '...' : 'Download'}
                    </button>
                    <button
                      onClick={() => printCard(card)}
                      disabled={busyId !== null}
                      className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-slate-100 text-gray-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      <PrintIcon /> Print
                    </button>
                    <button
                      onClick={() => setDeleteTarget(card)}
                      disabled={busyId !== null}
                      className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50' onClick={() => setDeleteTarget(null)}>
          <div className='bg-white rounded-2xl max-w-sm w-full shadow-xl p-6' onClick={(e) => e.stopPropagation()}>
            <div className='w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4'>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-red-600'>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className='text-center font-semibold text-gray-900'>Delete Warranty Card</h3>
            <p className='text-sm text-gray-500 text-center mt-2'>Are you sure you want to permanently delete this warranty card?</p>
            <p className='text-xs text-gray-400 text-center mt-1'>#{deleteTarget.cardNumber} — {deleteTarget.product?.name}</p>
            <div className='flex gap-3 mt-6'>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className='flex-1 py-2.5 text-sm font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50'>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className='flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50'>
                {deleting ? 'DELETING...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarrantyHistory
