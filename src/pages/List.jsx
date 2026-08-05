import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const List = ({token}) => {
  const navigate = useNavigate()
  const[list,setList] = useState([])
  const [search,setSearch] = useState("")
  const [viewProduct,setViewProduct] = useState(null)
  const fetchList = async ()=>{
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products);
      }else{
        toast.error(response.data.message)
      }
      
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }
  const removeProduct = async (id) =>{
    const confirmed = window.confirm('Are you sure you want to delete this product? This action cannot be undone.')
    if (!confirmed) return
    try {
      const response  = await axios.post(backendUrl + '/api/product/remove', {id},{headers:{token}})
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      }else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }
  useEffect(()=>{
    fetchList()
  },[])

  const filtered = list.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.subCategory || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2'>
        <p className='text-lg font-semibold text-gray-800'>All Products List</p>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white'>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400'>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} type="text" placeholder="Search products..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400' />
          </div>
          <button onClick={fetchList} className='px-3 py-2 text-sm border border-slate-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors'>Refresh</button>
        </div>
      </div>
      <p className='text-sm text-gray-500 mb-3'>{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-4xl mb-3'>📦</p>
          <p className='font-medium'>No products found</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filtered.map((item, index) => (
            <div key={index} className='bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col'>
              <div className='relative bg-white'>
                <img className='w-full h-auto object-contain' src={item.image[0]} alt="" loading="lazy" />
                <div className='absolute top-2 left-2 flex gap-1.5'>
                  <span className='text-[10px] font-semibold bg-white/90 backdrop-blur px-2 py-0.5 rounded-full'>{item.category}</span>
                  {item.featured && <span className='text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full'>FEATURED</span>}
                  {item.bestseller && <span className='text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full'>BESTSELLER</span>}
                </div>
                <span className={`absolute bottom-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.stock === 'Out of Stock' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                  {item.stock || 'In Stock'}
                </span>
              </div>
              <div className='p-3 flex flex-col flex-1'>
                <p className='text-sm font-semibold text-gray-800 leading-snug line-clamp-2 min-h-[2.5rem]'>{item.name}</p>
                <p className='text-xs text-gray-400 mt-0.5 truncate'>{item.subCategory || 'Voltique Hub'}</p>
                <div className='flex items-center justify-between mt-2'>
                  <div className='flex items-baseline gap-1.5'>
                    <p className='text-base font-bold text-primary'>{currency}{item.price}</p>
                  </div>
                  {item.avgRating > 0 && (
                    <div className='flex items-center gap-1'>
                      <span className='text-amber-500 text-sm'>★</span>
                      <span className='text-xs font-semibold text-gray-700'>{item.avgRating.toFixed(1)}</span>
                      <span className='text-[10px] text-gray-400'>({item.reviewCount})</span>
                    </div>
                  )}
                </div>
                <div className='flex gap-2 mt-auto pt-3 border-t border-slate-100'>
                  <button onClick={() => navigate(`/edit/${item._id}`)} className='flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors'>
                    <EditIcon /> Edit
                  </button>
                  <button onClick={() => setViewProduct(item)} className='flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-slate-100 text-gray-600 rounded-lg hover:bg-slate-200 transition-colors'>
                    <EyeIcon /> View
                  </button>
                  <button onClick={() => removeProduct(item._id)} className='flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors'>
                    <TrashIcon /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewProduct && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50' onClick={() => setViewProduct(null)}>
          <div className='bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl'>
              <h3 className='font-semibold text-gray-800'>Product Details</h3>
              <button onClick={() => setViewProduct(null)} className='text-gray-400 hover:text-gray-600 text-xl leading-none' aria-label='Close'>×</button>
            </div>
            <div className='p-5 flex flex-col gap-4'>
              <div className='flex gap-3 overflow-x-auto pb-1'>
                {(viewProduct.image || []).map((img, i) => (
                  <img key={i} src={img} alt="" className='w-20 h-auto object-contain rounded-lg border border-slate-200 bg-white shrink-0' />
                ))}
              </div>
              <div>
                <h4 className='text-lg font-semibold text-gray-800 leading-snug'>{viewProduct.name}</h4>
                <p className='text-sm text-gray-400 mt-0.5'>{viewProduct.subCategory || 'Voltique Hub'} · {viewProduct.category}</p>
              </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-xl font-bold text-primary'>{currency}{viewProduct.price}</p>
                  </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${viewProduct.stock === 'Out of Stock' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  {viewProduct.stock || 'In Stock'}
                </span>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {(viewProduct.sizes || []).map((s, i) => (
                  <span key={i} className='text-xs bg-slate-100 text-gray-700 px-2.5 py-1 rounded-full'>{s}</span>
                ))}
              </div>
              <div>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Description</p>
                <p className='text-sm text-gray-600 leading-relaxed whitespace-pre-wrap'>{viewProduct.description}</p>
              </div>
              {viewProduct.avgRating > 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-amber-500'>★</span>
                  <span className='text-sm font-semibold text-gray-700'>{viewProduct.avgRating.toFixed(1)}</span>
                  <span className='text-xs text-gray-400'>based on {viewProduct.reviewCount} review{viewProduct.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className='flex gap-2 pt-2'>
                <button onClick={() => { setViewProduct(null); navigate(`/edit/${viewProduct._id}`); }} className='flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity'>Edit Product</button>
                <button onClick={() => setViewProduct(null)} className='flex-1 py-2.5 text-sm font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors'>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default List
