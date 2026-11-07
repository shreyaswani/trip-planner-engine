import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import useAuthStore from '../../store/useAuthStore';
import { PieChart,
  Plane, Train, Hotel, Utensils, MapPin, CheckCircle2, Circle, 
  Users, ShieldCheck, Share2, PlusCircle, Wallet, Compass, 
  ShoppingBag, Ticket, Car, Calendar, Copy, ExternalLink, ChevronDown, Loader2
} from 'lucide-react';
import AddHotelModal from './AddHotelModal';
import AddTicketModal from './AddTicketModal';


const FIVE_CATEGORIES = [
  { name: 'Hotels', icon: Hotel, color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500' },
  { name: 'Travel', icon: Car, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500' },
  { name: 'Food', icon: Utensils, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500' },
  { name: 'Sightseeing Tickets', icon: Ticket, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500' },
  { name: 'Shopping', icon: ShoppingBag, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500' },
];

export default function TripPlannerDashboard() {
  const { tripId } = useParams(); // Grabs the GRP-XXX ID from the URL
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [newExp, setNewExp] = useState({ category: 'Food', description: '', amount: '', paidBy: '' });
  const [isAddingExp, setIsAddingExp] = useState(false);

  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // --- 1. REAL-TIME TRIP LISTENER ---
  useEffect(() => {
    if (!tripId) return;

    // Listen to the main Trip document
    const tripRef = doc(db, 'trips', tripId);
    const unsubscribeTrip = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrip(data);
        // Default the "Paid By" field to the current user's name if not set
        if (!newExp.paidBy && data.members) {
          const me = data.members.find(m => m.uid === user?.uid);
          if (me) setNewExp(prev => ({ ...prev, paidBy: me.name.split(' ')[0] }));
        }
      } else {
        alert("Trip not found or deleted!");
        navigate('/dashboard');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trip:", error);
      setLoading(false);
    });

    // Listen to the Expenses sub-collection
    const expRef = collection(db, 'trips', tripId, 'expenses');
    const q = query(expRef, orderBy('timestamp', 'desc'));
    const unsubscribeExp = onSnapshot(q, (snapshot) => {
      const expData = [];
      snapshot.forEach((doc) => expData.push({ id: doc.id, ...doc.data() }));
      setExpenses(expData);
    });

    return () => {
      unsubscribeTrip();
      unsubscribeExp();
    };
  }, [tripId, user, navigate]);

  // --- 2. LIVE UPDATES ---
  // Toggle Itinerary or Food Checklist directly in Firestore
  const toggleItem = async (listKey, itemId, field) => {
    if (!trip) return;
    const updatedList = trip[listKey].map(item => 
      item.id === itemId ? { ...item, [field]: !item[field] } : item
    );
    await updateDoc(doc(db, 'trips', tripId), { [listKey]: updatedList });
  };

  // Add Expense to Firestore Sub-collection
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExp.amount || !newExp.description) return;
    setIsAddingExp(true);
    
    try {
      const expensesRef = collection(db, "trips", tripId, "expenses");
      await addDoc(expensesRef, {
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        category: newExp.category,
        description: newExp.description,
        amount: parseFloat(newExp.amount),
        paidBy: newExp.paidBy,
        paidByUid: user.uid,
        timestamp: serverTimestamp()
      });
      setNewExp({ ...newExp, description: '', amount: '' });
    } catch (err) {
      console.error("Failed to add expense:", err);
    } finally {
      setIsAddingExp(false);
    }
  };

  // --- 3. 5-CATEGORY MATH ENGINE ---
  const budgetMetrics = useMemo(() => {
    if (!trip) return { spentByCategory: {}, totalEstimated: 0, totalActual: 0, remaining: 0 };
    
    const spentByCategory = { 'Hotels': 0, 'Travel': 0, 'Food': 0, 'Sightseeing Tickets': 0, 'Shopping': 0 };
    expenses.forEach(exp => {
      if (spentByCategory[exp.category] !== undefined) {
        spentByCategory[exp.category] += parseFloat(exp.amount) || 0;
      }
    });

    const totalEstimated = trip.estimates ? Object.values(trip.estimates).reduce((a, b) => a + b, 0) : 0;
    const totalActual = Object.values(spentByCategory).reduce((a, b) => a + b, 0);

    return { spentByCategory, totalEstimated, totalActual, remaining: totalEstimated - totalActual };
  }, [trip?.estimates, expenses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!trip) return null;

  const isAdmin = trip.adminId === user?.uid;
  const myMemberData = trip.members?.find(m => m.uid === user?.uid);
  const myRole = myMemberData ? myMemberData.role : 'Guest';

  // ... KEEP THE ENTIRE RETURN STATEMENT EXACTLY AS IT WAS IN MY PREVIOUS MESSAGE ...

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* --- TOP GROUP HEADER --- */}
        <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-2.5">
              <Compass className="text-emerald-400" size={26} />
              <h1 className="text-2xl font-bold text-white">{trip.groupName}</h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck size={12} /> {myRole}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <MapPin size={14} className="text-rose-400" /> {trip.destination}
              <span className="text-gray-600">•</span>
              <span className="text-xs font-mono bg-[#151923] px-2 py-0.5 rounded border border-gray-700 text-gray-300">
                ID: {trip.groupId}
              </span>
            </p>
          </div>

<div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <div className="flex -space-x-2">
              {trip.members?.map((m) => (
                <div key={m.uid} title={`${m.name} (${m.role})`} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#1c212e] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {m.name.charAt(0)}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigator.clipboard?.writeText(`Join our ${trip.groupName}! Group ID: ${trip.groupId}`)}
                className="flex items-center gap-1.5 bg-[#151923] hover:bg-gray-800 text-gray-200 border border-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <Share2 size={14} className="text-emerald-400" /> Share Group
              </button>

              {/* NEW ANALYTICS BUTTON */}
              <button 
                onClick={() => navigate(`/trip/${tripId}/expenses`)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-900/20"
              >
                <PieChart size={14} /> Ledger & Analytics
              </button>
            </div>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex bg-[#1c212e] p-1 rounded-xl border border-gray-800 w-full sm:w-fit">
          {[
            { id: 'overview', label: 'Tickets & Hotels' },
            { id: 'itinerary', label: 'Itinerary & Famous Food' },
            { id: 'budget', label: '5-Category Expense Tracker' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =========================================================
            TAB 1: TICKETS (PNR/SEATS) & HOTELS
            ========================================================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TRAIN / FLIGHT PNR HUB */}
            <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Train size={20} className="text-sky-400" /> Travel Tickets & PNRs
                </h2>
{isAdmin && (
  <button 
    onClick={() => setIsTicketModalOpen(true)}
    className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-md hover:bg-sky-500/20"
  >
    + Add Ticket
  </button>
)}
              </div>

              {trip.tickets.map(t => (
                <div key={t.id} className="bg-[#151923] border border-gray-700/70 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">
                        {t.mode}
                      </span>
                      <h3 className="font-bold text-white mt-1">{t.title}</h3>
                      <p className="text-xs text-gray-400">{t.from} → {t.to} • {t.date}</p>
                    </div>
                    <div className="text-right bg-[#1c212e] px-3 py-1.5 rounded-lg border border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase">PNR Number</p>
                      <p className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        {t.pnr}
                        <Copy size={12} className="cursor-pointer text-gray-400 hover:text-white" onClick={() => navigator.clipboard?.writeText(t.pnr)} />
                      </p>
                    </div>
                  </div>

                  {/* Coach & Passenger Seat Breakdown */}
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-xs text-gray-400 mb-2">
                      Coach: <span className="text-white font-bold">{t.coach}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {t.seats.map((s, idx) => (
                        <div key={idx} className="bg-[#1c212e] border border-gray-800 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 truncate">{s.member}</p>
                          <p className="text-xs font-bold text-indigo-400 mt-0.5">{s.seat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* HOTEL STAYS HUB */}
            <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Hotel size={20} className="text-indigo-400" /> Booked Hotels & Stays
                </h2>
{isAdmin && (
  <button 
    onClick={() => setIsHotelModalOpen(true)}
    className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md hover:bg-indigo-500/20"
  >
    + Add Hotel
  </button>
)}
              </div>

              <div className="space-y-3">
                {trip.hotels.map(h => (
                  <div key={h.id} className="bg-[#151923] border border-gray-700/70 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                          {h.city}
                        </span>
                        <h3 className="font-bold text-white mt-1">{h.name}</h3>
                      </div>
                      <span className="text-xs font-mono text-gray-400 bg-[#1c212e] px-2.5 py-1 rounded border border-gray-800">
                        {h.bookingId}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium">{h.roomInfo}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-gray-400 border-t border-gray-800">
                      <div>Check-In: <span className="text-gray-200 font-medium">{h.checkIn}</span></div>
                      <div>Check-Out: <span className="text-gray-200 font-medium">{h.checkOut}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 2: ITINERARY & FAMOUS FOODS CHECKLIST
            ========================================================= */}
        {activeTab === 'itinerary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SIGHTSEEING CHECKLIST */}
            <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin size={20} className="text-amber-400" /> Day-by-Day Sightseeing
                </h2>
                <span className="text-xs text-gray-400">
                  {trip.itinerary.filter(i => i.done).length} of {trip.itinerary.length} Visited
                </span>
              </div>

              <div className="space-y-2.5">
                {trip.itinerary.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleItem('itinerary', item.id, 'done')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      item.done 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-gray-400' 
                        : 'bg-[#151923] border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.done ? <CheckCircle2 className="text-emerald-400 shrink-0" size={20} /> : <Circle className="text-gray-500 shrink-0" size={20} />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-800 text-amber-400">{item.day} • {item.city}</span>
                          <span className="text-xs text-gray-400">{item.time}</span>
                        </div>
                        <p className={`text-sm font-medium mt-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                          {item.place}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAMOUS FOODS CHECKLIST */}
            <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Utensils size={20} className="text-emerald-400" /> Famous Local Foods to Try
                </h2>
                <span className="text-xs text-gray-400">
                  {trip.famousFoods.filter(f => f.tried).length} of {trip.famousFoods.length} Tried
                </span>
              </div>

              <div className="space-y-2.5">
                {trip.famousFoods.map(food => (
                  <div 
                    key={food.id} 
                    onClick={() => toggleItem('famousFoods', food.id, 'tried')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      food.tried 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-gray-400' 
                        : 'bg-[#151923] border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {food.tried ? <CheckCircle2 className="text-emerald-400 shrink-0" size={20} /> : <Circle className="text-gray-500 shrink-0" size={20} />}
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-800 text-emerald-400">{food.city}</span>
                        <p className={`text-sm font-bold mt-1 ${food.tried ? 'line-through text-gray-400' : 'text-white'}`}>
                          {food.item}
                        </p>
                        <p className="text-xs text-gray-400">Recommended Spot: {food.spot}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 3: 5-CATEGORY ESTIMATE VS ACTUAL TRACKER
            ========================================================= */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            
            {/* TOP SUMMARY BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase">Total Trip Estimate (5 Categories)</p>
                <p className="text-2xl font-bold text-white mt-1">₹{budgetMetrics.totalEstimated.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-[#1c212e] border border-indigo-500/40 rounded-xl p-4">
                <p className="text-xs text-indigo-400 uppercase">Total Actual Spent</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1">₹{budgetMetrics.totalActual.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-[#1c212e] border border-emerald-500/30 rounded-xl p-4">
                <p className="text-xs text-emerald-400 uppercase">Remaining Budget</p>
                <p className={`text-2xl font-bold mt-1 ${budgetMetrics.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{budgetMetrics.remaining.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* THE 5 CORE CATEGORY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {FIVE_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const est = trip.estimates[cat.name] || 0;
                const spent = budgetMetrics.spentByCategory[cat.name] || 0;
                const pct = est > 0 ? Math.min(100, Math.round((spent / est) * 100)) : 0;

                return (
                  <div key={cat.name} className={`bg-[#1c212e] border ${cat.border} rounded-xl p-4 flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-gray-300">{cat.name}</span>
                        <Icon size={16} className={cat.color} />
                      </div>
                      <p className={`text-xl font-bold ${cat.color}`}>₹{spent.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">of ₹{est.toLocaleString('en-IN')} est.</p>
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-[#151923] rounded-full overflow-hidden">
                        <div className={`h-full ${cat.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-right text-gray-400 mt-1">{pct}% used</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QUICK LOG + LIVE LEDGER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Log Trip Spend Form */}
              <form onSubmit={handleAddExpense} className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 space-y-4 h-fit">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <PlusCircle size={18} className="text-emerald-400" /> Log Trip Spend
                </h3>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category (Strict 5)</label>
                  <select 
                    value={newExp.category} 
                    onChange={e => setNewExp({...newExp, category: e.target.value})}
                    className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {FIVE_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Spent On</label>
                  <input 
                    type="text" required placeholder="e.g. Mehrangarh Fort Entry Tickets"
                    value={newExp.description}
                    onChange={e => setNewExp({...newExp, description: e.target.value})}
                    className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Amount (₹)</label>
                    <input 
                      type="number" required min="1" placeholder="0"
                      value={newExp.amount}
                      onChange={e => setNewExp({...newExp, amount: e.target.value})}
                      className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Paid By</label>
                    <select 
                      value={newExp.paidBy} 
                      onChange={e => setNewExp({...newExp, paidBy: e.target.value})}
                      className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      {trip.members.map(m => <option key={m.id} value={m.name.split(' ')[0]}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Add to Group Spend
                </button>
              </form>

              {/* Expense History Table */}
              <div className="lg:col-span-2 bg-[#1c212e] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Group Trip Ledger</h3>
                  <span className="text-xs text-gray-400">{expenses.length} Entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#151923] text-xs uppercase text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Paid By</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{exp.date}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-[#151923] border border-gray-700 text-gray-200">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white font-medium">{exp.description}</td>
                          <td className="px-4 py-3 text-indigo-400 text-xs font-medium">{exp.paidBy}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Modals for Admins */}
{isAdmin && (
  <>
    <AddHotelModal 
      isOpen={isHotelModalOpen} 
      onClose={() => setIsHotelModalOpen(false)} 
      tripId={tripId} 
    />
    <AddTicketModal 
      isOpen={isTicketModalOpen} 
      onClose={() => setIsTicketModalOpen(false)} 
      tripId={tripId} 
      members={trip.members} 
    />
  </>
)}
    </div>
  );
}