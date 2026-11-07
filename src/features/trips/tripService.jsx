import { db } from '../../config/firebase';
import { arrayUnion, updateDoc } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

// --- USER MANAGEMENT ---
export const createUserProfile = async (uid, phoneNumber, displayName = "New Traveler") => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      phoneNumber,
      displayName,
      joinedAt: serverTimestamp()
    });
  }
};

// --- TRIP MANAGEMENT ---
export const createTrip = async (tripData, adminUid, adminPhone, adminName) => {
  const tripId = `GRP-${tripData.destination.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const tripRef = doc(db, "trips", tripId);
  
  await setDoc(tripRef, {
    tripId,
    groupName: tripData.groupName,
    destination: tripData.destination,
    adminId: adminUid,
    status: "Active",
    // We save full objects for the UI, and a simple array of strings for Firestore querying
    members: [
      { uid: adminUid, role: "Admin", name: adminName, phone: adminPhone }
    ],
    memberUids: [adminUid], // <-- THIS WAS MISSING
    estimates: tripData.estimates || {
      "Hotels": 0, "Travel": 0, "Food": 0, "Sightseeing Tickets": 0, "Shopping": 0
    },
    tickets: [],
    hotels: [],
    itinerary: [],
    famousFoods: []
  });

  return tripId;
};

// Get all trips where the user is a member
export const getUserTrips = async (uid) => {
  // Wait, Firestore doesn't easily query arrays of objects without custom indexing.
  // Instead, we query by checking if the uid exists in an array of uids, or simpler:
  // For V1, let's grab all trips and filter locally, or adjust the schema slightly.
  // We'll adjust the schema internally to have a simple array of memberUids for easy querying.
  
  const tripsRef = collection(db, "trips");
  const q = query(tripsRef, where("memberUids", "array-contains", uid));
  const querySnapshot = await getDocs(q);
  
  const trips = [];
  querySnapshot.forEach((doc) => {
    trips.push(doc.data());
  });
  
  return trips;
};

// Fetch a single trip's full details
export const getTripDetails = async (tripId) => {
  const tripRef = doc(db, "trips", tripId);
  const snap = await getDoc(tripRef);
  if (snap.exists()) {
    return snap.data();
  }
  throw new Error("Trip not found");
};


// --- ADMIN CONTROLS: TICKETS & HOTELS ---
export const addTicketToTrip = async (tripId, ticketData) => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    tickets: arrayUnion({ 
      ...ticketData, 
      id: `t-${Date.now()}` // Generate a simple unique ID
    })
  });
};

export const addHotelToTrip = async (tripId, hotelData) => {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    hotels: arrayUnion({ 
      ...hotelData, 
      id: `h-${Date.now()}` 
    })
  });
};

// --- EXPENSES (SUB-COLLECTION) ---
export const addExpenseToTrip = async (tripId, expenseData, paidByUid) => {
  const expensesRef = collection(db, "trips", tripId, "expenses");
  
  // Auto-generate a readable Transaction ID (e.g., TXN-84920)
  const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

  await addDoc(expensesRef, {
    ...expenseData,
    txnId,
    paidByUid,
    timestamp: serverTimestamp()
  });
};

export const getTripExpenses = async (tripId) => {
  const expensesRef = collection(db, "trips", tripId, "expenses");
  const q = query(expensesRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  
  const expenses = [];
  querySnapshot.forEach((doc) => {
    expenses.push({ id: doc.id, ...doc.data() });
  });
  
  return expenses;
};

export const joinTrip = async (tripId, uid, phoneNumber, displayName = "Traveler") => {
  const formattedTripId = tripId.trim().toUpperCase();
  const tripRef = doc(db, "trips", formattedTripId);
  const snap = await getDoc(tripRef);

  if (!snap.exists()) throw new Error("Trip not found! Please check the Group ID.");

  const tripData = snap.data();
  const isAlreadyMember = tripData.members?.some(m => m.uid === uid);

  if (!isAlreadyMember) {
    await updateDoc(tripRef, {
      members: arrayUnion({
        uid,
        role: "Member",
        name: displayName,
        phone: phoneNumber
      }),
      memberUids: arrayUnion(uid) // <-- THIS WAS MISSING
    });
  }
  
  return formattedTripId;
};