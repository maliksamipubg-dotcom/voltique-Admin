import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

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
  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[status] || 'bg-slate-100 text-gray-600'}`}>{status}</span>
);

const Icon = ({ children, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);

const PackageIcon = () => <Icon><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></Icon>;
const CartIcon = () => <Icon><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></Icon>;
const UsersIcon = () => <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
const DollarIcon = () => <Icon><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>;
const ClockIcon = () => <Icon><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>;
const CogIcon = () => <Icon><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></Icon>;
const TruckIcon = () => <Icon><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Icon>;
const CheckCircleIcon = () => <Icon><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></Icon>;
const XCircleIcon = () => <Icon><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></Icon>;
const SunIcon = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></Icon>;
const CalendarIcon = () => <Icon><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></Icon>;
const TrendingUpIcon = () => <Icon><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon>;
const PlusIcon = () => <Icon><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
const ListIcon = () => <Icon><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></Icon>;
const ClipboardListIcon = () => <Icon><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></Icon>;
const TagsIcon = () => <Icon><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" /><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></Icon>;
const RefreshIcon = () => <Icon><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></Icon>;
const ArrowUpRightIcon = () => <Icon className="w-3.5 h-3.5"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></Icon>;
const ArrowDownRightIcon = () => <Icon className="w-3.5 h-3.5"><path d="m7 7 10 10" /><path d="M17 7v10H7" /></Icon>;
const AlertTriangleIcon = () => <Icon><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>;
const EyeIcon = () => <Icon><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" /></Icon>;
const ChevronRightIcon = () => <Icon className="w-4 h-4"><path d="m9 18 6-6-6-6" /></Icon>;
const ShoppingBagIcon = () => <Icon><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></Icon>;

const StatCard = ({ title, value, icon, iconBg, iconColor }) => (
  <div className='group bg-white rounded-2xl border border-slate-100 shadow-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover'>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${iconBg} ${iconColor}`}>{icon}</div>
    <p className='text-2xl font-bold tracking-tight text-slate-800 break-words'>{value}</p>
    <p className='text-[13px] font-medium text-slate-500 mt-1'>{title}</p>
  </div>
);

