import { useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { joinTrip } from './tripService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function JoinTripModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const joinedId = await joinTrip(
        groupId, 
        user.uid, 
        user.phoneNumber, 
        user.displayName || "Family Member"
      );
      
      setLoading(false);
      onClose();
      // Instantly open the trip hub!
      navigate(`/trip/${joinedId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to join trip.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f111a]/80 backdrop-blur-sm p-4">
      <div className="bg-[#1c212e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm relative flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Users className="text-indigo-400" /> Join a Trip
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full border border-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg font-medium text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Enter Group ID</label>
            <input 
              type="text" required placeholder="e.g. GRP-RAJ-8842"
              value={groupId} onChange={(e) => setGroupId(e.target.value.toUpperCase())}
              className="w-full bg-[#151923] border border-gray-700 rounded-lg px-3 py-3 text-gray-200 focus:outline-none focus:border-indigo-500 text-sm shadow-sm font-mono tracking-wider"
            />
          </div>

          <button 
            type="submit" disabled={loading || !groupId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center text-sm active:scale-[0.98] mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Join Trip'}
          </button>
        </form>

      </div>
    </div>
  );
}