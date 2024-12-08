const INCIDENTS_CACHE_KEY = "incidents_cache";
const API_URL = "https://api.acleddata.com/acled/read";
const API_TOKEN = "leKBHbAkbmU26yCP0shv"; // Replace with actual API key
const EMAIL = "n00jo@ntapkc.com"; // Replace with your registered email
const CACHE_TTL = 3600; // Cache for 1 hour

export async function onRequest(context) {
  const cache = context.env.INCIDENTS;
  const cachedData = await cache.get(INCIDENTS_CACHE_KEY);

  // Serve from cache if available
  if (cachedData) {
    return new Response(cachedData, { headers: { "Content-Type": "application/json" } });
  }

  // Calculate date range (last 3 years to today)
  const endDate = new Date().toISOString().split('T')[0]; // Today's date
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3); // 3 years ago
  const startDateStr = startDate.toISOString().split('T')[0];

  // Start with minimal query and adjust filters incrementally
  const query = new URLSearchParams({
    key: API_TOKEN,
    email: EMAIL,
    event_date_start: startDateStr,
    event_date_end: endDate,
    country: "United States",
    admin1: "Missouri,Kansas", // Optional: Add admin1 filter
    // admin2: "Kansas City", // Uncomment to test admin2
    // event_type: "Protests,Violence against civilians", // Uncomment to test event type
    // interaction: "1,2,3,4,5,6,7,8", // Uncomment to test interactions
    limit: "100"
  });

  // Fetch data from ACLED API
  const response = await fetch(`${API_URL}?${query.toString()}`);
  
  if (!response.ok) {
    return new Response(`Error fetching data from ACLED: ${response.statusText}`, { status: response.status });
  }

  const data = await response.json();

  // Cache data for future use
  await cache.put(INCIDENTS_CACHE_KEY, JSON.stringify(data), { expirationTtl: CACHE_TTL });

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