const SalesCard = ({ title, value, icon, iconBg, iconColor, trend }) => (
  <div className='group bg-white rounded-2xl border border-slate-100 shadow-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover'>
    <div className='flex items-center gap-3'>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${iconBg} ${iconColor}`}>{icon}</div>
      <p className='text-[13px] font-semibold text-slate-500'>{title}</p>
    </div>
    <p className='text-2xl font-bold tracking-tight text-slate-800 mt-3 break-words'>{value}</p>
    {trend !== null && trend !== undefined ? (
      <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
        {Math.abs(trend).toFixed(1)}% vs previous
      </p>
    ) : (
      <p className='text-xs text-slate-400 mt-1.5'>No prior period data</p>
    )}
  </div>
);

const SectionTitle = ({ title, subtitle, action }) => (
  <div className='flex flex-wrap items-end justify-between gap-3 mb-4'>
    <div>
      <h2 className='text-lg font-bold text-slate-800'>{title}</h2>
      {subtitle && <p className='text-sm text-slate-500 mt-0.5'>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const QuickAction = ({ label, sub, icon, color, onClick }) => (
  <button onClick={onClick} className='group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover text-left cursor-pointer w-full'>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${color}`}>{icon}</div>
    <div className='min-w-0'>
      <p className='text-sm font-semibold text-slate-800'>{label}</p>
      <p className='text-xs text-slate-400 mt-0.5'>{sub}</p>
    </div>
    <span className='ml-auto text-slate-300 transition-colors group-hover:text-primary'>
      <ChevronRightIcon />
    </span>
  </button>
);

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const Dashboard = ({ token }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState(null);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.post(backendUrl + '/api/order/list', {}, { headers: { token } }),
        axios.get(backendUrl + '/api/product/list')
      ]);
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      } else {
        toast.error(ordersRes.data.message);
      }
      if (productsRes.data.success) {
        setProducts(productsRes.data.products || []);
      } else {
        toast.error(productsRes.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const now = new Date();
  const today = startOfDay(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  const weekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset));
  const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const prevWeekStart = startOfDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7));
  const prevMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const delivered = orders.filter(o => o.status === 'Delivered');
  const sumAmount = (arr) => arr.reduce((s, o) => s + (o.amount || 0), 0);

  const todayRevenue = sumAmount(delivered.filter(o => o.date >= today.getTime()));
  const yesterdayRevenue = sumAmount(delivered.filter(o => o.date >= yesterday.getTime() && o.date < today.getTime()));
  const weekRevenue = sumAmount(delivered.filter(o => o.date >= weekStart.getTime()));
  const monthRevenue = sumAmount(delivered.filter(o => o.date >= monthStart.getTime()));
  const lifetimeRevenue = sumAmount(delivered);
  const prevWeekRevenue = sumAmount(delivered.filter(o => o.date >= prevWeekStart.getTime() && o.date < weekStart.getTime()));
  const prevMonthRevenue = sumAmount(delivered.filter(o => o.date >= prevMonthStart.getTime() && o.date < monthStart.getTime()));

  const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

  const countByStatus = (...statuses) => orders.filter(o => statuses.includes(o.status)).length;

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalCustomers: new Set(orders.map(o => o.userId).filter(Boolean)).size,
    totalRevenue: lifetimeRevenue,
    pending: countByStatus('Order Placed'),
    processing: countByStatus('Order Confirmed', 'Processing', 'Packed'),
    shipped: countByStatus('Shipped', 'Out for Delivery'),
    delivered: countByStatus('Delivered'),
    cancelled: countByStatus('Cancelled')
  };

  const recentOrders = [...orders].sort((a, b) => b.date - a.date).slice(0, 10);

  const salesByProduct = {};
  orders.filter(o => o.status !== 'Cancelled').forEach(order => {
    (order.items || []).forEach(item => {
      const key = item._id || item.name;
      if (!salesByProduct[key]) {
        salesByProduct[key] = { name: item.name || 'Unknown', image: item.image && item.image[0], qty: 0, revenue: 0 };
      }
      salesByProduct[key].qty += item.quantity || 1;
      salesByProduct[key].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const topSelling = Object.values(salesByProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxSold = topSelling.length ? topSelling[0].qty : 1;

  const lowStock = products.filter(p => String(p.stock || 'In Stock').toLowerCase() !== 'in stock');

  const customerName = (order) => ((order.address?.firstName || '') + ' ' + (order.address?.lastName || '')).trim() || 'Customer';
  const fmtAmount = (v) => `${currency} ${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800 heading-font'>Dashboard</h1>
          <p className='text-sm text-slate-500 mt-0.5'>{greeting()} — here's the latest activity for Voltique Hub, {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>
        <button onClick={fetchAllData} className='flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 shadow-card hover:border-primary hover:text-primary transition-colors cursor-pointer w-fit'>
          <RefreshIcon /> Refresh Data
        </button>
      </div>

      {/* Summary cards */}
      <section>
        <SectionTitle title="Overview" subtitle="Live store statistics" />
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4'>
          <StatCard title="Total Products" value={stats.totalProducts.toLocaleString()} icon={<PackageIcon />} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={<CartIcon />} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard title="Total Customers" value={stats.totalCustomers.toLocaleString()} icon={<UsersIcon />} iconBg="bg-violet-50" iconColor="text-violet-600" />
          <StatCard title="Total Revenue" value={fmtAmount(stats.totalRevenue)} icon={<DollarIcon />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Pending Orders" value={stats.pending.toLocaleString()} icon={<ClockIcon />} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <StatCard title="Processing Orders" value={stats.processing.toLocaleString()} icon={<CogIcon />} iconBg="bg-orange-50" iconColor="text-orange-600" />
          <StatCard title="Shipped Orders" value={stats.shipped.toLocaleString()} icon={<TruckIcon />} iconBg="bg-sky-50" iconColor="text-sky-600" />
          <StatCard title="Delivered Orders" value={stats.delivered.toLocaleString()} icon={<CheckCircleIcon />} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatCard title="Cancelled Orders" value={stats.cancelled.toLocaleString()} icon={<XCircleIcon />} iconBg="bg-red-50" iconColor="text-red-600" />
        </div>
      </section>

      {/* Sales overview */}
      <section>
        <SectionTitle title="Sales Overview" subtitle="Revenue from delivered orders" />
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <SalesCard title="Today's Revenue" value={fmtAmount(todayRevenue)} icon={<SunIcon />} iconBg="bg-amber-50" iconColor="text-amber-600" trend={pct(todayRevenue, yesterdayRevenue)} />
          <SalesCard title="This Week Revenue" value={fmtAmount(weekRevenue)} icon={<CalendarIcon />} iconBg="bg-sky-50" iconColor="text-sky-600" trend={pct(weekRevenue, prevWeekRevenue)} />
          <SalesCard title="This Month Revenue" value={fmtAmount(monthRevenue)} icon={<CalendarIcon />} iconBg="bg-indigo-50" iconColor="text-indigo-600" trend={pct(monthRevenue, prevMonthRevenue)} />
          <SalesCard title="Total Lifetime Revenue" value={fmtAmount(lifetimeRevenue)} icon={<TrendingUpIcon />} iconBg="bg-emerald-50" iconColor="text-emerald-600" trend={null} />
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <SectionTitle
          title="Recent Orders"
          subtitle="Latest 10 orders"
          action={
            <button onClick={() => navigate('/orders')} className='flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer'>
              View All Orders <ChevronRightIcon />
            </button>
          }
        />
        <div className='bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden'>
          {recentOrders.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-slate-400'>
              <ShoppingBagIcon />
              <p className='text-sm font-medium mt-3'>No orders yet</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left min-w-[880px]'>
                <thead>
                  <tr className='bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500'>
                    <th className='px-5 py-3.5 font-semibold'>Order ID</th>
                    <th className='px-5 py-3.5 font-semibold'>Customer</th>
                    <th className='px-5 py-3.5 font-semibold'>Product</th>
                    <th className='px-5 py-3.5 font-semibold text-right'>Total</th>
                    <th className='px-5 py-3.5 font-semibold'>Payment</th>
                    <th className='px-5 py-3.5 font-semibold'>Status</th>
                    <th className='px-5 py-3.5 font-semibold'>Date</th>
                    <th className='px-5 py-3.5 font-semibold text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className='hover:bg-slate-50/60 transition-colors'>
                      <td className='px-5 py-3.5 text-sm font-bold text-primary whitespace-nowrap'>#{order.orderId}</td>
                      <td className='px-5 py-3.5'>
                        <p className='text-sm font-medium text-slate-800 whitespace-nowrap'>{customerName(order)}</p>
                        <p className='text-xs text-slate-400 whitespace-nowrap'>{order.address?.phone || ''}</p>
                      </td>
                      <td className='px-5 py-3.5 text-sm text-slate-600 max-w-[220px] truncate'>
                        {(order.items && order.items[0]?.name) || '—'}{order.items && order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                      </td>
                      <td className='px-5 py-3.5 text-sm font-semibold text-slate-800 text-right whitespace-nowrap'>{fmtAmount(order.amount)}</td>
                      <td className='px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap'>
                        {order.paymentMethod}
                        <span className={`ml-1.5 text-xs font-semibold ${order.payment ? 'text-green-600' : 'text-amber-600'}`}>({order.payment ? 'Paid' : 'Pending'})</span>
                      </td>
                      <td className='px-5 py-3.5'><StatusBadge status={order.status} /></td>
                      <td className='px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap'>{fmtDate(order.date)}</td>
                      <td className='px-5 py-3.5 text-right'>
                        <button onClick={() => setViewOrder(order)} className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer'>
                          <EyeIcon /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Top selling + low stock */}
      <section className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <SectionTitle title="Top Selling Products" subtitle="Best sellers by units sold" />
          <div className='bg-white rounded-2xl border border-slate-100 shadow-card p-5'>
            {topSelling.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-slate-400'>
                <ShoppingBagIcon />
                <p className='text-sm font-medium mt-3'>No sales data yet</p>
              </div>
            ) : (
              <div className='flex flex-col divide-y divide-slate-100'>
                {topSelling.map((p, i) => (
                  <div key={p.name + i} className='flex items-center gap-4 py-3.5 first:pt-0 last:pb-0'>
                    <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                    {p.image ? (
                      <img src={p.image} alt="" className='w-12 h-auto object-contain rounded-xl border border-slate-200 bg-white shrink-0' />
                    ) : (
                      <div className='w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0'><PackageIcon /></div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-slate-800 truncate'>{p.name}</p>
                      <div className='mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${(p.qty / maxSold) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-sm font-bold text-slate-800'>{p.qty} sold</p>
                      <p className='text-xs text-slate-400'>{fmtAmount(p.revenue)} revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle title="Low Stock Products" subtitle="Needs restocking soon" />
          <div className='bg-white rounded-2xl border border-slate-100 shadow-card p-5'>
            {lowStock.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-slate-400'>
                <CheckCircleIcon />
                <p className='text-sm font-medium mt-3'>All products are in stock</p>
              </div>
            ) : (
              <div className='flex flex-col gap-3'>
                {lowStock.map((p) => (
                  <div key={p._id} className='flex items-center gap-3 bg-red-50/60 border border-red-100 rounded-xl p-3'>
                    {p.image && p.image[0] ? (
                      <img src={p.image[0]} alt="" className='w-11 h-auto object-contain rounded-lg border border-red-100 bg-white shrink-0' />
                    ) : (
                      <div className='w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center text-red-300 shrink-0'><PackageIcon /></div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-slate-800 truncate'>{p.name}</p>
                      <p className='text-xs font-medium text-red-600 flex items-center gap-1 mt-0.5'>
                        <AlertTriangleIcon className="w-3.5 h-3.5" /> {p.stock}
                      </p>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-[10px] uppercase tracking-wide text-slate-400 font-semibold'>Remaining</p>
                      <p className='text-sm font-bold text-red-600'>0</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionTitle title="Quick Actions" subtitle="Shortcuts to common admin tasks" />
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
          <QuickAction label="Add Product" sub="Create a new listing" icon={<PlusIcon />} color="bg-primary/10 text-primary" onClick={() => navigate('/add')} />
          <QuickAction label="Manage Products" sub="Edit or remove products" icon={<ListIcon />} color="bg-indigo-50 text-indigo-600" onClick={() => navigate('/list')} />
          <QuickAction label="Manage Orders" sub="Update order statuses" icon={<ClipboardListIcon />} color="bg-amber-50 text-amber-600" onClick={() => navigate('/orders')} />
          <QuickAction label="Manage Categories" sub="Create or rename categories" icon={<TagsIcon />} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/categories')} />
        </div>
      </section>

      {/* Order details modal */}
      {viewOrder && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50' onClick={() => setViewOrder(null)}>
          <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-xl' onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl'>
              <div className='flex items-center gap-3 flex-wrap'>
                <h3 className='font-semibold text-gray-800'>Order #{viewOrder.orderId}</h3>
                <StatusBadge status={viewOrder.status} />
              </div>
              <button onClick={() => setViewOrder(null)} className='text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer' aria-label='Close'>×</button>
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
                  <p className='font-semibold text-gray-800'>{customerName(viewOrder)}</p>
                  <p className='text-gray-600'>{viewOrder.address?.phone}</p>
                  {viewOrder.address?.email && <p className='text-gray-600 break-words'>{viewOrder.address.email}</p>}
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Delivery Address</p>
                  <p className='text-gray-600'>{viewOrder.address?.street}</p>
                  <p className='text-gray-600'>{[viewOrder.address?.city, viewOrder.address?.state].filter(Boolean).join(', ')}, {viewOrder.address?.country}</p>
                  {viewOrder.address?.zipcode && <p className='text-gray-600'>Postal: {viewOrder.address.zipcode}</p>}
                  {viewOrder.address?.notes && <p className='text-gray-500 italic'>Note: {viewOrder.address.notes}</p>}
                </div>
              </div>

              <div>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>Items</p>
                <div className='flex flex-col gap-2'>
                  {(viewOrder.items || []).map((item, idx) => (
                    <div key={idx} className='flex items-center gap-3 border border-slate-100 rounded-lg p-2'>
                      {item.image && item.image[0] && <img src={item.image[0]} alt="" className='w-12 h-auto object-contain rounded-lg border border-slate-200 bg-white' />}
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-gray-800 leading-snug'>{item.name}</p>
                        <p className='text-xs text-gray-400'>Model: {item.size || 'Default'} | Qty: {item.quantity}</p>
                      </div>
                      <p className='text-sm font-semibold text-gray-700 shrink-0'>{fmtAmount((item.price || 0) * (item.quantity || 1))}</p>
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
                  <p className='text-xl font-bold text-primary'>{fmtAmount(viewOrder.amount)}</p>
                </div>
              </div>

              {viewOrder.status === 'Cancelled' && (
                <div className='bg-red-50 border border-red-100 rounded-lg p-4'>
                  <p className='text-xs font-semibold text-red-600 uppercase tracking-wide mb-2'>Cancellation</p>
                  <p className='text-sm text-red-700'>Cancelled By: {viewOrder.cancelledBy || 'Customer'}</p>
                  {viewOrder.cancelledAt && <p className='text-sm text-red-700'>Date & Time: {new Date(viewOrder.cancelledAt).toLocaleString()}</p>}
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

              <button onClick={() => setViewOrder(null)} className='w-full py-2.5 text-sm font-semibold border border-slate-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors cursor-pointer'>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
