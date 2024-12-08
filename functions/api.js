const ACLED_CACHE_KEY = "acled_incidents_cache";
const KC_DATA_CACHE_KEY = "kc_crime_data_cache";
const CACHE_TTL = 3600; // Cache for 1 hour

// API URLs
const ACLED_API_URL = "https://api.acleddata.com/acled/read";
const KC_API_URLS = [
    "https://data.kcmo.org/resource/isbe-v4d8.json", // KCPD Crime Data 2024
    "https://data.kcmo.org/resource/6wc4-sd7p.json", // Kansas City Crime (NIBRS) Summary
    "https://data.kcmo.org/resource/egkn-fji8.json", // KCPD Crime Data 2019–2024
];

// Credentials
const ACLED_API_TOKEN = "leKBHbAkbmU26yCP0shv"; // Replace with your ACLED API key
const ACLED_EMAIL = "jojo@ntapkc.com"; // Replace with your ACLED registered email
const KC_APP_TOKEN = "your_kc_app_token"; // Replace with your Socrata app token

// Date calculation
const endDate = new Date().toISOString().split('T')[0];
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 3);
const startDateStr = startDate.toISOString().split('T')[0];

export async function onRequest(context) {
    const cache = context.env.INCIDENTS; // KV binding required
    const cachedAcledData = await cache.get(ACLED_CACHE_KEY);
    const cachedKCData = await cache.get(KC_DATA_CACHE_KEY);

    // Serve cached data if available
    if (cachedAcledData && cachedKCData) {
        return new Response(JSON.stringify({
            acled: JSON.parse(cachedAcledData),
            kc: JSON.parse(cachedKCData),
        }), { headers: { "Content-Type": "application/json" } });
    }

    // Fetch data
    const [acledData, kcData] = await Promise.all([
        fetchAcledData(),
        fetchKCData()
    ]);

    // Cache the fetched data
    await cache.put(ACLED_CACHE_KEY, JSON.stringify(acledData), { expirationTtl: CACHE_TTL });
    await cache.put(KC_DATA_CACHE_KEY, JSON.stringify(kcData), { expirationTtl: CACHE_TTL });

    // Return response
    return new Response(JSON.stringify({
        acled: acledData,
        kc: kcData,
    }), { headers: { "Content-Type": "application/json" } });
}

async function fetchAcledData() {
    const query = new URLSearchParams({
        key: ACLED_API_TOKEN,
        email: ACLED_EMAIL,
        event_date_start: startDateStr,
        event_date_end: endDate,
        country: "United States",
        admin1: "Missouri,Kansas",
        admin2: "Kansas City",
        limit: "1000", // Max limit
    });

    try {
        const response = await fetch(`${ACLED_API_URL}?${query.toString()}`);
        if (!response.ok) throw new Error(`ACLED API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching ACLED data:", error);
        return null;
    }
}

async function fetchKCData() {
    try {
        const kcData = await Promise.all(KC_API_URLS.map(async (url) => {
            const response = await fetch(`${url}?$limit=1000&$$app_token=${KC_APP_TOKEN}`);
            if (!response.ok) throw new Error(`KC API Error: ${response.statusText}`);
            const data = await response.json();
            // Process and clean the data
            return data.map(item => ({
                date: item.reported_date || item.date,
                offense: item.offense,
                description: item.description,
                latitude: item.latitude,
                longitude: item.longitude,
            }));
        }));
        return kcData.flat(); // Combine all datasets
    } catch (error) {
        console.error("Error fetching KC data:", error);
        return [];
    }
}

