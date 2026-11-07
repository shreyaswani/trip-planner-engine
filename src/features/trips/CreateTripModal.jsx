import { useState } from 'react';
import { X, Loader2, Compass } from 'lucide-react';
import { createTrip } from './tripService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function CreateTripModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    groupName: '',
    destination: '',
    Hotels: '',
    Travel: '',
    Food: '',
    'Sightseeing Tickets': '',
    Shopping: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const estimates = {
        Hotels: parseFloat(formData.Hotels) || 0,
        Travel: parseFloat(formData.Travel) || 0,
        Food: parseFloat(formData.Food) || 0,
        'Sightseeing Tickets': parseFloat(formData['Sightseeing Tickets']) || 0,
        Shopping: parseFloat(formData.Shopping) || 0,
      };

      // Call our service to create the document in Firestore
      const newTripId = await createTrip(
        { groupName: formData.groupName, destination: formData.destination, estimates },
        user.uid,
        user.phoneNumber,
        user.displayName || "Admin"
      );

      setLoading(false);
      onClose();
      // Instantly jump to the newly created trip hub
      navigate(`/trip/${newTripId}`);
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Check your connection.");
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f111a]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1c212e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md relative flex flex-col my-8 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Compass className="text-emerald-400" /> Start a New Trip
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full border border-gray-700 shadow-md transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Group Name</label>
              <input 
                type="text" name="groupName" required placeholder="e.g. Rajasthan Family Trip"
                value={formData.groupName} onChange={handleChange}
                className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Destination</label>
              <input 
                type="text" name="destination" required placeholder="e.g. Udaipur & Jodhpur"
                value={formData.destination} onChange={handleChange}
                className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-emerald-500 text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Estimated Budget (₹)</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Hotels', 'Travel', 'Food', 'Shopping', 'Sightseeing Tickets'].map(cat => (
                <div key={cat} className={cat === 'Sightseeing Tickets' ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{cat}</label>
                  <input 
                    type="number" name={cat} min="0" placeholder="0"
                    value={formData[cat]} onChange={handleChange}
                    className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-sm shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 mt-2">
            <button 
              type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center text-sm active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Trip & Invite Members'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}