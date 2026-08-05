import React, { useState } from 'react'
import CategoryManager from '../components/CategoryManager'

const Categories = () => {
  const [category, setCategory] = useState('')

  return (
    <div>
      <div className='mb-5'>
        <h3 className='text-lg font-semibold text-gray-800'>Manage Categories</h3>
        <p className='text-sm text-gray-500 mt-1'>Create, rename and delete product categories.</p>
      </div>
      <div className='bg-white rounded-xl border border-slate-200 p-5 max-w-xl shadow-card'>
        <CategoryManager value={category} onChange={setCategory} />
      </div>
    </div>
  )
}

export default Categories
