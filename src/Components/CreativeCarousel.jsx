import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";

const CreativeCarousel = forwardRef(
  (
    {
      items,
      selectedItem,
      onSelect,
      showTryAgain = false,
      onTryAgain,
      buttonText = "Try Again",
      slidesPerViewDesktop = 4,
      isItemAdded,
    },
    ref
  ) => {
    const swiperRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Expose methods for gestures
    useImperativeHandle(ref, () => ({
      slideTo: (index) => swiperRef.current?.slideTo(index),
      slideNext: () => swiperRef.current?.slideNext(),
      slidePrev: () => swiperRef.current?.slidePrev(),
    }));

    // Responsive slides per view
    const getSlidesPerView = () => {
      if (typeof window === "undefined") return slidesPerViewDesktop;
      const width = window.innerWidth;
      if (width < 640) return Math.min(items.length, 1);
      if (width < 1024) return Math.min(items.length, 2);
      return Math.min(items.length, slidesPerViewDesktop);
    };

    const slidesPerView = getSlidesPerView();
    const maxIndex = Math.max(0, items.length - slidesPerView);

    useEffect(() => {
      if (activeIndex > maxIndex) setActiveIndex(maxIndex);
    }, [slidesPerView, items.length, maxIndex]);

    const hasButton = showTryAgain && onTryAgain;

    return (
      <div className="relative w-full overflow-visible">
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
          }}
          slidesPerView={slidesPerView}
          slidesPerGroup={1} // 👈 IMPORTANT: allow slideTo(any index)
          spaceBetween={16}
          loop={false}
          allowTouchMove={true}
          centeredSlides={false}
          centeredSlidesBounds={false}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className="h-auto">
              <div
                onClick={() => {
                  onSelect?.(item);
                  const index = items.findIndex((i) => i.id === item.id);
                  if (index > -1) {
                    swiperRef.current?.slideTo(index);
                  }
                }}
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
                      onClick={
                        isItemAdded && isItemAdded(item)
                          ? undefined
                          : () => onTryAgain(item)
                      }
                      className={`mt-auto w-full text-white py-2 rounded-md text-sm font-medium transition ${
                        isItemAdded && isItemAdded(item)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      {isItemAdded && isItemAdded(item) ? "Added" : buttonText}
                    </button>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Arrows - ONLY SCROLL, don't change selection */}
        {items.length > slidesPerView && (
          <>
            <button
              onClick={() => {
                swiperRef.current?.slidePrev();
              }}
              disabled={activeIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
                activeIndex === 0 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <FaChevronLeft />
            </button>

            <button
              onClick={() => {
                swiperRef.current?.slideNext();
              }}
              disabled={activeIndex >= maxIndex}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-md hover:bg-gray-100 transition ${
                activeIndex >= maxIndex ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>
    );
  }
);

export default CreativeCarousel;
