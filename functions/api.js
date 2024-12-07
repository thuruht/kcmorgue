const INCIDENTS_CACHE_KEY = "incidents_cache"; // Cache key
const API_URL = "https://jsonplaceholder.typicode.com/posts"; // Placeholder API for testing
const CACHE_TTL = 3600; // Cache for 1 hour (3600 seconds)

export async function onRequest(context) {
  // Attempt to get cached data
  const cache = context.env.INCIDENTS; // Ensure you add this binding in the Cloudflare dashboard
  let cachedData = await cache.get(INCIDENTS_CACHE_KEY);

  if (cachedData) {
    return new Response(cachedData, { headers: { "Content-Type": "application/json" } });
  }

  // Fetch live data if not cached
  const response = await fetch(API_URL);
  const data = await response.json();

  // Cache the data
  await cache.put(INCIDENTS_CACHE_KEY, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
