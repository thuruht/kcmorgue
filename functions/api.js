const INCIDENTS_CACHE_KEY = "incidents_cache";
const API_URL = "https://api.acleddata.com/acled/read";
const API_TOKEN = "leKBHbAkbmU26yCP0shv"; // Replace with your actual API key
const EMAIL = "jojo@ntapkc.com"; // Replace with your registered email
const CACHE_TTL = 3600; // Cache for 1 hour

export async function onRequest(context) {
  const cache = context.env.INCIDENTS;
  const cachedData = await cache.get(INCIDENTS_CACHE_KEY);

  // Serve from cache if available
  if (cachedData) {
    return new Response(cachedData, { headers: { "Content-Type": "application/json" } });
  }

  // Calculate date range (last x years to today)
  const endDate = new Date().toISOString().split('T')[0]; // Today's date
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 10); // 10 years ago
  const startDateStr = startDate.toISOString().split('T')[0];

  // Construct API Query with correct parameters
  const query = new URLSearchParams({
    key: API_TOKEN,
    email: EMAIL,
    event_date_start: startDateStr,
    event_date_end: endDate,
    country: "United States",
    admin1: "Missouri,Kansas",
    admin2: "Kansas City",
    event_type: "Protests,Violence against civilians",
    interaction: "1,2,3,4,5,6,7,8",
    limit: "500"
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
