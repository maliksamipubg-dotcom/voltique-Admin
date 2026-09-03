import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary bg-white text-sm'

const EditManualInvoice = ({token, invoice, onClose, onUpdate}) => {
  const [products,setProducts] = useState([])
  const [productsLoading,setProductsLoading] = useState(true)
  const [search,setSearch] = useState('')

  const [customer,setCustomer] = useState({ name:'', phone:'', email:'', address:'', city:'', state:'', postalCode:'', country:'' })
  const [items,setItems] = useState([])
  const [paymentMethod,setPaymentMethod] = useState('COD')
  const [discount,setDiscount] = useState('')
  const [advancePayment,setAdvancePayment] = useState('')
  const [shippingCharges,setShippingCharges] = useState('')
  const [notes,setNotes] = useState('')
  const [saving,setSaving] = useState(false)

  useEffect(()=>{
    if (invoice) {
      setCustomer({
        name: invoice.customer?.name || '',
        phone: invoice.customer?.phone || '',
        email: invoice.customer?.email || '',
        address: invoice.customer?.address || '',
        city: invoice.customer?.city || '',
        state: invoice.customer?.state || '',
        postalCode: invoice.customer?.postalCode || '',
        country: invoice.customer?.country || '',
      })
      setItems(invoice.items || [])
      setPaymentMethod(invoice.paymentMethod || 'COD')
      setDiscount(invoice.discount || '')
      setAdvancePayment(invoice.advancePayment || '')
      setShippingCharges(invoice.shippingCharges || '')
      setNotes(invoice.notes || '')
    }
  },[invoice])

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

  useEffect(()=>{
    fetchProducts()
  },[])

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.subCategory || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const addProduct = (product) => {
    setItems((prev) => {
      if (prev.some((it) => it.productId === product._id)) return prev
      return [...prev, {
        productId: product._id,
        name: product.name,
        image: product.image || [],
        category: product.category || '',
        size: 'Default',
        originalPrice: product.price || 0,
        price: product.price || 0,
        quantity: 1,
      }]
    })
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItemPrice = (index, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, price: Number(value) || 0 } : it)))
  }

  const updateItemQuantity = (index, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, Number(value) || 1) } : it)))
  }

  const subtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
  const shipping = Number(shippingCharges) || 0
  const disc = Number(discount) || 0
  const adv = Number(advancePayment) || 0
  const grandTotal = Math.max(0, subtotal + shipping - disc)
  const remainingBalance = Math.max(0, grandTotal - adv)

  const saveInvoice = async () => {
    if (!customer.name.trim()) return toast.error('Customer Name is required')
    if (!customer.phone.trim()) return toast.error('Phone Number is required')
    if (!customer.address.trim()) return toast.error('Address is required')
    if (items.length === 0) return toast.error('Select at least one product')

    setSaving(true)
    try {
      const response = await axios.post(backendUrl + '/api/manual-invoice/update', {
        invoiceId: invoice._id,
        customer,
        items,
        paymentMethod,
        discount: disc,
        advancePayment: adv,
        shippingCharges: shipping,
        notes,
      }, { headers: { token } })

      if (!response.data.success) {
        toast.error(response.data.message)
        return
      }

      toast.success('Invoice updated successfully')
      onUpdate(response.data.invoice)
      onClose()
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50' onClick={onClose}>
      <div className='bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl' onClick={(e) => e.stopPropagation()}>
        <div className='sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10'>
          <div>
            <h3 className='text-lg font-semibold text-gray-800'>Edit Manual Invoice</h3>
            <p className='text-sm text-gray-500'>Invoice #{invoice?.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-slate-100 rounded-lg transition-colors'>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className='p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'>
            {/* Left column: customer + invoice details */}
            <div className='flex flex-col gap-5 min-w-0'>
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
                <p className='text-sm font-semibold text-gray-800 mb-4'>Customer Details</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Customer Name <span className='text-red-500'>*</span></p>
                    <input value={customer.name} onChange={(e)=>setCustomer({ ...customer, name: e.target.value })} className={inputClass} type="text" placeholder='e.g. Ali Raza' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Phone Number <span className='text-red-500'>*</span></p>
                    <input value={customer.phone} onChange={(e)=>setCustomer({ ...customer, phone: e.target.value })} className={inputClass} type="text" placeholder='e.g. 0300 1234567' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Email <span className='text-gray-400'>(Optional)</span></p>
                    <input value={customer.email} onChange={(e)=>setCustomer({ ...customer, email: e.target.value })} className={inputClass} type="email" placeholder='e.g. customer@gmail.com' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Address <span className='text-red-500'>*</span></p>
                    <input value={customer.address} onChange={(e)=>setCustomer({ ...customer, address: e.target.value })} className={inputClass} type="text" placeholder='e.g. House # 12, Street 5, Gulberg, Lahore' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>City <span className='text-gray-400'>(Optional)</span></p>
                    <input value={customer.city} onChange={(e)=>setCustomer({ ...customer, city: e.target.value })} className={inputClass} type="text" placeholder='e.g. Karachi' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>State / Province <span className='text-gray-400'>(Optional)</span></p>
                    <input value={customer.state} onChange={(e)=>setCustomer({ ...customer, state: e.target.value })} className={inputClass} type="text" placeholder='e.g. Sindh' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Postal Code <span className='text-gray-400'>(Optional)</span></p>
                    <input value={customer.postalCode} onChange={(e)=>setCustomer({ ...customer, postalCode: e.target.value })} className={inputClass} type="text" placeholder='e.g. 75500' />
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Country <span className='text-gray-400'>(Optional)</span></p>
                    <input value={customer.country} onChange={(e)=>setCustomer({ ...customer, country: e.target.value })} className={inputClass} type="text" placeholder='e.g. Pakistan' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
                <p className='text-sm font-semibold text-gray-800 mb-4'>Payment Method</p>
                <div>
                  <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} className={inputClass}>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
              </div>

              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
                <p className='text-sm font-semibold text-gray-800 mb-4'>Additional Fields <span className='text-xs font-normal text-gray-400'>(Optional)</span></p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Shipping Charges <span className='text-gray-400'>(Optional)</span></p>
                    <div className='flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary bg-white'>
                      <span className='pl-3 text-sm text-gray-500'>{currency}</span>
                      <input value={shippingCharges} onChange={(e)=>setShippingCharges(e.target.value)} className='w-full px-3 py-2 outline-none text-sm bg-transparent' type="number" min="0" step="any" placeholder='0' />
                    </div>
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Discount</p>
                    <div className='flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary bg-white'>
                      <span className='pl-3 text-sm text-gray-500'>{currency}</span>
                      <input value={discount} onChange={(e)=>setDiscount(e.target.value)} className='w-full px-3 py-2 outline-none text-sm bg-transparent' type="number" min="0" step="any" placeholder='0' />
                    </div>
                  </div>
                  <div>
                    <p className='mb-1.5 text-sm text-gray-600'>Advance Payment</p>
                    <div className='flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary bg-white'>
                      <span className='pl-3 text-sm text-gray-500'>{currency}</span>
                      <input value={advancePayment} onChange={(e)=>setAdvancePayment(e.target.value)} className='w-full px-3 py-2 outline-none text-sm bg-transparent' type="number" min="0" step="any" placeholder='0' />
                    </div>
                  </div>
                  <div className='sm:col-span-2'>
                    <p className='mb-1.5 text-sm text-gray-600'>Notes</p>
                    <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder='Any notes to show on the invoice...' />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: products */}
            <div className='flex flex-col gap-5 min-w-0'>
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                  <p className='text-sm font-semibold text-gray-800'>Add Products</p>
                  <div className='flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white flex-1 sm:max-w-[280px]'>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='text-gray-400 shrink-0'>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input value={search} onChange={(e)=>setSearch(e.target.value)} type="text" placeholder="Search products by name..." className='outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent' />
                  </div>
                </div>

                {productsLoading ? (
                  <div className='py-8 flex items-center justify-center'>
                    <div className='w-6 h-6 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className='text-sm text-gray-400 text-center py-8'>No products found</p>
                ) : (
                  <div className='max-h-[300px] overflow-y-auto flex flex-col gap-1.5 pr-1'>
                    {filteredProducts.map((product) => {
                      const alreadyAdded = items.some((it) => it.productId === product._id)
                      return (
                        <div key={product._id} className='flex items-center gap-3 border border-slate-200 rounded-lg p-2 hover:border-primary/60 transition-colors'>
                          {product.image && product.image[0] && (
                            <img src={product.image[0]} alt="" className='w-10 h-10 object-contain rounded-md border border-slate-100 bg-white shrink-0' />
                          )}
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium text-gray-800 leading-snug truncate'>{product.name}</p>
                            <p className='text-xs text-gray-400'>{product.subCategory || 'Voltique Hub'} · {currency} {product.price}</p>
                          </div>
                          <button
                            onClick={() => addProduct(product)}
                            disabled={alreadyAdded}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${alreadyAdded ? 'bg-green-50 text-green-600 cursor-default' : 'bg-primary text-white hover:bg-primary-dark'}`}
                          >
                            <PlusIcon /> {alreadyAdded ? 'Added' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5'>
                <p className='text-sm font-semibold text-gray-800 mb-4'>Selected Products <span className='text-xs font-normal text-gray-400'>({items.length})</span></p>

                {items.length === 0 ? (
                  <p className='text-sm text-gray-400 text-center py-6'>No products selected yet. Search and add products above.</p>
                ) : (
                  <div className='flex flex-col gap-3'>
                    {items.map((item, index) => {
                      const lineTotal = (item.price || 0) * (item.quantity || 1)
                      return (
                        <div key={item.productId || index} className='border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3'>
                          {item.image && item.image[0] && (
                            <img src={item.image[0]} alt="" className='w-12 h-12 object-contain rounded-md border border-slate-100 bg-white shrink-0' />
                          )}
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium text-gray-800 leading-snug'>{item.name}</p>
                            <p className='text-xs text-gray-400'>Original Price: <span className='line-through'>{currency} {item.originalPrice}</span></p>
                            <div className='flex flex-wrap items-center gap-3 mt-2'>
                              <div>
                                <p className='text-[11px] text-gray-400 mb-0.5'>Selling Price ({currency})</p>
                                <input
                                  value={item.price}
                                  onChange={(e)=>updateItemPrice(index, e.target.value)}
                                  className='w-24 px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-primary text-sm'
                                  type="number"
                                  min="0"
                                  step="any"
                                />
                              </div>
                              <div>
                                <p className='text-[11px] text-gray-400 mb-0.5'>Quantity</p>
                                <input
                                  value={item.quantity}
                                  onChange={(e)=>updateItemQuantity(index, e.target.value)}
                                  className='w-20 px-2 py-1.5 border border-slate-300 rounded-md outline-none focus:border-primary text-sm'
                                  type="number"
                                  min="1"
                                  step="1"
                                />
                              </div>
                              <div className='ml-auto text-right'>
                                <p className='text-[11px] text-gray-400 mb-0.5'>Line Total</p>
                                <p className='text-sm font-bold text-primary'>{currency} {lineTotal.toLocaleString()}</p>
                              </div>
                              <button onClick={()=>removeItem(index)} className='px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0' title='Remove product' aria-label='Remove product'>
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totals + save */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 items-start mt-5'>
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div className='flex flex-col gap-1.5 text-sm min-w-0'>
                <div className='flex justify-between gap-8'>
                  <span className='text-gray-500'>Subtotal</span>
                  <span className='font-semibold text-gray-800'>{currency} {subtotal.toLocaleString()}</span>
                </div>
                <div className='flex justify-between gap-8'>
                  <span className='text-gray-500'>Shipping Charges</span>
                  <span className='font-semibold text-gray-800'>{currency} {shipping.toLocaleString()}</span>
                </div>
                <div className='flex justify-between gap-8'>
                  <span className='text-gray-500'>Discount</span>
                  <span className='font-semibold text-red-500'>- {currency} {disc.toLocaleString()}</span>
                </div>
                <div className='flex justify-between gap-8'>
                  <span className='text-gray-500'>Advance Payment</span>
                  <span className='font-semibold text-gray-800'>- {currency} {adv.toLocaleString()}</span>
                </div>
                <div className='border-t border-slate-100 my-1'></div>
                <div className='flex justify-between gap-8 text-base'>
                  <span className='font-semibold text-gray-800'>Grand Total</span>
                  <span className='font-bold text-primary'>{currency} {grandTotal.toLocaleString()}</span>
                </div>
                <div className='flex justify-between gap-8'>
                  <span className='font-semibold text-gray-600'>Remaining Balance</span>
                  <span className='font-bold text-green-600'>{currency} {remainingBalance.toLocaleString()}</span>
                </div>
              </div>
              <div className='flex flex-col gap-2 sm:w-56 shrink-0'>
                <button
                  onClick={saveInvoice}
                  disabled={saving}
                  className='w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={onClose} disabled={saving} className='w-full py-3 px-4 border border-slate-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-60'>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditManualInvoice