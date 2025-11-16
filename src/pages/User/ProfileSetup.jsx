import React, { useState, useEffect } from "react";
import { Listbox } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
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
  FaTrophy,
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
  const { user, logout, refreshUser, updateUser } = useAuth();
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

  const [savedTryOns, setSavedTryOns] = useState([]);

  useEffect(() => {
    fetchProfileData();
    fetchSavedTryOns();
  }, [user]);

  useEffect(() => {
    if (user && user.avatar && profileData.avatar !== user.avatar) {
      setProfileData((prev) => ({ ...prev, avatar: user.avatar }));
    }
  }, [user, profileData.avatar]);

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

  const fetchSavedTryOns = async () => {
    if (!user) return;

    try {
      const triesSnap = await getDocs(
        collection(db, "users", user.uid, "tries")
      );
      const tries = triesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedTryOns(tries);
    } catch (err) {
      console.error("Error fetching saved try-ons:", err);
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
      toast.success("Updated Successfully");
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
      setProfileData({
        ...profileData,
        avatar: avatarUrl,
        avatarSource: "custom", // ⭐ prevents Google overwriting!
      });

      // ⭐ Update context immediately for navbar refresh
      updateUser({ avatar: avatarUrl });

      setShowAvatarOptions(false);
      toast.success("Profile picture uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const selectPresetAvatar = (avatarUrl) => {
    setProfileData({
      ...profileData,
      avatar: avatarUrl,
      avatarSource: "custom", // ⭐ same here
    });

    // ⭐ Update context immediately for navbar refresh
    updateUser({ avatar: avatarUrl });

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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ===================== PROFILE HEADER + FORM (MERGED CARD) ===================== */}
          <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-lg p-10 mb-12 relative">
            {/* ─── Avatar + Name Row ───────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="relative group z-30">
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-2xl shadow-md object-cover border border-gray-300"
                />

                <button
                  onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  className="
                  absolute -bottom-3 -right-3 p-3
                  bg-gradient-to-br from-emerald-400 to-emerald-500 
                  text-white rounded-xl shadow-lg
                  hover:shadow-xl active:scale-95 transition
                "
                >
                  <FaCamera className="w-4 h-4" />
                </button>

                {showAvatarOptions && (
                  <div
                    className="
                  absolute z-[9999] mt-4 left-1/2 -translate-x-1/2
                  bg-white shadow-xl border border-gray-200 
                  rounded-2xl w-72 p-5
                "
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700 text-sm">
                        Update Avatar
                      </h4>
                      <button
                        onClick={() => setShowAvatarOptions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Upload */}
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer
                      border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <FaUpload />
                      <span className="text-sm font-medium">Upload Image</span>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />

                    <p className="text-xs text-gray-500 mt-4 mb-2">
                      Choose a preset
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {presetAvatars.map((av, i) => (
                        <img
                          key={i}
                          src={av}
                          onClick={() => selectPresetAvatar(av)}
                          className="
                          w-14 h-14 rounded-xl border cursor-pointer 
                          hover:scale-105 hover:border-emerald-400 
                          transition object-cover
                        "
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name + Subtext */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                  Welcome,
                  {isEditingName ? (
                    <span className="inline-flex items-center gap-2 ml-2">
                      <input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        autoFocus
                        className="border rounded-lg px-2 py-1 text-lg font-semibold"
                      />
                      <FaCheck
                        onClick={saveName}
                        className="text-green-600 cursor-pointer"
                      />
                      <FaTimes
                        onClick={cancelNameEdit}
                        className="text-red-500 cursor-pointer"
                      />
                    </span>
                  ) : (
                    <span
                      onClick={handleNameEdit}
                      className="ml-2 cursor-pointer text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {profileData.name || "User"}
                      <FaEdit className="text-sm" />
                    </span>
                  )}
                </h1>

                <p className="text-gray-600 text-sm md:text-base">
                  Personalize your virtual try-on experience
                </p>
              </div>
            </div>

            {/* ===================== PROFILE SETUP FORM (In same card) ===================== */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <FaUser className="text-emerald-500 w-6 h-6" />
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  Profile Details
                </h2>
              </div>

              <p className="text-gray-600 mb-8 text-sm">
                Complete your details to improve outfit recommendations.
              </p>

              {/* ⭐ HEADLESS UI DROPDOWNS HERE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender Dropdown */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <Listbox
                    value={profileData.gender}
                    onChange={(value) =>
                      setProfileData({ ...profileData, gender: value })
                    }
                  >
                    <div className="relative mt-1">
                      <Listbox.Button
                        className="
                        w-full bg-white border border-gray-300 rounded-xl py-2.5 px-4 text-left
                        focus:outline-none focus:ring-2 focus:ring-emerald-300
                      "
                      >
                        <span className="block text-gray-700">
                          {profileData.gender || "Select gender"}
                        </span>
                      </Listbox.Button>

                      <Listbox.Options
                        className="
                        absolute mt-2 w-full bg-white shadow-lg rounded-xl border border-gray-200
                        focus:outline-none z-[9999]
                      "
                      >
                        {["Male", "Female", "Other", "Prefer not to say"].map(
                          (g) => (
                            <Listbox.Option
                              key={g}
                              value={g}
                              className={({ active }) =>
                                `cursor-pointer px-4 py-2 text-sm ${
                                  active ? "bg-gray-100" : ""
                                }`
                              }
                            >
                              {g}
                            </Listbox.Option>
                          )
                        )}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {/* Body Size Dropdown */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Body Size
                  </label>
                  <Listbox
                    value={profileData.bodyType}
                    onChange={(value) =>
                      setProfileData({ ...profileData, bodyType: value })
                    }
                  >
                    <div className="relative mt-1">
                      <Listbox.Button
                        className="
                        w-full bg-white border border-gray-300 rounded-xl py-2.5 px-4 text-left
                        focus:outline-none focus:ring-2 focus:ring-emerald-300
                      "
                      >
                        <span className="block text-gray-700">
                          {profileData.bodyType || "Select size"}
                        </span>
                      </Listbox.Button>

                      <Listbox.Options
                        className="
                        absolute mt-2 w-full bg-white shadow-lg rounded-xl border border-gray-200
                        focus:outline-none z-[9999]
                      "
                      >
                        {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                          <Listbox.Option
                            key={s}
                            value={s}
                            className={({ active }) =>
                              `cursor-pointer px-4 py-2 text-sm ${
                                active ? "bg-gray-100" : ""
                              }`
                            }
                          >
                            {s}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>
              </div>

              {/* Style Chips */}
              <div className="mt-8">
                <label className="text-sm font-medium text-gray-700">
                  Style Preferences
                </label>

                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Casual",
                    "Formal",
                    "Partywear",
                    "Streetwear",
                    "Sporty",
                    "Ethnic",
                    "Minimalist",
                    "Trendy",
                  ].map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleStylePreference(style)}
                      className={`
                        px-4 py-1 rounded-full text-sm border transition-all
                        ${
                          profileData.stylePreferences.includes(style)
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }
                      `}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveProfileData}
                className="
                mt-8 bg-gradient-to-r from-emerald-500 to-emerald-600
                text-white font-semibold px-6 py-3 rounded-xl
                hover:shadow-lg active:scale-95 transition
              "
              >
                <FaSave className="inline mr-2" /> Save Profile
              </button>
            </div>
          </div>

          {/* ===================== MY SPACE CARDS ===================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "My Wardrobe",
                icon: <FaUser className="text-gray-700 w-6 h-6" />,
                onClick: () => navigate("/user/wardrobe"),
                subtitle: "Saved outfits",
              },
              {
                title: "My Captures",
                icon: <FaCamera className="text-gray-700 w-6 h-6" />,
                onClick: () => navigate("/user/captures"),
                subtitle: `${savedTryOns.length} try-on photos`,
              },
              {
                title: "Achievements",
                icon: <FaTrophy className="text-gray-700 w-6 h-6" />,
                onClick: () => navigate("/user/achievements"),
                subtitle: "Badges & milestones",
              },
            ].map((card) => (
              <div
                key={card.title}
                onClick={card.onClick}
                className="
                cursor-pointer bg-white/80 backdrop-blur-lg
                border rounded-2xl shadow-md p-6 text-center
                hover:shadow-xl hover:-translate-y-1 transition-all
              "
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              </div>
            ))}
          </div>

          {/* ===================== ACCOUNT SETTINGS ===================== */}
          <div className="bg-white/80 rounded-3xl border shadow-lg p-10">
            <div className="flex items-center gap-3 mb-6">
              <FaCog className="text-emerald-500 w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                Account Settings
              </h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleDeleteAccount}
                className="
                w-full md:w-auto bg-red-100 px-5 py-2 rounded-xl
                hover:bg-red-200 flex items-center gap-2 text-red-700
              "
              >
                <FaTrash className="w-4 h-4" /> Delete Account
              </button>

              <button
                onClick={handleLogout}
                className="
                w-full md:w-auto bg-gray-100 px-5 py-2 rounded-xl
                hover:bg-gray-200 flex items-center gap-2 text-gray-700
              "
              >
                <FaSignOutAlt className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showConfirm && (
        <DeleteAccountConfirm
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
