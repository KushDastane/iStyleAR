import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { GiClothes } from "react-icons/gi";
import {
  FaEdit,
  FaTrash,
  FaTshirt,
  FaUpload,
  FaSave,
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaPlus,
  FaImage,
} from "react-icons/fa";

export default function VirtualWardrobe() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const newItemFromTrending = location.state?.newItem || null;

  const [wardrobe, setWardrobe] = useState([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  useEffect(() => {
    if (user) fetchWardrobe();
  }, [user]);

  useEffect(() => {
    if (newItemFromTrending && user) addFromTrending(newItemFromTrending);
  }, [newItemFromTrending, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const fetchWardrobe = async () => {
    setIsLoadingWardrobe(true);
    try {
      const clothesSnap = await getDocs(
        collection(db, "users", user.uid, "wardrobe")
      );
      const clothesData = clothesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWardrobe(clothesData);

      const favs = clothesData.filter((c) => c.favorite).map((c) => c.id);
      setFavorites(favs);
    } finally {
      setIsLoadingWardrobe(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddCloth = async () => {
    if (!user) return toast.error("Please log in first!");
    if (!selectedFile) return toast.error("Select an image!");
    if (!newItemName.trim()) return toast.error("Enter an item name!");

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `wardrobe/${user.uid}`);

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      await addDoc(collection(db, "users", user.uid, "wardrobe"), {
        name: newItemName,
        imageUrl: res.data.secure_url,
        addedAt: serverTimestamp(),
        source: "userUpload",
        favorite: false,
      });

      toast.success("Added to wardrobe!");
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewItemName("");
      setShowUploadModal(false);
      fetchWardrobe();
    } catch {
      toast.error("Upload failed.");
    }
    setUploading(false);
  };

  const addFromTrending = async (item) => {
    try {
      await addDoc(collection(db, "users", user.uid, "wardrobe"), {
        name: item.name,
        imageUrl: item.img,
        addedAt: serverTimestamp(),
        source: "trending",
        favorite: false,
      });
      toast.success(`"${item.name}" added from Trending!`);
      fetchWardrobe();
    } catch {
      toast.error("Failed to add item.");
    }
  };

  const handleDeleteCloth = async (clothId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    await deleteDoc(doc(db, "users", user.uid, "wardrobe", clothId));
    toast.success("Removed from wardrobe!");
    fetchWardrobe();
  };

  const handleEditStart = (cloth) => {
    setEditId(cloth.id);
    setEditName(cloth.name);
  };

  const handleEditSave = async (clothId) => {
    if (!editName.trim()) return toast.error("Name cannot be empty!");
    await updateDoc(doc(db, "users", user.uid, "wardrobe", clothId), {
      name: editName,
    });
    toast.success("Updated!");
    setEditId(null);
    fetchWardrobe();
  };

  const toggleFavorite = async (cloth) => {
    const updated = !favorites.includes(cloth.id);
    setFavorites((prev) =>
      updated ? [...prev, cloth.id] : prev.filter((id) => id !== cloth.id)
    );
    await updateDoc(doc(db, "users", user.uid, "wardrobe", cloth.id), {
      favorite: updated,
    });
  };

  const filteredWardrobe = wardrobe.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedWardrobe = showFavoritesOnly
    ? filteredWardrobe.filter((c) => favorites.includes(c.id))
    : filteredWardrobe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER — REFINED SCANDINAVIAN DESIGN */}
        <div
          className="
    mb-10 relative overflow-hidden rounded-2xl
    border border-gray-200 shadow-md p-10
    bg-[url('/textures/soft-wood.png')] bg-cover bg-center
  "
        >
          {/* Soft frosted overlay */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>

          {/* Content */}
          <div className="relative flex flex-col items-center text-center gap-5">
            {/* Icon Container */}
            <div
              className="
      w-20 h-20 flex items-center justify-center
      bg-white/80 backdrop-blur-md rounded-3xl shadow-lg 
      ring-1 ring-gray-200
    "
            >
              <GiClothes className="text-4xl text-gray-800" />
            </div>

            {/* Title */}
            <h1
              className="
      text-4xl md:text-5xl font-extrabold 
      text-gray-900 tracking-tight
    "
            >
              My Wardrobe
            </h1>

            {/* Subtext */}
            <p className="text-gray-600 text-base md:text-lg max-w-sm leading-relaxed">
              {wardrobe.length} {wardrobe.length === 1 ? "item" : "items"}{" "}
              organized neatly
            </p>

            {/* Action Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="
        bg-black text-white px-6 py-3 rounded-xl
        font-semibold flex items-center gap-2 
        hover:bg-gray-900 active:scale-[0.98]
        transition-all shadow-sm
      "
            >
              <FaPlus className="text-md" />
              Add Item
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="rounded-xl shadow-sm p-4 mb-8 border border-gray-200 bg-white bg-[url('/textures/soft-wood.png')] bg-cover bg-center bg-no-repeat bg-opacity-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black bg-white"
              />
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                showFavoritesOnly
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showFavoritesOnly ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart className="text-red-500" />
              )}
              <span className="inline">
                {showFavoritesOnly ? "Favorites" : "All Items"}
              </span>
            </button>
          </div>
        </div>

        {/* GRID / SHELVES */}
        {isLoadingWardrobe ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        ) : displayedWardrobe.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <FaTshirt className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || showFavoritesOnly
                ? "No items found"
                : "Wardrobe empty"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try a different term"
                : showFavoritesOnly
                ? "You haven't favorited anything yet"
                : "Start adding your outfits"}
            </p>

            {!searchQuery && !showFavoritesOnly && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <FaPlus /> Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedWardrobe.map((cloth) => (
              <div
                key={cloth.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-3"
              >
                {/* IMAGE */}
                <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
                  <img
                    src={cloth.imageUrl}
                    alt={cloth.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />

                  {/* FAVORITE */}
                  <button
                    onClick={() => toggleFavorite(cloth)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-black hover:scale-110 transition"
                  >
                    {favorites.includes(cloth.id) ? (
                      <FaHeart />
                    ) : (
                      <FaRegHeart />
                    )}
                  </button>
                </div>

                {/* TEXT + ACTIONS */}
                <div className="p-3">
                  {editId === cloth.id ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-black"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(cloth.id)}
                        className="text-green-600"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-gray-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-gray-900 text-base mb-3 truncate">
                      {cloth.name}
                    </h3>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        navigate(`/user/try-on`, { state: { cloth } })
                      }
                      className="bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <FaTshirt /> Try
                    </button>

                    <button
                      onClick={() => handleEditStart(cloth)}
                      className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteCloth(cloth.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <FaTrash /> Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRENDING CTA */}
        <div className="mt-12">
          <div className="bg-black text-white rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <FaChartLine /> Trending Styles
                </h2>
                <p className="text-gray-300 text-sm max-w-md">
                  Explore the latest outfits & add them instantly.
                </p>
              </div>

              <button
                onClick={() => navigate("/user/trending")}
                className="bg-white text-black px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-100 shadow"
              >
                Browse Trending <FaChartLine />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaPlus /> Add New Item
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setNewItemName("");
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6">
              {/* IMAGE PREVIEW */}
              <div className="mb-6">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      className="w-full h-64 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-black text-white p-2 rounded-full"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black bg-gray-50">
                    <FaImage className="text-gray-400 text-5xl mb-3" />
                    <span className="text-sm text-gray-600 font-medium">
                      Click to upload
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* NAME INPUT */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Blue Shirt"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setNewItemName("");
                  }}
                  className="flex-1 px-6 py-3 border border-gray-400 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddCloth}
                  disabled={uploading || !selectedFile || !newItemName.trim()}
                  className="flex-1 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload /> Add Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
