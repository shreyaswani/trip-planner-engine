import { useState } from 'react';
import { X, Loader2, Train, PlusCircle, Trash2 } from 'lucide-react';
import { addTicketToTrip } from '../trips/tripService';

export default function AddTicketModal({ isOpen, onClose, tripId, members }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mode: 'Train', title: '', date: '', pnr: '', coach: '', from: '', to: ''
  });
  const [seats, setSeats] = useState([{ member: '', seat: '' }]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const activeSeats = seats.filter(s => s.member && s.seat);
      await addTicketToTrip(tripId, { ...formData, seats: activeSeats });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f111a]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1c212e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 my-8">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Train className="text-sky-400" /> Add Transit Ticket
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full border border-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Mode</label>
              <select name="mode" value={formData.mode} onChange={handleChange} className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option>Train</option><option>Flight</option><option>Bus</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Train/Flight Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. 12951 Mewar Exp" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-400 mb-1">From</label><input type="text" name="from" value={formData.from} onChange={handleChange} placeholder="Mumbai" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">To</label><input type="text" name="to" value={formData.to} onChange={handleChange} placeholder="Udaipur" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-b border-gray-800 pb-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1">Date & Time</label><input type="text" name="date" required value={formData.date} onChange={handleChange} placeholder="14 Nov 07:45 PM" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">PNR</label><input type="text" name="pnr" value={formData.pnr} onChange={handleChange} placeholder="842-194..." className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">Coach</label><input type="text" name="coach" value={formData.coach} onChange={handleChange} placeholder="B3" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          </div>

          {/* Seat Mapping */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-2">Seat Allocation</label>
            {seats.map((seat, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <select 
                  value={seat.member} onChange={e => { const s = [...seats]; s[idx].member = e.target.value; setSeats(s); }}
                  className="flex-1 bg-[#151923] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                >
                  <option value="">Select Member...</option>
                  {members?.map(m => <option key={m.uid} value={m.name.split(' ')[0]}>{m.name}</option>)}
                </select>
                <input 
                  type="text" placeholder="Seat No (e.g. 41 LB)" value={seat.seat} onChange={e => { const s = [...seats]; s[idx].seat = e.target.value; setSeats(s); }}
                  className="flex-1 bg-[#151923] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                />
                <button type="button" onClick={() => setSeats(seats.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-rose-400"><Trash2 size={16}/></button>
              </div>
            ))}
            <button type="button" onClick={() => setSeats([...seats, { member: '', seat: '' }])} className="text-xs text-sky-400 flex items-center gap-1 mt-2">
              <PlusCircle size={14}/> Add Passenger
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Ticket & PNR'}
          </button>
        </form>
      </div>
    </div>
  );
}