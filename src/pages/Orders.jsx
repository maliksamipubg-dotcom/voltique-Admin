import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import {toast} from 'react-toastify'

const statusList = ['Order Placed', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusColors = {
  'Order Placed': 'bg-blue-100 text-blue-700',
  'Order Confirmed': 'bg-indigo-100 text-indigo-700',
  'Processing': 'bg-amber-100 text-amber-700',
  'Packed': 'bg-purple-100 text-purple-700',
  'Shipped': 'bg-sky-100 text-sky-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700'
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-slate-100 text-gray-600'}`}>{status}</span>
);

const isSameDay = (ts, day) => {
  const d = new Date(ts);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const StatCard = ({ label, value, icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };
  return (
    <div className={`border rounded-xl px-4 py-3.5 flex items-center gap-3 ${tones[tone] || tones.blue}`}>
      <span className='text-xl'>{icon}</span>
      <div className='min-w-0'>
        <p className='text-lg font-bold leading-tight break-words'>{value}</p>
        <p className='text-[11px] font-medium opacity-80 truncate'>{label}</p>
      </div>
    </div>
  );
};

const Orders = ({token}) => {
  const [orders,setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [statusFilter,setStatusFilter] = useState("All")
  const [paymentFilter,setPaymentFilter] = useState("All")
  const [dateFilter,setDateFilter] = useState("all")
  const [customFrom,setCustomFrom] = useState("")
  const [customTo,setCustomTo] = useState("")
  const [sortBy,setSortBy] = useState("newest")
  const [savingId,setSavingId] = useState(null)
  const [viewOrder,setViewOrder] = useState(null)
  const [deleteTarget,setDeleteTarget] = useState(null)
  const [deleting,setDeleting] = useState(false)
  const [downloadingId,setDownloadingId] = useState(null)
  const [advanceDrafts,setAdvanceDrafts] = useState({})
  const [savingAdvanceId,setSavingAdvanceId] = useState(null)

  const fetchAllOrders = async ()=>{
    if (!token) return null
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/order/list',{},{headers:{token}})
      if(response.data.success){
        setOrders(response.data.orders)
      }else{
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async ( event, orderId)=>{
    const previous = orders.find(o => o._id === orderId)?.status
    const nextStatus = event.target.value
    if (previous === nextStatus) return
    setSavingId(orderId)
    try {
      const response = await axios.post(backendUrl + '/api/order/status',{orderId, status:nextStatus}, {headers:{token}})
      if (response.data.success) {
        toast.success(`Status updated to "${nextStatus}"`)
        await fetchAllOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSavingId(null)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await axios.post(backendUrl + '/api/order/delete', { orderId: deleteTarget._id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setDeleteTarget(null)
        await fetchAllOrders()
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

  useEffect(()=>{
    fetchAllOrders();
  },[token])

  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const threeDaysAgo = new Date(today); threeDaysAgo.setDate(today.getDate() - 3);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const stats = {
    totalOrders: orders.length,
    todayOrders: orders.filter(o => isSameDay(o.date, today)).length,
    pendingOrders: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length,
    deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
    cancelledOrders: orders.filter(o => o.status === 'Cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  const matchesDate = (order) => {
    const d = order.date;
    switch (dateFilter) {
      case 'today': return isSameDay(d, today);
      case 'yesterday': return isSameDay(d, yesterday);
      case 'last3': return d >= startOfDay(threeDaysAgo);
      case 'last7': return d >= startOfDay(sevenDaysAgo);
      case 'month': return d >= monthStart;
      case 'lastMonth': return d >= lastMonthStart && d <= lastMonthEnd;
      case 'custom': {
        if (!customFrom && !customTo) return true;
        const from = customFrom ? startOfDay(new Date(customFrom)).getTime() : -Infinity;
        const to = customTo ? startOfDay(new Date(customTo)).getTime() + 86400000 : Infinity;
        return d >= from && d < to;
      }
      default: return true;
    }
  };

  const matchesPayment = (order) => {
    switch (paymentFilter) {
      case 'Pending': return !order.payment;
      case 'Paid': return !!order.payment;
      case 'COD': return order.paymentMethod === 'COD';
      default: return true;
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'All' && order.status !== statusFilter) return false
    if (!matchesPayment(order)) return false
    if (!matchesDate(order)) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (order.orderId || '').toLowerCase().includes(q) ||
      ((order.address?.firstName || '') + ' ' + (order.address?.lastName || '')).toLowerCase().includes(q) ||
      (order.address?.phone || '').toLowerCase().includes(q) ||
      (order.address?.email || '').toLowerCase().includes(q) ||
      order.items.some((item) => (item.name || '').toLowerCase().includes(q))
    )
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'oldest': return a.date - b.date;
      case 'high': return b.amount - a.amount;
      case 'low': return a.amount - b.amount;
      default: return b.date - a.date;
    }
  });

  const copyOrderId = (orderId) => {
    navigator.clipboard?.writeText(orderId)
    toast.success('Order ID copied')
  }

  const saveAdvancePayment = async (order) => {
    const value = Number(advanceDrafts[order._id])
    const advance = Number.isFinite(value) && value > 0 ? value : 0
    setSavingAdvanceId(order._id)
    try {
      const response = await axios.post(backendUrl + '/api/order/advance-payment', { orderId: order._id, advancePayment: advance }, { headers: { token } })
      if (response.data.success) {
        toast.success('Advance payment saved')
        setAdvanceDrafts((d) => { const n = { ...d }; delete n[order._id]; return n })
        await fetchAllOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSavingAdvanceId(null)
    }
  }

  const downloadInvoice = async (order) => {
    if (downloadingId) return
    setDownloadingId(order._id)
    try {
      const response = await axios.post(backendUrl + '/api/order/invoice', { orderId: order._id }, { headers: { token }, responseType: 'blob' })
      const contentType = response.headers?.['content-type'] || response.headers?.get?.('content-type') || ''
      const disposition = response.headers?.['content-disposition'] || response.headers?.get?.('content-disposition') || ''
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
        return
      }
      const match = /filename="?([^"]+)"?/.exec(disposition)
      const fileName = match ? match[1] : `Invoice-${order.orderId || order._id}.pdf`
      const url = window.URL.createObjectURL(response.data)
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
      setDownloadingId(null)
    }
  }

  return (
    <div>
      {/* Statistics */}
      <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6'>
        <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" tone="blue" />
        <StatCard label="Today's Orders" value={stats.todayOrders} icon="🕒" tone="indigo" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" tone="amber" />
        <StatCard label="Delivered" value={stats.deliveredOrders} icon="✅" tone="green" />
        <StatCard label="Cancelled" value={stats.cancelledOrders} icon="🚫" tone="red" />
        <StatCard label="Total Revenue" value={`${currency}${stats.totalRevenue.toLocaleString()}`} icon="💰" tone="emerald" />
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 mb-5'>
        <div className='flex flex-col lg:flex-row lg:items-center gap-3'>
          <h3 className='text-lg font-semibold text-gray-800 lg:mr-4'>Orders</h3>
          <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white flex-1 min-w-0'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400'>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} type="text" placeholder="Search by Order ID, customer, email, phone, product..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent' />
          </div>
          <button onClick={fetchAllOrders} className='px-3 py-2 text-sm border border-slate-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors shrink-0'>Refresh</button>
        </div>

        <div className='flex flex-col xl:flex-row gap-3'>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="All">All Statuses</option>
            {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="All">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="COD">COD</option>
            <option value="Paid">Paid</option>
          </select>
          <select value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last3">Last 3 Days</option>
            <option value="last7">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateFilter === 'custom' && (
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <input type="date" value={customFrom} onChange={(e)=>setCustomFrom(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none w-full sm:w-auto' />
              <span className='text-gray-400 text-sm'>to</span>
              <input type="date" value={customTo} onChange={(e)=>setCustomTo(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none w-full sm:w-auto' />
            </div>
          )}
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="high">Highest Amount</option>
            <option value="low">Lowest Amount</option>
          </select>
          {savingId && <p className='text-xs text-gray-400 self-center'>Saving status...</p>}
        </div>
      </div>

      <p className='text-sm text-gray-500 mb-3'>{sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className='min-h-[40vh] flex items-center justify-center'>
          <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-3'>📦</p>
          <p className='font-medium'>No orders match your filters</p>
        </div>
      ) : (
        <div>
          {sortedOrders.map((order,index)=>(
            <div className='border-2 border-gray-200 rounded-xl bg-white mb-4 overflow-hidden' key={order._id || index}>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 px-5 py-3 border-b border-gray-100'>
                <button onClick={() => copyOrderId(order.orderId)} className='flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-primary transition-colors w-fit'>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Order #{order.orderId}
                </button>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-xs text-gray-400'>{new Date(order.date).toLocaleString()}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 p-5'>
                <div className='min-w-0'>
                  <div className='flex flex-col gap-3'>
                    {order.items.map((item, idx)=>(
                      <div key={idx} className='flex items-center gap-3'>
                        {item.image && item.image[0] && (
                          <img src={item.image[0]} alt="" className='w-12 h-auto object-contain rounded-lg border border-slate-200 bg-white' />
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm font-medium text-gray-800 leading-snug line-clamp-1'>{item.name}</p>
                          <p className='text-xs text-gray-400'>Model: {item.size || 'Default'}</p>
                        </div>
                        <div className='text-right shrink-0'>
                          <p className='text-sm font-semibold text-gray-700'>{currency} {item.price}</p>
                          <p className='text-xs text-gray-400'>Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between'>
                    <p className='text-xs text-gray-500'>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm text-gray-500'>Total:</p>
                      <p className='text-base font-bold text-primary'>{currency} {order.amount}</p>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:pl-4 md:border-l md:border-gray-100'>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Customer</p>
                    <p className='text-sm font-semibold text-gray-800'>{(order.address.firstName || '') + " " + (order.address.lastName || '')}</p>
                    <p className='text-sm text-gray-500'>{order.address.phone}</p>
                    {order.address.email && <p className='text-sm text-gray-500 break-words'>{order.address.email}</p>}
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Payment</p>
                    <p className='text-sm text-gray-700'>Method: {order.paymentMethod}</p>
                    <p className='text-sm text-gray-700'>Status: <span className={`font-semibold ${order.payment ? 'text-green-600' : 'text-amber-600'}`}>{order.payment ? 'Paid' : 'Pending'}</span></p>
                    <p className='text-sm text-gray-700'>Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Advance Payment</p>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center border border-gray-300 rounded-md focus-within:border-primary overflow-hidden shrink-0'>
                        <span className='pl-2 text-sm text-gray-500'>{currency}</span>
                        <input
                          type='number'
                          min='0'
                          step='any'
                          value={advanceDrafts[order._id] ?? (order.advancePayment || 0)}
                          onChange={(e) => setAdvanceDrafts((d) => ({ ...d, [order._id]: e.target.value }))}
                          disabled={savingAdvanceId === order._id}
                          placeholder='0'
                          className='w-20 p-2 text-sm text-gray-700 outline-none bg-transparent disabled:opacity-60'
                        />
                      </div>
                      <button
                        onClick={() => saveAdvancePayment(order)}
                        disabled={savingAdvanceId === order._id}
                        className='flex-1 px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-60 whitespace-nowrap'
                      >
                        {savingAdvanceId === order._id ? 'Saving...' : 'Save Advance Payment'}
                      </button>
                    </div>
                    <p className='text-xs text-gray-400 mt-1'>Remaining: {currency} {Math.max(0, (order.amount || 0) - Number(advanceDrafts[order._id] ?? (order.advancePayment || 0))).toLocaleString()}</p>
                  </div>
                  {order.status === 'Cancelled' && (
                    <div className='bg-red-50 border border-red-100 rounded-lg p-3'>
                      <p className='text-xs font-semibold text-red-600 uppercase tracking-wide mb-1'>Cancellation</p>
                      <p className='text-sm text-red-700'>Cancelled By: {order.cancelledBy || 'Customer'}</p>
                      {order.cancelledAt && <p className='text-sm text-red-700'>Date & Time: {new Date(order.cancelledAt).toLocaleString()}</p>}
                    </div>
                  )}
                  <div className='flex flex-col gap-2 mt-auto pt-2'>
                    <div className='flex items-center gap-2'>
                      <select
                        onChange={(event)=>statusHandler(event,order._id)}
                        value={order.status}
                        disabled={savingId === order._id}
                        className='flex-1 p-2 font-semibold border border-gray-300 rounded-md text-sm disabled:opacity-60'
                      >
                        {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => setViewOrder(order)} className='px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shrink-0'>Details</button>
                      <button onClick={() => setDeleteTarget(order)} className='px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0'>Delete</button>
                    </div>
                    <button
                      onClick={() => downloadInvoice(order)}
                      disabled={downloadingId !== null}
                      title='Download Invoice (PDF)'
                      className='w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0'
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" className='shrink-0'>
                        <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#ffffff" />
                        <path d="M14 2v6h6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
                        <text x="12" y="16.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#e11d48" fontFamily="Inter, sans-serif">PDF</text>
                      </svg>
                      {downloadingId === order._id ? 'Generating...' : 'Download Invoice'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {viewOrder && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50' onClick={() => setViewOrder(null)}>
          <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <h3 className='font-semibold text-gray-800'>Order #{viewOrder.orderId}</h3>
                <StatusBadge status={viewOrder.status} />
              </div>
              <button onClick={() => setViewOrder(null)} className='text-gray-400 hover:text-gray-600 text-xl leading-none' aria-label='Close'>×</button>
            </div>
            <div className='p-5 flex flex-col gap-5'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Order Date</p>
                  <p className='font-medium text-gray-800'>{new Date(viewOrder.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Estimated Delivery</p>
                  <p className='font-medium text-gray-800'>{new Date(viewOrder.estimatedDelivery).toLocaleDateString()}</p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Customer</p>
                  <p className='font-semibold text-gray-800'>{(viewOrder.address.firstName || '') + " " + (viewOrder.address.lastName || '')}</p>
                  <p className='text-gray-600'>{viewOrder.address.phone}</p>
                  {viewOrder.address.email && <p className='text-gray-600 break-words'>{viewOrder.address.email}</p>}
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Delivery Address</p>
                  <p className='text-gray-600'>{viewOrder.address.street}</p>
                  <p className='text-gray-600'>{[viewOrder.address.city, viewOrder.address.state].filter(Boolean).join(', ')}, {viewOrder.address.country}</p>
                  {viewOrder.address.zipcode && <p className='text-gray-600'>Postal: {viewOrder.address.zipcode}</p>}
                  {viewOrder.address.notes && <p className='text-gray-500 italic'>Note: {viewOrder.address.notes}</p>}
                </div>
              </div>

              <div>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>Items</p>
                <div className='flex flex-col gap-2'>
                  {viewOrder.items.map((item, idx) => (
                    <div key={idx} className='flex items-center gap-3 border border-slate-100 rounded-lg p-2'>
                      {item.image && item.image[0] && <img src={item.image[0]} alt="" className='w-12 h-auto object-contain rounded-lg border border-slate-200 bg-white' />}
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-gray-800 leading-snug'>{item.name}</p>
                        <p className='text-xs text-gray-400'>Model: {item.size || 'Default'} | Qty: {item.quantity}</p>
                      </div>
                      <p className='text-sm font-semibold text-gray-700 shrink-0'>{currency} {item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Payment</p>
                  <p className='text-gray-700'>Method: {viewOrder.paymentMethod}</p>
                  <p className='text-gray-700'>Status: <span className={`font-semibold ${viewOrder.payment ? 'text-green-600' : 'text-amber-600'}`}>{viewOrder.payment ? 'Paid' : 'Pending'}</span></p>
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Total</p>
                  <p className='text-xl font-bold text-primary'>{currency} {viewOrder.amount}</p>
                </div>
              </div>

              {viewOrder.status === 'Cancelled' && (
                <div className='bg-red-50 border border-red-100 rounded-lg p-4'>
                  <p className='text-xs font-semibold text-red-600 uppercase tracking-wide mb-2'>Cancellation</p>
                  <p className='text-sm text-red-700'>Cancelled By: {viewOrder.cancelledBy || 'Customer'}</p>
                  {viewOrder.cancelledAt && <p className='text-sm text-red-700'>Cancelled Date & Time: {new Date(viewOrder.cancelledAt).toLocaleString()}</p>}
                </div>
              )}

              {viewOrder.statusUpdates && viewOrder.statusUpdates.length > 0 && (
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>Status History</p>
                  <div className='flex flex-col gap-1.5'>
                    {viewOrder.statusUpdates.map((u, i) => (
                      <div key={i} className='flex items-center justify-between text-xs'>
                        <StatusBadge status={u.status} />
                        <span className='text-gray-400'>{new Date(u.date).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setViewOrder(null)} className='w-full py-2.5 text-sm font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors'>CLOSE</button>
            </div>
          </div>
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
            <h3 className='text-center font-semibold text-gray-900'>Delete Order</h3>
            <p className='text-sm text-gray-500 text-center mt-2'>Are you sure you want to permanently delete this order?</p>
            <p className='text-xs text-gray-400 text-center mt-1'>Order #{deleteTarget.orderId}</p>
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

export default Orders
