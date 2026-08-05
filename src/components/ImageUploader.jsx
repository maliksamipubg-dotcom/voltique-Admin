import React, { useState } from 'react'
import { toast } from 'react-toastify'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 6

const ImageUploader = ({ images, setImages }) => {
  const [dragIndex, setDragIndex] = useState(null)

  const addFiles = (fileList) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    const invalid = files.find((f) => !ACCEPTED.includes(f.type))
    if (invalid) {
      toast.error('Only JPG, JPEG, PNG and WEBP formats are supported.')
      return
    }
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per product.`)
      return
    }
    const newItems = files.map((file) => ({
      key: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      src: URL.createObjectURL(file),
      file,
      isExisting: false
    }))
    setImages(prev => [...prev, ...newItems])
    toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added.`)
  }

  const removeImage = (key) => {
    setImages(prev => prev.filter((item) => item.key !== key))
    toast.success('Image removed.')
  }

  const replaceImage = (key, file) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG and WEBP formats are supported.')
      return
    }
    setImages(prev => prev.map((item) => item.key === key ? { ...item, src: URL.createObjectURL(file), file, isExisting: false } : item))
    toast.success('Image replaced.')
  }

  const setAsMain = (key) => {
    setImages(prev => {
      const item = prev.find((i) => i.key === key)
      if (!item) return prev
      return [item, ...prev.filter((i) => i.key !== key)]
    })
  }

  const moveImage = (index, direction) => {
    setImages(prev => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const arr = [...prev]
      const [moved] = arr.splice(index, 1)
      arr.splice(target, 0, moved)
      return arr
    })
  }

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    setImages(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(dropIndex, 0, moved)
      return arr
    })
    setDragIndex(null)
  }

  return (
    <div>
      <div className='flex items-center gap-3 mb-3 flex-wrap'>
        <p className='text-sm font-medium text-gray-700'>Product Images</p>
        <span className='text-xs text-gray-400'>{images.length} / {MAX_IMAGES} (minimum 1)</span>
      </div>

      <div className='flex gap-3 flex-wrap'>
        {images.map((item, index) => (
          <div
            key={item.key}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={`relative w-28 rounded-xl border-2 overflow-hidden bg-white group ${index === 0 ? 'border-blue-600' : 'border-slate-200'} cursor-grab active:cursor-grabbing`}
          >
            <img className='w-full h-auto object-contain' src={item.src} alt="" />
            {index === 0 && (
              <span className='absolute top-1 left-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full'>MAIN</span>
            )}
            <div className='absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5'>
              <div className='flex gap-1.5'>
                <button type='button' onClick={() => setAsMain(item.key)} className='text-[10px] font-semibold bg-white text-gray-800 px-2 py-1 rounded-md hover:bg-blue-50'>Main</button>
                <label className='text-[10px] font-semibold bg-white text-gray-800 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-50'>
                  Replace
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className='hidden' onChange={(e) => { if (e.target.files[0]) replaceImage(item.key, e.target.files[0]); e.target.value = ''; }} />
                </label>
                <button type='button' onClick={() => removeImage(item.key)} className='text-[10px] font-semibold bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600'>Remove</button>
              </div>
              <div className='flex gap-1.5'>
                <button type='button' onClick={() => moveImage(index, -1)} className='text-[10px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-md'>Up</button>
                <button type='button' onClick={() => moveImage(index, 1)} className='text-[10px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-md'>Down</button>
              </div>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <label className='w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors'>
            <span className='text-2xl text-slate-400 leading-none'>+</span>
            <span className='text-[10px] text-slate-500 font-medium'>Add Images</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple className='hidden' onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className='text-xs text-gray-400 mt-2'>Drag & drop images to reorder. The first image is the main product image.</p>
    </div>
  )
}

export default ImageUploader
