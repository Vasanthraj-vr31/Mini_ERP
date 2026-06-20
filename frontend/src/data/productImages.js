/**
 * Furniture product image mapping
 * Maps product name keywords → high-quality Unsplash image URLs
 * Used by ProductImage component for automatic image assignment
 */

export const PRODUCT_IMAGE_MAP = [
  // Chairs
  { keywords: ['wooden chair', 'wood chair', 'teak chair', 'oak chair'], url: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&q=80' },
  { keywords: ['dining chair', 'kitchen chair', 'side chair'], url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80' },
  { keywords: ['armchair', 'arm chair', 'accent chair', 'lounge chair'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['office chair', 'desk chair', 'ergonomic chair'], url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80' },
  { keywords: ['rocking chair'], url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80' },
  { keywords: ['bar stool', 'counter stool', 'stool'], url: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&q=80' },
  { keywords: ['chair'], url: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=400&q=80' },

  // Tables
  { keywords: ['dining table', 'kitchen table', 'dinner table'], url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80' },
  { keywords: ['coffee table', 'center table'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['side table', 'end table', 'nightstand'], url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=400&q=80' },
  { keywords: ['console table', 'hall table', 'entryway table'], url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80' },
  { keywords: ['desk', 'writing table', 'study table', 'work table'], url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80' },
  { keywords: ['table'], url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&q=80' },

  // Sofas / Couches
  { keywords: ['sofa', 'couch', 'settee', 'chesterfield'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['sectional', 'l-shaped sofa', 'corner sofa'], url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&q=80' },
  { keywords: ['loveseat', 'two seater', '2-seater'], url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80' },

  // Beds
  { keywords: ['bed frame', 'bed base', 'platform bed'], url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=80' },
  { keywords: ['king bed', 'queen bed', 'double bed', 'single bed'], url: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=400&q=80' },
  { keywords: ['bunk bed', 'loft bed'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['bed', 'headboard'], url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&q=80' },

  // Storage
  { keywords: ['bookshelf', 'bookcase', 'book shelf', 'library shelf'], url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { keywords: ['wardrobe', 'closet', 'armoire'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['cabinet', 'cupboard', 'sideboard', 'buffet'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['chest of drawers', 'dresser', 'chest', 'drawers'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['shelf', 'shelving', 'rack'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },

  // Outdoor / Misc
  { keywords: ['outdoor', 'garden', 'patio', 'balcony'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['ottoman', 'footstool', 'pouf'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['bench'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['mirror'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },

  // Materials (raw / components)
  { keywords: ['wood', 'plywood', 'mdf', 'particle board', 'timber', 'lumber', 'teak', 'oak', 'walnut', 'pine', 'mahogany'], url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&q=80' },
  { keywords: ['fabric', 'foam', 'upholstery', 'cushion', 'padding'], url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80' },
  { keywords: ['metal', 'steel', 'iron', 'aluminum', 'chrome', 'screw', 'bolt', 'hardware'], url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { keywords: ['glass'], url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
  { keywords: ['paint', 'varnish', 'stain', 'polish', 'lacquer', 'finish'], url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80' },
  { keywords: ['leather'], url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80' },
]

// Fallback images by category
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=400&q=80',
  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80',
  'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&q=80',
  'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=80',
]

/**
 * Get product image URL by matching name keywords
 * @param {string} name - Product name
 * @param {string|null} existingPhoto - Existing photo URL (takes priority)
 * @param {number} fallbackSeed - Index for fallback (e.g. product.id)
 * @returns {string} Image URL
 */
export function getProductImage(name = '', existingPhoto = null, fallbackSeed = 0) {
  if (existingPhoto) return existingPhoto
  const lower = name.toLowerCase()
  for (const entry of PRODUCT_IMAGE_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.url
    }
  }
  return FALLBACK_IMAGES[fallbackSeed % FALLBACK_IMAGES.length]
}

// Named product image overrides (for seeded demo data)
export const DEMO_PRODUCT_IMAGES = {
  'Wooden Chair':       'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&q=80',
  'Teak Dining Table':  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80',
  'Leather Sofa':       'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  'King Bed Frame':     'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&q=80',
  'Bookshelf':          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'Coffee Table':       'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&q=80',
  'Office Desk':        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&q=80',
  'Accent Chair':       'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
  'Dining Chair':       'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80',
  'Wardrobe':           'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
}
