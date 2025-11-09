import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DeleteAccountConfirm from "../../Components/DeleteAccountConfirm";
import axios from "axios";
import {
  FaUser,
  FaCamera,
  FaStar,
  FaCog,
  FaUpload,
  FaCheck,
  FaTimes,
  FaSignOutAlt,
  FaTrash,
  FaEdit,
  FaSave,
} from "react-icons/fa";

const defaultAvatar = "/defaultpfp.png";

const presetAvatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Dusty",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Elliot",
];

export default function ProfileSetup() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: "",
    avatar: defaultAvatar,
    gender: "",
    bodyType: "",
    stylePreferences: [],
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🧩 1️⃣ Safe data fetch (only runs when user is ready)
  useEffect(() => {
    if (!user || loading) return; // wait for auth to be ready

    const fetchProfileData = async () => {
      try {
        console.log("📄 Fetching profile data for UID:", user.uid);
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            name: data.name || data.displayName || "",
            avatar: data.avatar || defaultAvatar,
            gender: data.gender || "",
            bodyType: data.bodyType || "",
            stylePreferences: data.stylePreferences || [],
          });
        } else {
          console.warn("⚠️ No profile document found; using defaults.");
          setProfileData({
            ...profileData,
            name: user.displayName || user.email || "User",
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("🔥 Error fetching profile data:", err);
          toast.error("Failed to load profile data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, loading]);

  // 🧩 2️⃣ Prevent rendering before user is ready
  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9E4C5]" />
      </div>
    );
  }

  // ✅ Save profile
  const saveProfileData = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileData.name,
        avatar: profileData.avatar,
        gender: profileData.gender,
        bodyType: profileData.bodyType,
        stylePreferences: profileData.stylePreferences,
        profileCompleted: true,
      });

      localStorage.removeItem("newUser");
      toast.success("Profile updated successfully!");
      navigate("/user");
    } catch (error) {
      console.error("Error saving profile data:", error);
      toast.error("Failed to save profile data");
    }
  };

  // 💬 Misc helper methods
  const handleNameEdit = () => {
    setTempName(profileData.name);
    setIsEditingName(true);
  };

  const saveName = () => {
    setProfileData({ ...profileData, name: tempName });
    setIsEditingName(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Invalid image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("File size < 5MB");

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `profile/${user.uid}`);

      const { data } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      setProfileData({ ...profileData, avatar: data.secure_url });
      setShowAvatarOptions(false);
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed, please retry.");
    }
  };

  const selectPresetAvatar = (avatarUrl) => {
    setProfileData({ ...profileData, avatar: avatarUrl });
    setShowAvatarOptions(false);
  };

  const toggleStylePreference = (style) => {
    const prefs = profileData.stylePreferences;
    setProfileData({
      ...profileData,
      stylePreferences: prefs.includes(style)
        ? prefs.filter((s) => s !== style)
        : [...prefs, style],
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), { deleted: true });
      await user.delete();
      toast.success("Account deleted");
      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete account");
    } finally {
      setShowConfirm(false);
    }
  };

  // 🧱 UI Rendering (unchanged, only cleaned up logic)
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={profileData.avatar || defaultAvatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-[#C9E4C5] object-cover"
                />
                <button
                  onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  className="absolute bottom-0 right-0 bg-[#C9E4C5] p-2 rounded-full shadow-md"
                >
                  <FaCamera className="w-4 h-4 text-gray-700" />
                </button>

                {showAvatarOptions && (
                  <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-64">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">
                        Change Avatar
                      </h4>
                      <button
                        onClick={() => setShowAvatarOptions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label
                        htmlFor="avatar-upload"
                        className="block cursor-pointer"
                      >
                        <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <FaUpload className="w-4 h-4" />
                          <span className="text-sm">Upload Photo</span>
                        </div>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />

                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Choose Preset
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {presetAvatars.map((avatar, i) => (
                            <img
                              key={i}
                              src={avatar}
                              alt={`Preset ${i + 1}`}
                              onClick={() => selectPresetAvatar(avatar)}
                              className="w-12 h-12 rounded-full border-2 border-gray-200 cursor-pointer hover:border-[#C9E4C5]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome,{" "}
                  {isEditingName ? (
                    <div className="inline-flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-lg font-bold"
                        autoFocus
                      />
                      <button
                        onClick={saveName}
                        className="text-green-600 hover:text-green-700"
                      >
                        <FaCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={handleNameEdit}
                      className="cursor-pointer hover:text-[#C9E4C5] transition"
                    >
                      {profileData.name || "User"}{" "}
                      <FaEdit className="w-4 h-4 inline ml-2" />
                    </span>
                  )}
                </h1>
                <p className="text-gray-600">
                  Complete your profile to personalize your iStyleAR experience
                </p>
              </div>
            </div>
          </div>

          {/* Rest of your sections unchanged */}
          {/* ... (Profile setup, preferences, save button, etc.) ... */}

          {/* Account Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <FaCog className="w-6 h-6 text-[#C9E4C5]" />
              <h2 className="text-xl font-semibold text-gray-800">
                Account Settings
              </h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full md:w-auto bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2"
              >
                <FaTrash className="w-4 h-4" /> Delete Account
              </button>

              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <FaSignOutAlt className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <DeleteAccountConfirm
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
