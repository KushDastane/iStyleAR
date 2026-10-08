import React, { useState, useEffect } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function BodyProfileForm({ user, onClose, onUpdated }) {
  const [profile, setProfile] = useState({
    height: "",
    weight: "",
    chest: "",
    waist: "",
    shoulder: "",
    preferredFit: "regular"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().bodyProfile) {
          setProfile({ ...profile, ...snap.data().bodyProfile });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedProfile = {
        height: Number(profile.height) || null,
        weight: Number(profile.weight) || null,
        chest: Number(profile.chest) || null,
        waist: Number(profile.waist) || null,
        shoulder: Number(profile.shoulder) || null,
        preferredFit: profile.preferredFit
      };
      
      await updateDoc(doc(db, "users", user.uid), {
        bodyProfile: parsedProfile
      });
      toast.success("Body profile updated!");
      if (onUpdated) onUpdated(parsedProfile);
      onClose();
    } catch (error) {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Body Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">
            Enter your measurements (in cm/kg) to improve AI size recommendations. 
            These are optional, but they greatly improve fit accuracy.
          </p>

          {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div></div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Height (cm)</label>
                <input type="number" name="height" value={profile.height} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Weight (kg)</label>
                <input type="number" name="weight" value={profile.weight} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Chest (cm)</label>
                <input type="number" name="chest" value={profile.chest} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Waist (cm)</label>
                <input type="number" name="waist" value={profile.waist} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Shoulder (cm)</label>
                <input type="number" name="shoulder" value={profile.shoulder} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Preferred Fit</label>
                <select name="preferredFit" value={profile.preferredFit} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black">
                  <option value="slim">Slim</option>
                  <option value="regular">Regular</option>
                  <option value="oversized">Oversized</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 px-4 font-semibold text-white bg-black rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2">
             {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaSave /> Save Profile</>}
          </button>
        </div>
      </div>
    </div>
  );
}
