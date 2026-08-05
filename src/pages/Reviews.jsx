import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const StarRating = ({ rating, size = 14 }) => {
  return (
    <span className='inline-flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ fontSize: size }} className={star <= rating ? 'text-amber-500' : 'text-slate-300'}>★</span>
      ))}
    </span>
  )
}

const EditModal = ({ review, onClose, onSaved }) => {
  const [rating, setRating] = useState(review.rating)
  const [title, setTitle] = useState(review.title || '')
  const [description, setDescription] = useState(review.description || '')
  const [status, setStatus] = useState(review.status)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const response = await axios.post(backendUrl + '/api/review/admin-update', {
        reviewId: review.reviewId,
        rating,
        title,
        description,
        status
      }, { headers: { token: localStorage.getItem('token') } })
      if (response.data.success) {
        toast.success(response.data.message)
        onSaved()
        onClose()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50' onClick={onClose}>
      <div className='bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl' onClick={(e) => e.stopPropagation()}>
        <div className='sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl'>
          <h3 className='font-semibold text-gray-800'>Edit Review</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl leading-none' aria-label='Close'>×</button>
        </div>
        <div className='p-5 flex flex-col gap-4'>
          <div className='flex items-center gap-3'>
            {review.productImage && <img src={review.productImage} alt="" className='w-12 h-auto object-contain rounded-lg border border-slate-200 bg-white' />}
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-gray-800 truncate'>{review.productName}</p>
              <p className='text-xs text-gray-400'>Order: {review.orderId}</p>
            </div>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-700 mb-2'>Rating</p>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type='button' onClick={() => setRating(star)} className={`text-2xl leading-none ${star <= rating ? 'text-amber-500' : 'text-slate-300'} hover:scale-110 transition-transform`}>★</button>
              ))}
            </div>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-700 mb-1'>Title</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary' maxLength={60} />
          </div>
          <div>
            <p className='text-sm font-medium text-gray-700 mb-1'>Review</p>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary' maxLength={500} />
            <p className='text-xs text-gray-400 mt-1'>{description.length}/500</p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-700 mb-1'>Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none'>
              <option value="Approved">Approved (Visible to customers)</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} className='w-full py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50'>
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Reviews = ({token}) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [editing, setEditing] = useState(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/review/list', {
        search: search || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter || undefined
      }, { headers: { token } })
      if (response.data.success) {
        setReviews(response.data.reviews)
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
    fetchReviews()
  }, [token])

  const toggleStatus = async (review) => {
    const next = review.status === 'Approved' ? 'Hidden' : 'Approved'
    try {
      const response = await axios.post(backendUrl + '/api/review/status', { reviewId: review.reviewId, status: next }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchReviews()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteReview = async (review) => {
    const confirmed = window.confirm('Are you sure you want to delete this review? This action cannot be undone.')
    if (!confirmed) return
    try {
      const response = await axios.post(backendUrl + '/api/review/admin-delete', { reviewId: review.reviewId }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchReviews()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <div>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4'>
        <h3 className='text-lg font-semibold text-gray-800'>Customer Reviews</h3>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400'>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if (e.key === 'Enter') fetchReviews() }} type="text" placeholder="Search customer, product, order..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-44' />
          </div>
          <select value={statusFilter} onChange={(e)=>{ setStatusFilter(e.target.value); }} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Hidden">Hidden</option>
          </select>
          <select value={ratingFilter} onChange={(e)=>{ setRatingFilter(e.target.value); }} className='px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-gray-700 outline-none'>
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
          </select>
          <button onClick={fetchReviews} className='px-3 py-2 text-sm border border-slate-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors'>Apply</button>
        </div>
      </div>
      <p className='text-sm text-gray-500 mb-3'>{reviews.length} review{reviews.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className='min-h-[40vh] flex items-center justify-center'>
          <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-3'>💬</p>
          <p className='font-medium'>No reviews found</p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {reviews.map((review) => (
            <div key={review.reviewId} className={`bg-white rounded-xl border overflow-hidden ${review.status === 'Hidden' ? 'border-red-200 bg-red-50/40' : 'border-slate-200'}`}>
              <div className='flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 bg-gray-50'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span className='text-sm font-bold text-gray-800'>{review.reviewId}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${review.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{review.status}</span>
                  {review.verified && <span className='text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>VERIFIED</span>}
                </div>
                <span className='text-xs text-gray-400 shrink-0'>{new Date(review.date).toLocaleString()}</span>
              </div>
              <div className='p-5'>
                <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
                  {review.productImage && (
                    <img src={review.productImage} alt="" className='w-20 h-auto object-contain rounded-lg border border-slate-200 bg-white shrink-0' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-gray-800'>{review.productName}</p>
                    <div className='flex items-center gap-2 mt-1'>
                      <StarRating rating={review.rating} />
                      {review.title && <p className='text-sm font-medium text-gray-700'>“{review.title}”</p>}
                    </div>
                    <p className='text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-wrap'>{review.description}</p>
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400'>
                      <span>{review.customerName}</span>
                      <span>{review.customerEmail}</span>
                      <span>Order: {review.orderId}</span>
                      <span>{review.helpful || 0} found this helpful</span>
                      {review.updatedDate && <span>Edited: {new Date(review.updatedDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className='flex flex-row sm:flex-col gap-2 shrink-0'>
                    <button onClick={() => setEditing(review)} className='flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors'>Edit</button>
                    <button onClick={() => toggleStatus(review)} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${review.status === 'Approved' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {review.status === 'Approved' ? 'Hide' : 'Approve'}
                    </button>
                    <button onClick={() => deleteReview(review)} className='flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors'>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchReviews}
        />
      )}
    </div>
  )
}

export default Reviews
