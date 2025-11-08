# TODO: Fix Top Suggestions on Homepage and Recently Tried

## Tasks

- [x] Modify RecommendationContext.jsx to fetch trending items and select 4 random ones
- [x] Add replaceItem function in RecommendationContext to replace added item with another random trending item, excluding already added items
- [x] Update Dashboard.jsx to call replaceItem after adding to wardrobe with excluded items
- [x] Update Recently Tried to show latest 4 clothes tried (clothImageUrl from tryHistory) - Changed to 4 items and use clothImageUrl as imageUrl, added clothName and clothImageUrl to tryHistoryEntry, set slidesPerViewDesktop to match number of items (max 4), filter out items without clothImageUrl and clothName, updated CreativeCarousel to use Math.min for slidesPerView and prevent centering, hide section when wardrobe is empty, filter out items not in wardrobe
- [x] Remove video mirroring in try-on page
- [ ] Test the random selection and replacement functionality
