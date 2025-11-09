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

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleAddCloth = async (cloth) => {
    if (!user) return toast.error("Please log in first!");
    if (!selectedFile) return toast.error("Select an image!");
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
        name: cloth.name,
        imageUrl: res.data.secure_url,
        addedAt: serverTimestamp(),
        source: "userUpload",
        favorite: false,
      });

      toast.success("Added to wardrobe!");
      setSelectedFile(null);
      document.getElementById("userClothName").value = "";
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

  const displayedWardrobe = showFavoritesOnly
    ? wardrobe.filter((c) => favorites.includes(c.id))
    : wardrobe;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Creative Title */}
        <div className="text-center mb-10 flex flex-col items-center gap-3 p-6 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl shadow-xl">
          <div className="flex items-center justify-center gap-3">
            <FaTshirt className="text-green-200 text-3xl transition-transform hover:scale-110" />
            <h1 className="text-5xl font-extrabold text-white relative">
              My Virtual Wardrobe
              <span className="block h-1 w-24 bg-white/70 rounded-full mt-2 mx-auto"></span>
            </h1>
            <FaTshirt className="text-pink-300 text-3xl transition-transform hover:scale-110" />
          </div>
          <p className="text-white/80 italic text-sm mt-1">
            Organize, Try-On & Flaunt Your Style
          </p>
        </div>

        {/* Filter by Favorites */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 p-2 rounded-full transition-transform transform hover:scale-105 ${
              showFavoritesOnly
                ? "bg-pink-500 text-white shadow-lg"
                : "bg-white border border-gray-300"
            }`}
          >
            {showFavoritesOnly ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* Wardrobe Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoadingWardrobe ? (
            <div className="flex justify-center items-center py-8 col-span-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading wardrobe...</span>
            </div>
          ) : displayedWardrobe.length === 0 ? (
            <div className="bg-white/70 p-10 rounded-3xl text-center shadow-md col-span-full">
              <p className="text-gray-500 text-lg">No items to show.</p>
            </div>
          ) : (
            displayedWardrobe.map((cloth) => (
              <div
                key={cloth.id}
                className="relative rounded-3xl bg-white shadow-md p-3 flex flex-col items-center hover:shadow-xl transition-transform transform hover:scale-3d"
              >
                {/* Favorite Heart */}
                <button
                  onClick={() => toggleFavorite(cloth)}
                  className="absolute top-3 right-3 text-lg text-pink-500 hover:scale-125 transition-transform"
                >
                  {favorites.includes(cloth.id) ? <FaHeart /> : <FaRegHeart />}
                </button>

                <img
                  src={cloth.imageUrl}
                  alt={cloth.name}
                  className="w-32 h-32 object-contain mb-2"
                />

                {editId === cloth.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border p-1 rounded-md text-sm w-24"
                    />
                    <button
                      onClick={() => handleEditSave(cloth.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FaSave />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <p className="font-medium text-gray-700 text-sm mb-2 text-center">
                    {cloth.name}
                  </p>
                )}

                <div className="flex gap-2 justify-center">
                  {/* Try-On Button */}
                  <button
                    onClick={() =>
                      navigate(`/user/try-on`, { state: { cloth } })
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-3 py-2 rounded-xl flex items-center justify-center text-sm "
                    title="Try On"
                  >
                    <FaTshirt />
                    <span className="hidden sm:inline ml-1">Try On</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditStart(cloth)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 sm:px-3 py-2 rounded-xl flex items-center justify-center text-sm "
                    title="Edit"
                  >
                    <FaEdit />
                    <span className="hidden sm:inline ml-1">Edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteCloth(cloth.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-xl flex items-center justify-center text-sm "
                    title="Delete"
                  >
                    <FaTrash />
                    <span className="hidden sm:inline ml-1">Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Section */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-3xl shadow-md">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded-xl text-sm"
            />
            <input
              type="text"
              placeholder="Name your item"
              className="border p-2 rounded-xl text-sm flex-1 min-w-[150px]"
              id="userClothName"
            />
            <button
              onClick={() => {
                const name =
                  document.getElementById("userClothName").value || "My Item";
                handleAddCloth({ name, img: null });
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-sm transition disabled:opacity-50"
              disabled={uploading || !selectedFile}
            >
              <FaUpload /> Upload
            </button>
          </div>
        </section>

        {/* Add from Trending */}
        <div className="text-center mt-10">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <FaTshirt /> Add from Trending
              </h2>
              <p className="text-indigo-100 text-sm">
                Discover the most popular outfits and add them to your
                collection.
              </p>
            </div>
            <button
              onClick={() => navigate("/user/trending")}
              className="bg-white text-indigo-700 px-5 py-2 rounded-2xl font-semibold flex items-center gap-2 hover:bg-indigo-100 transition"
            >
              Go to Trending <FaChartLine />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
