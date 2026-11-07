import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import useAuthStore from '../../store/useAuthStore';
import { addExpenseToTrip } from '../trips/tripService';
import { 
  ArrowLeft, Wallet, PieChart, CreditCard, Building2, 
  Receipt, PlusCircle, Loader2, TrendingUp, Users, Calendar
} from 'lucide-react';

const CATEGORIES = ['Hotels', 'Travel', 'Food', 'Sightseeing Tickets', 'Shopping'];

export default function TripExpenseTracker() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Form State (Updated with bankName)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    amount: '',
    paymentMode: 'Credit Card',
    bankName: '',
    description: '',
    category: 'Food'
  });

  // Fetch Trip & Expenses
  useEffect(() => {
    if (!tripId) return;

    const unsubscribeTrip = onSnapshot(doc(db, 'trips', tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTrip(data);
        // Set default name if empty
        if (!form.paidBy && data.members) {
          const me = data.members.find(m => m.uid === user?.uid);
          if (me) setForm(prev => ({ ...prev, paidBy: me.name.split(' ')[0] }));
        }
      }
      setLoading(false);
    });

    const q = query(collection(db, 'trips', tripId, 'expenses'), orderBy('timestamp', 'desc'));
    const unsubscribeExp = onSnapshot(q, (snapshot) => {
      const expData = [];
      snapshot.forEach((doc) => expData.push({ id: doc.id, ...doc.data() }));
      setExpenses(expData);
    });

    return () => { unsubscribeTrip(); unsubscribeExp(); };
  }, [tripId, user?.uid]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.paidBy) return;
    setIsSubmitting(true);
    
    try {
      await addExpenseToTrip(tripId, {
        date: new Date(form.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        rawDate: form.date, 
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        bankName: form.bankName.trim(),
        paidBy: form.paidBy.trim(),
      }, user.uid);

      // Reset specific fields after submission
      setForm(prev => ({ ...prev, description: '', amount: '', bankName: '' }));
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    if (!expenses.length) return { total: 0, byCat: {}, byPerson: {}, byDay: {}, totalBudget: 0 };
    
    const byCat = {};
    const byPerson = {};
    const byDay = {};
    let total = 0;

    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount) || 0;
      total += amt;
      byCat[exp.category] = (byCat[exp.category] || 0) + amt;
      
      // Standardize names (e.g., 'shreyas' and 'Shreyas' get grouped together)
      const personName = exp.paidBy.charAt(0).toUpperCase() + exp.paidBy.slice(1).toLowerCase();
      byPerson[personName] = (byPerson[personName] || 0) + amt;
      
      byDay[exp.date] = (byDay[exp.date] || 0) + amt;
    });

    const totalBudget = trip?.estimates ? Object.values(trip.estimates).reduce((a, b) => a + b, 0) : 0;

    return { total, byCat, byPerson, byDay, totalBudget };
  }, [expenses, trip]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 p-4 md:p-6 fade-in animate-in duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-[#1c212e] p-4 rounded-xl border border-gray-800 shadow-md">
          <button onClick={() => navigate(`/trip/${tripId}`)} className="p-2 bg-[#151923] hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="text-indigo-400" /> Master Expense Tracker
            </h1>
            <p className="text-xs text-gray-400">{trip?.groupName} • {expenses.length} Transactions</p>
          </div>
        </div>

        {/* WIDGETS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-[#1c212e] border border-indigo-500/30 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-indigo-300 uppercase font-bold mb-1 flex items-center gap-1"><Wallet size={14}/> Total Spent</p>
            <p className="text-3xl font-bold text-white">₹{analytics.total.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 mt-1">out of ₹{analytics.totalBudget.toLocaleString('en-IN')} est.</p>
          </div>
          
          <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-1"><Users size={14}/> Paid By Person</p>
            <div className="space-y-2">
              {Object.entries(analytics.byPerson).map(([person, amt]) => (
                <div key={person} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{person}</span>
                  <span className="font-bold text-emerald-400">₹{amt.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1c212e] border border-gray-800 rounded-xl p-5 shadow-lg lg:col-span-2 overflow-x-auto custom-scrollbar flex gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat} className="min-w-[120px] flex-1 bg-[#151923] border border-gray-700/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase truncate">{cat}</p>
                <p className="text-lg font-bold text-gray-200 mt-1">₹{(analytics.byCat[cat] || 0).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN SPLIT: FORM & LEDGER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: ADVANCED ENTRY FORM */}
          <form onSubmit={handleSubmit} className="bg-[#1c212e] border border-gray-800 rounded-xl p-6 h-fit shadow-lg space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <PlusCircle size={18} className="text-emerald-400" /> New Transaction Entry
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                <input 
                  type="date" required style={{ colorScheme: 'dark' }}
                  value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                <select 
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Description (What was it?)</label>
              <input 
                type="text" required placeholder="e.g. Indigo Flight Tickets"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount (₹)</label>
                <input 
                  type="number" required min="1" placeholder="0"
                  value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Paid By (Person's Name)</label>
                <input 
                  type="text" required placeholder="e.g. Shreyas"
                  value={form.paidBy} onChange={e => setForm({...form, paidBy: e.target.value})}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Payment Mode</label>
                <div className="flex bg-[#151923] p-1 rounded-lg border border-gray-700 h-[42px]">
                  {['Credit Card', 'Bank Account', 'Cash'].map(mode => (
                    <button 
                      key={mode} type="button" 
                      onClick={() => setForm({...form, paymentMode: mode})}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-md transition-all ${form.paymentMode === mode ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {mode === 'Credit Card' ? <CreditCard size={14}/> : mode === 'Bank Account' ? <Building2 size={14}/> : <Wallet size={14}/>}
                      {mode === 'Credit Card' ? 'CC' : mode === 'Bank Account' ? 'Bank' : 'Cash'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Bank Name / CC Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Bank or Card Name</label>
                <input 
                  type="text" placeholder="e.g. Tata Neu HDFC"
                  value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 rounded-lg mt-2 transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Record Transaction'}
            </button>
          </form>

          {/* RIGHT: THE MASTER LEDGER */}
          <div className="lg:col-span-2 bg-[#1c212e] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#151923]/50">
              <h3 className="font-bold text-white flex items-center gap-2"><Receipt size={18} className="text-gray-400"/> Detailed Transaction Ledger</h3>
            </div>
            
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1c212e] text-xs uppercase text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Txn ID / Date</th>
                    <th className="px-5 py-4 font-semibold">Details</th>
                    <th className="px-5 py-4 font-semibold">Mode / Payer</th>
                    <th className="px-5 py-4 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {expenses.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-500">No transactions recorded yet.</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-[#151923] transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-indigo-400 bg-indigo-500/10 inline-block px-1.5 py-0.5 rounded mb-1">{exp.txnId}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={12}/> {exp.date}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{exp.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{exp.category}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-300 text-xs capitalize">{exp.paidBy}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-[10px] text-gray-500 uppercase border border-gray-700 inline-block px-1.5 rounded">{exp.paymentMode}</p>
                          {exp.bankName && (
                            <p className="text-[10px] text-indigo-400 uppercase font-medium">{exp.bankName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="font-bold text-emerald-400 text-base">₹{exp.amount.toLocaleString('en-IN')}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}