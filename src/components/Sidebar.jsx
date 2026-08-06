import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const Sidebar = ({open,onClose}) => {
    return (
    <div className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-[18%] md:min-h-screen border-r-2 border-slate-200 bg-white transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <button onClick={onClose} className='md:hidden absolute top-4 right-4 text-gray-500 text-2xl leading-none cursor-pointer' aria-label='Close menu'>×</button>
        <div className='flex flex-col gap-4 pt-6 pl-6 md:pl-[20%] text-[15px]'>
            <NavLink onClick={onClose} end className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/">
                <svg className='w-5 h-5' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4B5563' }}>
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <p className='hidden md:block'>Dashboard</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/add">
                <img className='w-5 h-5' src={assets.add_icon} alt="" />
                <p className='hidden md:block'>Add Product</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/list">
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>Products</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/orders">
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>Orders</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/reviews">
                <svg className='w-5 h-5' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4B5563' }}>
                    <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
                </svg>
                <p className='hidden md:block'>Reviews</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/manual-invoice">
                <svg className='w-5 h-5' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4B5563' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                <p className='hidden md:block'>Manual Invoice</p>
            </NavLink>
            <NavLink onClick={onClose} className='flex items-center gap-3 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg hover:bg-blue-50 transition-colors' to="/manual-invoice-history">
                <svg className='w-5 h-5' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4B5563' }}>
                    <path d="M3 3v5h5" />
                    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                    <path d="M12 7v5l4 2" />
                </svg>
                <p className='hidden md:block'>Invoice History</p>
            </NavLink>
        </div>
    </div>
    )
}

export default Sidebar
