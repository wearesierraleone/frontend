/**
 * Fallback data for when JSON files can't be loaded
 * This provides a minimal set of data to ensure the site works even if loading fails
 */

const FALLBACK_POSTS = [
  {
    "id": "fallback1",
    "title": "Improving School Infrastructure in Freetown",
    "body": "Many schools in Freetown need urgent repairs and upgrades. Children are studying in classrooms with leaking roofs during the rainy season. We need a coordinated effort to improve educational infrastructure.",
    "category": "education",
    "timestamp": "2025-05-10T09:30:00Z",
    "status": "approved"
  },
  {
    "id": "fallback2",
    "title": "Healthcare Access in Rural Communities",
    "body": "Access to healthcare remains a serious challenge in rural Sierra Leone. Some villages require residents to travel more than 20km to reach the nearest clinic. Mobile healthcare units could help address this gap.",
    "category": "health",
    "timestamp": "2025-05-08T14:15:00Z",
    "status": "approved"
  },
  {
    "id": "fallback3",
    "title": "Youth Unemployment Solutions",
    "body": "Youth unemployment remains one of our biggest challenges. We need vocational training centers in every district that focus on practical skills that match market demands.",
    "category": "youth",
    "timestamp": "2025-05-06T11:20:00Z",
    "status": "approved"
  }
];

/**
 * Get fallback posts data
 * @returns {Array} Fallback posts array
 */
function getFallbackPosts() {
  return FALLBACK_POSTS;
}

/**
 * Load fallback data when needed 
 * @param {string} dataType - The type of data to load ('posts', 'votes', 'comments', 'petitions')
 * @returns {any} - The appropriate fallback data
 */
function getFallbackData(dataType) {
  switch(dataType) {
    case 'posts':
      return FALLBACK_POSTS;
    case 'votes':
      return {};
    case 'comments':
      return {};
    case 'petitions':
      return {};
    default:
      return null;
  }
}
