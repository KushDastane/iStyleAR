import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";

export default function CreativeCarousel({
  title,
  items,
  selectedItem,
  onSelect, // Pass selected dress setter from parent
  showTryAgain = true,
  onTryAgain,
  buttonText = "Try Again",
}) {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(4);

  // Responsive slides
  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(
        window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 4
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.ceil(items.length / slidesPerView) - 1;

  useEffect(() => {
    if (activeIndex > maxIndex) setActiveIndex(maxIndex >= 0 ? maxIndex : 0);
  }, [slidesPerView, items.length, maxIndex, activeIndex]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 overflow-visible mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
        {title}
      </h2>

      {/* Left Arrow */}
      {maxIndex > 0 && (
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          disabled={activeIndex === 0}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
            activeIndex === 0 ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          <FaChevronLeft className="text-black text-lg" />
        </button>
      )}

      {/* Right Arrow */}
      {maxIndex > 0 && (
        <button
          onClick={() => swiperRef.current?.slideNext()}
          disabled={activeIndex === maxIndex}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
            activeIndex === maxIndex ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          <FaChevronRight className="text-black text-lg" />
        </button>
      )}

      {/* Swiper */}
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.snapIndex)}
        slidesPerView={slidesPerView}
        slidesPerGroup={slidesPerView}
        spaceBetween={24}
        loop={false}
        allowTouchMove={true}
        className="w-full"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div
              className={`bg-white rounded-xl overflow-hidden border duration-300 cursor-pointer ${
                selectedItem?.id === item.id
                  ? "border-indigo-600 shadow-lg"
                  : "border-gray-200"
              }`}
              onClick={() => onSelect?.(item)} // select on click
            >
              <div className="h-40 sm:h-48 md:h-52 lg:h-44 xl:h-40 w-full  overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="mt-3 px-4 pb-5 flex flex-col gap-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                {showTryAgain && onTryAgain && (
                  <button
                    onClick={() => onTryAgain(item)}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm font-medium transition"
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Mini Progress Bar */}
      {maxIndex > 0 && (
        <div className="flex justify-center items-center mt-6">
          <div className="w-36 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-500"
              style={{
                width: `${((activeIndex + 1) / (maxIndex + 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
