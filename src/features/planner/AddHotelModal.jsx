import { useState } from 'react';
import { X, Loader2, Hotel } from 'lucide-react';
import { addHotelToTrip } from '../trips/tripService';

export default function AddHotelModal({ isOpen, onClose, tripId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city: '', name: '', checkIn: '', checkOut: '', bookingId: '', roomInfo: '', contact: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addHotelToTrip(tripId, formData);
      onClose();
      setFormData({ city: '', name: '', checkIn: '', checkOut: '', bookingId: '', roomInfo: '', contact: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to add hotel");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f111a]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1c212e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Hotel className="text-indigo-400" /> Add Hotel Booking
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full border border-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">City</label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="e.g. Udaipur" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Booking ID / PNR</label>
              <input type="text" name="bookingId" required value={formData.bookingId} onChange={handleChange} placeholder="e.g. BK-12345" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Hotel Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Lake Pichola Boutique Stay" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Check-In</label>
              <input type="text" name="checkIn" required value={formData.checkIn} onChange={handleChange} placeholder="15 Nov • 12:00 PM" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Check-Out</label>
              <input type="text" name="checkOut" required value={formData.checkOut} onChange={handleChange} placeholder="17 Nov • 10:00 AM" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Room Info</label>
            <input type="text" name="roomInfo" value={formData.roomInfo} onChange={handleChange} placeholder="e.g. 2x Deluxe Rooms (Breakfast Inc)" className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Hotel Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}