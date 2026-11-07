import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Compass, LogOut, Plus, MapPin, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateTripModal from './CreateTripModal';
import JoinTripModal from './JoinTripModal';
import { getUserTrips } from './tripService';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // In Phase 4, we will hook this up to the tripService.getUserTrips()
  // For now, we mock it to see the UI.
useEffect(() => {
  if (!user?.uid) return;
  
  const fetchMyTrips = async () => {
    try {
      const myTrips = await getUserTrips(user.uid);
      setTrips(myTrips);
    } catch (error) {
      console.error("Failed to fetch trips", error);
    } finally {
      setLoading(false);
    }
  };

  fetchMyTrips();
}, [user?.uid]);

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 p-4 md:p-6 fade-in animate-in duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#1c212e] p-5 rounded-xl border border-gray-800 shadow-lg">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <Compass className="text-emerald-400" /> 
              My Trips
            </h1>
            <p className="text-xs text-gray-400 mt-1">Logged in as {user?.phoneNumber}</p>
          </div>
          <button 
            onClick={logout}
            className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
<button 
  onClick={() => setIsCreateOpen(true)}
  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 active:scale-[0.98]"
>
  <Plus size={20} /> Create New Trip Group
</button>
<button 
  onClick={() => setIsJoinOpen(true)}
  className="flex-1 bg-[#151923] hover:bg-gray-800 border border-gray-700 text-gray-200 font-medium py-4 rounded-xl transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
>
  <Users size={20} className="text-indigo-400" /> Join via Group ID
</button>
        </div>

        {/* Trips List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">Active Trips</h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-500 border border-dashed border-gray-800 rounded-xl p-12 bg-[#1c212e]/50">
              <Compass size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
              <p>You haven't joined or created any trips yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map(trip => (
                <div 
                  key={trip.tripId} 
                  onClick={() => navigate(`/trip/${trip.tripId}`)}
                  className="bg-[#1c212e] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer transition-all shadow-md group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                        {trip.groupName}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={14} className="text-rose-400" /> {trip.destination}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#151923] border border-gray-700 text-emerald-400">
                      {trip.status}
                    </span>
                  </div>
                  
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-800/50">
  <div className="flex items-center gap-3 text-xs font-medium">
    <span className="font-mono text-gray-500 bg-[#151923] px-2 py-1 rounded">ID: {trip.tripId}</span>
    <span className={`${trip.role === 'Admin' ? 'text-indigo-400' : 'text-gray-400'}`}>{trip.role}</span>
    <span className="flex items-center gap-1 text-gray-400"><Users size={12} /> {trip.memberCount}</span>
  </div>
  
  <div className="flex gap-2">
    <button 
      onClick={(e) => { e.stopPropagation(); navigate(`/trip/${trip.tripId}/expenses`); }}
      className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
    >
      Ledger & Analytics
    </button>
  </div>
</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <CreateTripModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <JoinTripModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}