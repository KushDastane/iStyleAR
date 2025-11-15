import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft, FaChevronRight, FaCheck } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";

export default function CreativeCarousel({
  items,
  selectedItem,
  onSelect,
  onNext,
  onPrev,
  showTryAgain = false,
  onTryAgain,
  buttonText = "Try Again",
  slidesPerViewDesktop = 4,
  isItemAdded,
  hideNames = false,
}) {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);

  const hasButton = showTryAgain && onTryAgain;

  const getSlidesPerView = () => {
    if (typeof window === "undefined") return slidesPerViewDesktop;
    const width = window.innerWidth;
    if (width < 640) return Math.min(items.length, 1);
    if (width < 1024) return Math.min(items.length, 2);
    return Math.min(items.length, slidesPerViewDesktop);
  };

  const slidesPerView = getSlidesPerView();
  const maxIndex = Math.ceil(items.length / slidesPerView) - 1;

  useEffect(() => {
    if (activeIndex > maxIndex) setActiveIndex(maxIndex >= 0 ? maxIndex : 0);
  }, [slidesPerView, items.length, maxIndex, activeIndex]);

  useEffect(() => {
    if (!selectedItem || !swiperRef.current || !items.length) return;
    const index = items.findIndex((i) => i.id === selectedItem.id);
    if (index > -1) {
      const slideIndex = Math.floor(index / slidesPerView);
      swiperRef.current.slideTo(slideIndex);
    }
  }, [selectedItem, items, slidesPerView]);

  return (
    <div className="relative w-full px-12 overflow-hidden">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.snapIndex)}
        slidesPerView={slidesPerView}
        slidesPerGroup={slidesPerView}
        spaceBetween={20}
        loop={false}
        allowTouchMove={true}
        autoHeight={true} // 🔥 FIX: prevents clipping and scrollbars
      >
        {items.map((item) => {
          const isSelected = selectedItem && selectedItem.id === item.id;
          const isAdded = isItemAdded && isItemAdded(item);
          const isHovered = hoveredId === item.id;

          return (
            <SwiperSlide key={item.id} className="h-auto py-2">
              {/* 🔥 extra vertical padding fixes scale clipping */}
              <div
                onClick={() => {
                  onSelect?.(item);
                  const index = items.findIndex((i) => i.id === item.id);
                  if (index > -1 && swiperRef.current) {
                    swiperRef.current.slideTo(index);
                  }
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group cursor-pointer bg-white rounded-2xl 
                  border-2 transition-all duration-300 flex flex-col overflow-hidden

                  ${
                    hideNames
                      ? "" // No min-height in Try-On mode
                      : hasButton
                      ? "min-h-[360px]"
                      : "min-h-[300px]"
                  }

                  ${
                    isSelected
                      ? "border-indigo-500 shadow-xl shadow-indigo-100 scale-[1.01]" // 🔥 reduced scaling to prevent clipping
                      : "border-gray-200 hover:border-indigo-300 hover:shadow-lg"
                  }
                `}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 bg-indigo-500 text-white rounded-full p-1.5 shadow-lg">
                    <FaCheck size={16} strokeWidth={3} />
                  </div>
                )}

                {/* Image Container (same height for all) */}
                <div
                  className={`
                    relative w-full flex items-center justify-center
                    bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden

                    ${
                      hideNames
                        ? "h-48 sm:h-52 md:h-56" // 🔥 uniform height for Try-On
                        : "h-52 sm:h-56 md:h-60 lg:h-56"
                    }
                  `}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`max-h-full max-w-full object-contain transition-all duration-500 ${
                      isHovered ? "scale-110" : "scale-100"
                    }`}
                  />

                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/10 to-transparent transition-opacity duration-300 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>

                {/* Content Section — hidden in Try-On */}
                {!hideNames && (
                  <div
                    className={`flex flex-col p-4 justify-between bg-white ${
                      hasButton ? "flex-grow" : "flex-none"
                    }`}
                  >
                    <div className="flex-grow">
                      <h3
                        className={`font-semibold text-center text-gray-900 line-clamp-2 leading-snug ${
                          hasButton ? "text-base mb-3" : "text-base mb-2"
                        }`}
                      >
                        {item.name}
                      </h3>
                    </div>

                    {hasButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAdded) onTryAgain(item);
                        }}
                        disabled={isAdded}
                        className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                          ${
                            isAdded
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg active:scale-95"
                          }
                        `}
                      >
                        {isAdded && <FaCheck size={16} strokeWidth={2.5} />}
                        {isAdded ? "Added" : buttonText}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Arrows */}
      {maxIndex > 0 && (
        <>
          <button
            onClick={() => {
              swiperRef.current?.slidePrev();
              onPrev?.();
            }}
            disabled={activeIndex === 0}
            aria-label="Previous slide"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg border-2 border-gray-200 transition-all
              ${
                activeIndex === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-indigo-50 hover:border-indigo-300 hover:scale-110 active:scale-95"
              }
            `}
          >
            <FaChevronLeft
              size={20}
              className={activeIndex === 0 ? "text-gray-400" : "text-gray-700"}
            />
          </button>

          <button
            onClick={() => {
              swiperRef.current?.slideNext();
              onNext?.();
            }}
            disabled={activeIndex === maxIndex}
            aria-label="Next slide"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg border-2 border-gray-200 transition-all
              ${
                activeIndex === maxIndex
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-indigo-50 hover:border-indigo-300 hover:scale-110 active:scale-95"
              }
            `}
          >
            <FaChevronRight
              size={20}
              className={
                activeIndex === maxIndex ? "text-gray-400" : "text-gray-700"
              }
            />
          </button>
        </>
      )}

      {/* Progress Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => swiperRef.current?.slideTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full 
                ${
                  idx === activeIndex
                    ? "w-8 h-2 bg-indigo-600"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}
