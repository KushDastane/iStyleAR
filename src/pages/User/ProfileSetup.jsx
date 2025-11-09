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
import EditEmailPassword from "../../Components/EditEmailPassword";

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
  const { user, logout, refreshUser } = useAuth();
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
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          name: data.name || data.displayName || "",
          avatar: data.avatar || defaultAvatar,
          gender: data.gender || "",
          bodyType: data.bodyType || "",
          stylePreferences: data.stylePreferences || [],
        });
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfileData = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileData.name,
        avatar: profileData.avatar,
        gender: profileData.gender,
        bodyType: profileData.bodyType,
        stylePreferences: profileData.stylePreferences,
        profileCompleted: true,
      });

      // Refresh user data in context to update navbar
      await refreshUser();

      localStorage.removeItem("newUser"); // remove new user flag
      toast.success("Profile updated successfully!");
      // Redirect to dashboard after profile completion
      navigate("/user");
    } catch (error) {
      console.error("Error saving profile data:", error);
      toast.error("Failed to save profile data");
    }
  };

  const handleNameEdit = () => {
    setTempName(profileData.name);
    setIsEditingName(true);
  };

  const saveName = () => {
    setProfileData({ ...profileData, name: tempName });
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setIsEditingName(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `profile/${user.uid}`);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      const avatarUrl = response.data.secure_url;
      setProfileData({ ...profileData, avatar: avatarUrl });
      setShowAvatarOptions(false);
      toast.success("Profile picture uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const selectPresetAvatar = (avatarUrl) => {
    setProfileData({ ...profileData, avatar: avatarUrl });
    setShowAvatarOptions(false);
  };

  const toggleStylePreference = (style) => {
    const currentPrefs = profileData.stylePreferences;
    if (currentPrefs.includes(style)) {
      setProfileData({
        ...profileData,
        stylePreferences: currentPrefs.filter((s) => s !== style),
      });
    } else {
      setProfileData({
        ...profileData,
        stylePreferences: [...currentPrefs, style],
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteAccount = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (!user) return;

      // Delete Firestore user document
      await updateDoc(doc(db, "users", user.uid), { deleted: true }); // optional: soft delete flag

      // Delete auth account
      await user.delete();

      toast.success("Your account has been permanently deleted");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please reauthenticate.");
    } finally {
      setShowConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9E4C5]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-[#C9E4C5] object-cover"
                />
                <button
                  onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  className="absolute bottom-0 right-0 bg-[#C9E4C5] p-2 rounded-full shadow-md hover:shadow-lg transition"
                >
                  <FaCamera className="w-4 h-4 text-gray-700" />
                </button>

                {/* Avatar Options */}
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
                          {presetAvatars.map((avatar, index) => (
                            <img
                              key={index}
                              src={avatar}
                              alt={`Preset ${index + 1}`}
                              onClick={() => selectPresetAvatar(avatar)}
                              className="w-12 h-12 rounded-full border-2 border-gray-200 cursor-pointer hover:border-[#C9E4C5] transition"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name Section */}
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
                        onClick={cancelNameEdit}
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
                      {profileData.name || "User"}
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

          {/* Profile Setup Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FaUser className="w-6 h-6 text-[#C9E4C5]" />
              <h2 className="text-xl font-semibold text-gray-800">
                Profile Setup
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Helps us personalize your try-on experience
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) =>
                    setProfileData({ ...profileData, gender: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9E4C5]"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Type
                </label>
                <select
                  value={profileData.bodyType}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bodyType: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9E4C5]"
                >
                  <option value="">Select Size</option>
                  <option value="xs">XS</option>
                  <option value="s">S</option>
                  <option value="m">M</option>
                  <option value="l">L</option>
                  <option value="xl">XL</option>
                  <option value="xxl">XXL</option>
                </select>
              </div>
            </div>

            {/* Style Preferences */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Style Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Casual",
                  "Partywear",
                  "Formal",
                  "Ethnic/Traditional",
                  "Streetwear",
                  "Sporty",
                  "Minimalist",
                  "Trendy",
                ].map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleStylePreference(style)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      profileData.stylePreferences.includes(style)
                        ? "bg-[#C9E4C5] text-gray-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveProfileData}
              className="mt-6 bg-[#C9E4C5] text-gray-800 px-6 py-2 rounded-lg hover:bg-[#b8d4b2] transition flex items-center gap-2"
            >
              <FaSave className="w-4 h-4" />
              Save Profile
            </button>
          </div>

          {/* My Space Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-[#C9E4C5] rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUser className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">My Wardrobe</h3>
              <p className="text-sm text-gray-600">Saved outfits</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-[#C9E4C5] rounded-full flex items-center justify-center mx-auto mb-3">
                <FaCamera className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">My Captures</h3>
              <p className="text-sm text-gray-600">Saved AR try-on photos</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-[#C9E4C5] rounded-full flex items-center justify-center mx-auto mb-3">
                <FaStar className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                My Achievements
              </h3>
              <p className="text-sm text-gray-600">Badges & milestones</p>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaCog className="w-6 h-6 text-[#C9E4C5]" />
              <h2 className="text-xl font-semibold text-gray-800">
                Account Settings
              </h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full md:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                Edit Email / Password
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full md:w-auto bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
              >
                <FaTrash className="w-4 h-4" />
                Delete Account
              </button>

              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <FaSignOutAlt className="w-4 h-4" />
                Log Out
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
      {showEditModal && (
        <EditEmailPassword onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}
