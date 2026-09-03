import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import EditManualInvoice from './EditManualInvoice'

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

const ManualInvoiceHistory = ({token}) => {
  const [invoices,setInvoices] = useState([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState('')
  const [deleteTarget,setDeleteTarget] = useState(null)
  const [deleting,setDeleting] = useState(false)
  const [busyId,setBusyId] = useState(null)
  const [editingInvoice,setEditingInvoice] = useState(null)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/manual-invoice/list', {}, { headers: { token } })
      if (response.data.success) {
        setInvoices(response.data.invoices)
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

  useEffect(()=>{
    fetchInvoices()
  },[token])

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.customer?.name || '').toLowerCase().includes(q) ||
      (inv.customer?.phone || '').toLowerCase().includes(q) ||
      (inv.customer?.email || '').toLowerCase().includes(q) ||
      (inv.items || []).some((it) => (it.name || '').toLowerCase().includes(q))
    )
  })

  const getPdfBlob = async (invoice) => {
    const response = await axios.post(backendUrl + '/api/manual-invoice/pdf', { invoiceId: invoice._id }, { headers: { token }, responseType: 'blob' })
    const contentType = response.headers?.['content-type'] || response.headers?.get?.('content-type') || ''
    let isPdf = contentType.includes('application/pdf')
    if (!isPdf && typeof response.data.arrayBuffer === 'function') {
      const head = new Uint8Array(await response.data.arrayBuffer()).slice(0, 4)
      isPdf = String.fromCharCode(...head) === '%PDF'
    }
    if (!isPdf) {
      let message = 'Failed to generate invoice'
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

  const downloadInvoice = async (invoice) => {
    if (busyId) return
    setBusyId(invoice._id)
    try {
      const blob = await getPdfBlob(invoice)
      if (!blob) return
      const fileName = `Invoice-${invoice.invoiceNumber || invoice._id}.pdf`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Invoice downloaded')
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to download invoice')
    } finally {
      setBusyId(null)
    }
  }

  const printInvoice = async (invoice) => {
    if (busyId) return
    setBusyId(invoice._id)
    try {
      const blob = await getPdfBlob(invoice)
      if (!blob) return
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to open invoice')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await axios.post(backendUrl + '/api/manual-invoice/delete', { invoiceId: deleteTarget._id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setDeleteTarget(null)
        await fetchInvoices()
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

  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2'>
        <p className='text-lg font-semibold text-gray-800'>Manual Invoice History</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white flex-1 sm:flex-none sm:min-w-[260px]'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400 shrink-0'>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} type="text" placeholder="Search by invoice #, customer, phone, product..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent' />
          </div>
          <button onClick={fetchInvoices} className='px-3 py-2 text-sm border border-slate-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors shrink-0'>Refresh</button>
        </div>
      </div>
      <p className='text-sm text-gray-500 mb-3'>{filtered.length} invoice{filtered.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className='min-h-[40vh] flex items-center justify-center'>
          <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-3'>🧾</p>
          <p className='font-medium'>No manual invoices found</p>
        </div>
      ) : (
        <div>
          {filtered.map((invoice) => (
            <div className='border-2 border-gray-200 rounded-xl bg-white mb-4 overflow-hidden' key={invoice._id}>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 px-5 py-3 border-b border-gray-100'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-bold text-gray-800'>#{invoice.invoiceNumber}</p>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-xs text-gray-400'>{new Date(invoice.date).toLocaleString()}</span>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 p-5'>
                <div className='min-w-0'>
                  <div className='flex flex-col gap-3'>
                    {(invoice.items || []).map((item, idx) => (
                      <div key={idx} className='flex items-center gap-3'>
                        {item.image && item.image[0] && (
                          <img src={item.image[0]} alt="" className='w-12 h-auto object-contain rounded-lg border border-slate-200 bg-white' />
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm font-medium text-gray-800 leading-snug line-clamp-1'>{item.name}</p>
                          <p className='text-xs text-gray-400'>Original: {currency} {item.originalPrice} | Qty: {item.quantity}</p>
                        </div>
                        <div className='text-right shrink-0'>
                          <p className='text-sm font-semibold text-gray-700'>{currency} {item.price}</p>
                          <p className='text-xs text-gray-400'>Line: {currency} {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between'>
                    <p className='text-xs text-gray-500'>{(invoice.items || []).length} item{(invoice.items || []).length !== 1 ? 's' : ''}</p>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm text-gray-500'>Grand Total:</p>
                      <p className='text-base font-bold text-primary'>{currency} {invoice.grandTotal}</p>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:pl-4 md:border-l md:border-gray-100'>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Customer</p>
                    <p className='text-sm font-semibold text-gray-800'>{invoice.customer?.name}</p>
                    <p className='text-sm text-gray-500'>{invoice.customer?.phone}</p>
                    {invoice.customer?.email && <p className='text-sm text-gray-500 break-words'>{invoice.customer?.email}</p>}
                    <p className='text-sm text-gray-500 break-words'>{invoice.customer?.address}</p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Amounts</p>
                    <p className='text-sm text-gray-700'>Subtotal: {currency} {invoice.subtotal.toLocaleString()}</p>
                    {invoice.discount > 0 && <p className='text-sm text-gray-700'>Discount: - {currency} {invoice.discount.toLocaleString()}</p>}
                    <p className='text-sm text-gray-700'>Advance: - {currency} {invoice.advancePayment.toLocaleString()}</p>
                    <p className='text-sm font-semibold text-green-600'>Remaining: {currency} {invoice.remainingBalance.toLocaleString()}</p>
                  </div>
                  {invoice.notes && (
                    <div>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Notes</p>
                      <p className='text-sm text-gray-600 break-words'>{invoice.notes}</p>
                    </div>
                  )}
                  <div className='flex flex-col gap-2 mt-auto pt-2'>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        onClick={() => downloadInvoice(invoice)}
                        disabled={busyId !== null}
                        className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                      >
                        <DownloadIcon /> {busyId === invoice._id ? '...' : 'Download'}
                      </button>
                      <button
                        onClick={() => printInvoice(invoice)}
                        disabled={busyId !== null}
                        className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-slate-100 text-gray-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                      >
                        <PrintIcon /> Print
                      </button>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        onClick={() => setEditingInvoice(invoice)}
                        disabled={busyId !== null}
                        className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(invoice)}
                        disabled={busyId !== null}
                        className='flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                      >
                        <TrashIcon /> Delete
                      </button>
                    </div>
                    <p className='text-[11px] text-gray-400 text-center'>PDFs are identical to automatic order invoices</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <EditManualInvoice
          token={token}
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onUpdate={(updatedInvoice) => {
            setInvoices((prev) => prev.map((inv) => inv._id === updatedInvoice._id ? updatedInvoice : inv))
            setEditingInvoice(null)
          }}
        />
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
            <h3 className='text-center font-semibold text-gray-900'>Delete Manual Invoice</h3>
            <p className='text-sm text-gray-500 text-center mt-2'>Are you sure you want to permanently delete this invoice?</p>
            <p className='text-xs text-gray-400 text-center mt-1'>Invoice #{deleteTarget.invoiceNumber}</p>
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

export default ManualInvoiceHistory
