import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ImageUploader from '../components/ImageUploader'
import CategoryManager from '../components/CategoryManager'
import { parseSpecs, serializeSpecs } from '../utils/specs'

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const Edit = ({token}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([])
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Battery Chargers");
  const [bestseller, setBestseller] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [stock, setStock] = useState("In Stock");
  const [specs, setSpecs] = useState([]);
  const [options, setOptions] = useState([]);

  const addSpec = () => setSpecs(prev => [...prev, { name: '', value: '' }]);
  const removeSpec = (index) => setSpecs(prev => prev.filter((_, i) => i !== index));
  const updateSpec = (index, field, value) => setSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));

  const addOption = () => setOptions(prev => [...prev, { name: '', values: [''] }]);
  const removeOption = (index) => setOptions(prev => prev.filter((_, i) => i !== index));
  const updateOptionName = (index, value) => setOptions(prev => prev.map((o, i) => i === index ? { ...o, name: value } : o));
  const addOptionValue = (index) => setOptions(prev => prev.map((o, i) => i === index ? { ...o, values: [...o.values, ''] } : o));
  const removeOptionValue = (index, vIndex) => setOptions(prev => prev.map((o, i) => i === index ? { ...o, values: o.values.filter((_, vi) => vi !== vIndex) } : o));
  const updateOptionValue = (index, vIndex, value) => setOptions(prev => prev.map((o, i) => i === index ? { ...o, values: o.values.map((v, vi) => vi === vIndex ? value : v) } : o));

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await axios.post(backendUrl + '/api/product/single', { productId: id });
        if (response.data.success) {
          const product = response.data.product;
          const { specs: parsedSpecs, rest } = parseSpecs(product.description);
          const specMap = {};
          parsedSpecs.forEach(s => { specMap[s.name.trim().toLowerCase()] = s.value.trim(); });
          setSpecs(parsedSpecs);
          setStock(product.stock || specMap['stock'] || 'In Stock');
          let baseName = product.name;
          const brand = product.subCategory || specMap['brand'] || '';
          if (brand && baseName.startsWith(brand)) {
            baseName = baseName.slice(brand.length).trim();
          }
          setName(baseName);
          setDescription(rest);
          setPrice(product.price);
          setCategory(product.category);
          setFeatured(!!product.featured);
          setBestseller(!!product.bestseller);
          setImages((product.image || []).map((url, idx) => ({ key: 'existing-' + url + '-' + idx, src: url, file: null, isExisting: true })));
          setOptions(Array.isArray(product.options) ? product.options.map(o => ({ name: o.name || '', values: Array.isArray(o.values) ? [...o.values] : [] })) : []);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (images.length < 1) {
      toast.error('At least 1 product image is required');
      return;
    }
    setSaving(true);
    try {
      const validSpecs = specs.filter(s => s.name.trim() && s.value.trim());
      const specMap = {};
      validSpecs.forEach(s => { specMap[s.name.trim().toLowerCase()] = s.value.trim(); });

      const brand = specMap['brand'] || '';
      const ampereValue = specMap['ampere'] || '';
      const amperes = ampereValue ? ampereValue.split(',').map(v => v.trim()).filter(Boolean) : [];
      const stockValue = specMap['stock'] || stock;

      const finalName = brand ? `${brand} ${name}`.trim() : name;
      const finalDescription = serializeSpecs(validSpecs, description);

      const existingImages = images.filter((i) => i.isExisting).map((i) => i.src);

      const formData = new FormData()
      formData.append("id", id)
      formData.append("name", finalName)
      formData.append("description", finalDescription)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("subCategory", brand || "Voltique Hub")
      formData.append("bestseller", bestseller)
      formData.append("featured", featured)
      formData.append("stock", stockValue)
      formData.append("sizes", JSON.stringify(amperes))
      formData.append("options", JSON.stringify(options
        .map(o => ({ name: o.name.trim(), values: o.values.map(v => v.trim()).filter(Boolean) }))
        .filter(o => o.name && o.values.length > 0)))
      formData.append("existingImages", JSON.stringify(existingImages))
      images.filter((i) => !i.isExisting).forEach((item) => formData.append("images", item.file))

      const response = await axios.post(backendUrl + "/api/product/update", formData, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message)
        navigate('/list')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='min-h-[50vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-4'>
      <div className='w-full flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-800'>Edit Product</h3>
        <button type='button' onClick={() => navigate('/list')} className='text-sm text-gray-500 hover:text-primary'>← Back to Products</button>
      </div>
      <div className='w-full'>
        <ImageUploader images={images} setImages={setImages} />
      </div>
      <div className='w-full'>
        <p className='mb-2'>Product Name</p>
        <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='e.g. Automatic Battery Charger 6A' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Description</p>
        <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' placeholder='Write content here' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Specifications</p>
        <div className='flex flex-col gap-2 max-w-[640px]'>
          {specs.map((spec, i) => (
            <div key={i} className='flex items-center gap-2'>
              <input
                onChange={(e)=>updateSpec(i, 'name', e.target.value)}
                value={spec.name}
                className='w-[200px] sm:w-[220px] px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
                type="text"
                placeholder='Specification Name (e.g. Brand)'
              />
              <input
                onChange={(e)=>updateSpec(i, 'value', e.target.value)}
                value={spec.value}
                className='flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
                type="text"
                placeholder='Specification Value'
              />
              <button type="button" onClick={()=>removeSpec(i)} className='px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0' title='Delete Specification' aria-label='Delete Specification'>
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSpec} className='mt-2 px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors'>
          + Add Specification
        </button>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Options <span className='text-xs font-normal text-gray-400'>(Selectable fields shown as buttons on the product page)</span></p>
        <div className='flex flex-col gap-4 max-w-[640px]'>
          {options.map((option, oi) => (
            <div key={oi} className='border border-slate-300 rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <input
                  onChange={(e)=>updateOptionName(oi, e.target.value)}
                  value={option.name}
                  className='w-[200px] sm:w-[240px] px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
                  type="text"
                  placeholder='Field Name (e.g. Ampere)'
                />
                <button type="button" onClick={()=>removeOption(oi)} className='px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0' title='Delete Field' aria-label='Delete Field'>
                  <TrashIcon />
                </button>
              </div>
              <div className='flex flex-col gap-2 mt-2'>
                {option.values.map((value, vi) => (
                  <div key={vi} className='flex items-center gap-2'>
                    <input
                      onChange={(e)=>updateOptionValue(oi, vi, e.target.value)}
                      value={value}
                      className='flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary'
                      type="text"
                      placeholder='Selectable value (e.g. 4A)'
                    />
                    <button type="button" onClick={()=>removeOptionValue(oi, vi)} className='px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0' title='Delete Value' aria-label='Delete Value'>
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={()=>addOptionValue(oi)} className='mt-2 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors'>
                + Add Value
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className='mt-2 px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors'>
          + Add Field
        </button>
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <CategoryManager value={category} onChange={setCategory} />
        <div>
          <p className='mb-2'>Product Price</p>
          <input onChange={(e)=>setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]' type="Number" required />
        </div>
      </div>

      <div className='flex gap-6 mt-2'>
        <div className='flex gap-2 items-center'>
          <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id="bestseller" />
          <label className='cursor-pointer text-sm' htmlFor="bestseller">Bestseller</label>
        </div>
        <div className='flex gap-2 items-center'>
          <input onChange={() => setFeatured(prev => !prev)} checked={featured} type="checkbox" id="featured" />
          <label className='cursor-pointer text-sm' htmlFor="featured">Featured Product</label>
        </div>
      </div>

      <div className='flex gap-3 mt-4'>
        <button type="submit" disabled={saving} className='w-32 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
        <button type='button' onClick={() => navigate('/list')} disabled={saving} className='w-28 py-3 border border-slate-300 text-gray-700 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50'>
          CANCEL
        </button>
      </div>
    </form>
  )
}

export default Edit
