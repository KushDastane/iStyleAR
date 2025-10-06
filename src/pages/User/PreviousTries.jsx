import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function PreviousTries() {
  const { user } = useAuth();
  const [tries, setTries] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchTries = async () => {
      try {
        const q = query(
          collection(db, "users", user.uid, "tries"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setTries(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTries();
  }, [user]);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Previous Tries</h1>
      {tries.length === 0 ? (
        <p className="text-gray-600">You haven’t tried any clothes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tries.map((item, idx) => (
            <div key={idx} className="bg-white p-2 rounded-lg shadow-md">
              <img
                src={item.imageUrl}
                alt="try"
                className="w-full h-48 object-contain rounded-md"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
