import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const PencilIcon = () => (
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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const CategoryManager = ({ value, onChange }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingAdd, setSavingAdd] = useState(false)

  const [manageOpen, setManageOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const token = localStorage.getItem('token')

  const loadCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list')
      if (response.data.success) {
        setCategories(response.data.categories)
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
    loadCategories()
  }, [])

  const saveCategory = async () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      toast.error('Category name is required.')
      return
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists.')
      return
    }
    setSavingAdd(true)
    try {
      const response = await axios.post(backendUrl + '/api/category/add', { name: trimmed }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setNewName('')
        setAddOpen(false)
        await loadCategories()
        onChange(response.data.category.name)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSavingAdd(false)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat._id)
    setEditingName(cat.name)
    setDeleteConfirmId(null)
  }

  const saveEdit = async () => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      toast.error('Category name is required.')
      return
    }
    const current = categories.find((c) => c._id === editingId)
    if (!current) return
    if (current.name.toLowerCase() === trimmed.toLowerCase()) {
      setEditingId(null)
      return
    }
    if (categories.some((c) => c._id !== editingId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists.')
      return
    }
    setSavingEdit(true)
    try {
      const response = await axios.post(backendUrl + '/api/category/update', { id: editingId, name: trimmed }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (value && current.name === value) {
          onChange(trimmed)
        }
        setEditingId(null)
        await loadCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async (cat) => {
    setDeletingId(cat._id)
    try {
      const response = await axios.post(backendUrl + '/api/category/delete', { id: cat._id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (value && cat.name === value) {
          const remaining = categories.filter((c) => c._id !== cat._id)
          onChange(remaining.length > 0 ? remaining[0].name : '')
        }
        setDeleteConfirmId(null)
        await loadCategories()
      } else {
        toast.error(response.data.message)
        setDeleteConfirmId(null)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
      setDeleteConfirmId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <p className='mb-2'>Product Category</p>
      <select value={value} onChange={(e) => onChange(e.target.value)} className='w-full px-3 py-2'>
        {loading && <option value={value}>{value || 'Loading categories...'}</option>}
        {!loading && value && !categories.some((c) => c.name === value) && <option value={value}>{value}</option>}
        {!loading && categories.length === 0 && !value && <option value=''>No categories available</option>}
        {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
      </select>

      <div className='flex flex-wrap items-center gap-2 mt-2'>
        <button type='button' onClick={() => setAddOpen(true)} className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors'>
          <PlusIcon /> Add New Category
        </button>
        <button type='button' onClick={() => setManageOpen(true)} className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors'>
          Manage Categories
        </button>
      </div>

      <style>{`
        @keyframes cat-modal-in { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .cat-modal { animation: cat-modal-in 0.2s ease-out; }
        @keyframes cat-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .cat-overlay { animation: cat-fade-in 0.15s ease-out; }
      `}</style>

      {/* Add Category Modal */}
      {addOpen && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 cat-overlay' onClick={() => setAddOpen(false)}>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-xl p-6 cat-modal' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-900 text-lg'>Add New Category</h3>
              <button type='button' onClick={() => setAddOpen(false)} className='text-gray-400 hover:text-gray-600 text-2xl leading-none' aria-label='Close'>×</button>
            </div>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Category Name</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveCategory(); } }}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
              type='text'
              placeholder='e.g. Inverters'
            />
            <div className='flex gap-3 mt-6'>
              <button type='button' onClick={() => setAddOpen(false)} disabled={savingAdd} className='flex-1 py-2.5 text-sm font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50'>Cancel</button>
              <button type='button' onClick={saveCategory} disabled={savingAdd} className='flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50'>
                {savingAdd ? 'SAVING...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {manageOpen && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 cat-overlay' onClick={() => setManageOpen(false)}>
          <div className='bg-white rounded-2xl max-w-lg w-full max-h-[82vh] flex flex-col shadow-xl cat-modal' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
              <h3 className='font-semibold text-gray-900 text-lg'>Manage Categories</h3>
              <button type='button' onClick={() => setManageOpen(false)} className='text-gray-400 hover:text-gray-600 text-2xl leading-none' aria-label='Close'>×</button>
            </div>
            <div className='p-5 overflow-y-auto flex flex-col gap-2.5'>
              <p className='text-xs text-gray-400 mb-1'>Rename or delete categories. Categories that contain products cannot be deleted.</p>
              {categories.length === 0 ? (
                <p className='text-sm text-gray-400 text-center py-8'>No categories yet. Use "Add New Category" to create one.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat._id} className='border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3'>
                    {editingId === cat._id ? (
                      <>
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') setEditingId(null); }}
                          className='flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
                          type='text'
                        />
                        <div className='flex items-center gap-2 shrink-0'>
                          <button type='button' onClick={saveEdit} disabled={savingEdit} className='flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'>
                            <CheckIcon /> {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button type='button' onClick={() => setEditingId(null)} disabled={savingEdit} className='px-3 py-1.5 text-xs font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50'>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-800 truncate'>{cat.name}</p>
                          <p className='text-xs text-gray-400'>{cat.productCount} product{cat.productCount !== 1 ? 's' : ''}</p>
                        </div>
                        {deleteConfirmId === cat._id ? (
                          <div className='flex items-center gap-2 shrink-0'>
                            <span className='text-xs text-red-600 font-medium'>Delete this category?</span>
                            <button type='button' onClick={() => confirmDelete(cat)} disabled={deletingId === cat._id} className='px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50'>
                              {deletingId === cat._id ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button type='button' onClick={() => setDeleteConfirmId(null)} disabled={deletingId === cat._id} className='px-3 py-1.5 text-xs font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50'>No</button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 shrink-0'>
                            <button type='button' onClick={() => startEdit(cat)} className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors'>
                              <PencilIcon /> Rename
                            </button>
                            <button type='button' onClick={() => setDeleteConfirmId(cat._id)} className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors'>
                              <TrashIcon /> Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryManager
