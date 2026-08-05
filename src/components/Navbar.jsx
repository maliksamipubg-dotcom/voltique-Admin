import React from 'react'
import { assets } from '../assets/assets'

const Navbar = ({setToken,onMenuClick}) => {
return (
    <div className='flex items-center py-3 px-3 sm:px-[4%] justify-between border-b border-slate-200 bg-white sticky top-0 z-20'>
        <div className='flex items-center gap-3'>
            <button onClick={onMenuClick} className='md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 text-gray-600 cursor-pointer' aria-label='Toggle menu'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <img className='brand-logo' src={assets.logo} alt='Voltique Hub' />
        </div>
        <button onClick={()=>setToken('')} className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm cursor-pointer'>Logout</button>
    </div>
)
}

export default Navbar
