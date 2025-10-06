import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";

export default function CreativeCarousel({
  items,
  selectedItem,
  onSelect,
  showTryAgain = false,
  onTryAgain,
  buttonText = "Try Again",
  slidesPerViewDesktop = 4, // number of cards per view on desktop
}) {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(slidesPerViewDesktop);

  // Determine if button should be shown
  const hasButton = showTryAgain && onTryAgain;

  // Responsive slides
  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(
        window.innerWidth < 640
          ? 1
          : window.innerWidth < 1024
          ? 2
          : slidesPerViewDesktop
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slidesPerViewDesktop]);

  const maxIndex = Math.ceil(items.length / slidesPerView) - 1;

  useEffect(() => {
    if (activeIndex > maxIndex) setActiveIndex(maxIndex >= 0 ? maxIndex : 0);
  }, [slidesPerView, items.length, maxIndex, activeIndex]);

  return (
    <div className="relative w-full overflow-visible">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.snapIndex)}
        slidesPerView={slidesPerView}
        slidesPerGroup={slidesPerView}
        spaceBetween={16}
        loop={false}
        allowTouchMove={true}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="h-auto">
            <div
              onClick={() => onSelect?.(item)}
              className={`cursor-pointer bg-white rounded-xl border duration-300 flex flex-col ${
                hasButton ? "min-h-[320px]" : ""
              } shadow-md ${
                selectedItem && selectedItem.id === item.id
                  ? "border-indigo-600 shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {/* Image */}
              <div className="flex-shrink-0 h-52 sm:h-56 md:h-60 lg:h-56 w-full overflow-hidden rounded-t-xl flex items-center justify-center bg-gray-50">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="max-h-full object-contain transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Info + Optional Button */}
              <div
                className={`flex flex-col p-3 justify-between ${
                  hasButton ? "flex-grow" : "flex-none"
                }`}
              >
                <h3
                  className={`font-semibold text-center text-gray-800 mb-2 line-clamp-2 ${
                    hasButton ? "text-lg" : "text-base"
                  }`}
                >
                  {item.name}
                </h3>

                {hasButton && (
                  <button
                    onClick={() => onTryAgain(item)}
                    className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm font-medium transition"
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Arrows */}
      {maxIndex > 0 && (
        <>
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            disabled={activeIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
              activeIndex === 0 ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <FaChevronLeft />
          </button>

          <button
            onClick={() => swiperRef.current?.slideNext()}
            disabled={activeIndex === maxIndex}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
              activeIndex === maxIndex ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <FaChevronRight />
          </button>
        </>
      )}
    </div>
  );
}
