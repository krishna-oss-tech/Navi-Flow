import logging
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger("naviflow.geocoding")

# Rich Nagpur Landmark & Junction Dictionary for instantaneous sub-millisecond search
NAGPUR_PLACES: List[Dict[str, Any]] = [
    {
        "id": "place_sitabuldi",
        "name": "Sitabuldi Interchange",
        "area": "Variety Square, Civil Lines / Central Nagpur",
        "category": "Junction / Transit Hub",
        "lat": 21.1468,
        "lon": 79.0832,
    },
    {
        "id": "place_zero_mile",
        "name": "Zero Mile Stone",
        "area": "Wardha Road / Civil Lines, Nagpur",
        "category": "Historical Landmark",
        "lat": 21.1488,
        "lon": 79.0845,
    },
    {
        "id": "place_rahate_colony",
        "name": "Rahate Colony T-Point",
        "area": "Wardha Road, South Nagpur",
        "category": "Junction / Flyover Approach",
        "lat": 21.1278,
        "lon": 79.0754,
    },
    {
        "id": "place_medical_sq",
        "name": "Medical Square",
        "area": "Government Medical College / Ajni Road",
        "category": "Junction / Hospital Zone",
        "lat": 21.1344,
        "lon": 79.0968,
    },
    {
        "id": "place_agrasen_sq",
        "name": "Agrasen Square",
        "area": "Central Avenue, Gandhibagh / Itwari",
        "category": "Commercial Corridor",
        "lat": 21.1532,
        "lon": 79.1055,
    },
    {
        "id": "place_sadar",
        "name": "Sadar Residency Road",
        "area": "Katol Naka / Sadar Bazar, North Nagpur",
        "category": "Commercial / Residential",
        "lat": 21.162,
        "lon": 79.082,
    },
    {
        "id": "place_dharampeth",
        "name": "Dharampeth Coffee House Square",
        "area": "West High Court Road, Dharampeth",
        "category": "Commercial Corridor",
        "lat": 21.142,
        "lon": 79.062,
    },
    {
        "id": "place_cotton_mkt",
        "name": "Cotton Market Square",
        "area": "Nagpur Railway Station South Gate / Ghat Road",
        "category": "Market & Transit Hub",
        "lat": 21.143,
        "lon": 79.092,
    },
    {
        "id": "place_nagpur_station",
        "name": "Nagpur Central Railway Station",
        "area": "Station Road, Sitabuldi",
        "category": "Railway Terminal",
        "lat": 21.1524,
        "lon": 79.0889,
    },
    {
        "id": "place_airport",
        "name": "Dr. Babasaheb Ambedkar International Airport",
        "area": "Sonegaon / Wardha Road, South Nagpur",
        "category": "Airport Terminal",
        "lat": 21.0922,
        "lon": 79.0472,
    },
    {
        "id": "place_vnit",
        "name": "VNIT Campus (Visvesvaraya National Institute of Tech)",
        "area": "South Ambazari Road, Bajaj Nagar",
        "category": "Educational Campus",
        "lat": 21.1235,
        "lon": 79.0515,
    },
    {
        "id": "place_futala",
        "name": "Futala Lake Promenade",
        "area": "Telankhedi / Vayu Sena Nagar, West Nagpur",
        "category": "Recreational Waterfront",
        "lat": 21.1542,
        "lon": 79.0438,
    },
    {
        "id": "place_empress_mall",
        "name": "Empress City Mall & Complex",
        "area": "Near Gandhi Sagar Lake, Subhash Road",
        "category": "Commercial Complex",
        "lat": 21.1462,
        "lon": 79.0975,
    },
    {
        "id": "place_ramdaspeth",
        "name": "Ramdaspeth Central",
        "area": "Central Bazar Road, Ramdaspeth",
        "category": "Commercial & Healthcare",
        "lat": 21.1378,
        "lon": 79.0732,
    },
    {
        "id": "place_shankar_nagar",
        "name": "Shankar Nagar Square",
        "area": "West High Court Road / North Ambazari Road",
        "category": "Major Junction",
        "lat": 21.1352,
        "lon": 79.0612,
    },
    {
        "id": "place_manewada",
        "name": "Manewada Ring Road Square",
        "area": "Outer Ring Road, South-East Nagpur",
        "category": "Ring Road Junction",
        "lat": 21.1085,
        "lon": 79.0995,
    },
    {
        "id": "place_khamla",
        "name": "Khamla Square",
        "area": "Khamla Road, South-West Nagpur",
        "category": "Residential Junction",
        "lat": 21.1165,
        "lon": 79.0635,
    },
    {
        "id": "place_itwari",
        "name": "Itwari Market Wholesale Hub",
        "area": "Itwari, East Nagpur",
        "category": "Commercial Market",
        "lat": 21.1555,
        "lon": 79.1125,
    },
]

class GeocodingProvider:
    """
    Geocoding & Location Search Adapter for Nagpur Traffic Intelligence.
    Combines high-precision local landmark indexing with external OSM fallback.
    """

    def __init__(self):
        self.places = NAGPUR_PLACES

    async def search(self, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        q = query.strip().lower()
        if not q:
            return self.places[:limit]

        # 1. First search internal Nagpur curated landmark database
        matches = []
        for p in self.places:
            score = 0
            p_name = p["name"].lower()
            p_area = p["area"].lower()
            p_cat = p["category"].lower()

            if q in p_name:
                score += 10
            if q in p_area:
                score += 5
            if any(token in p_name for token in q.split()):
                score += 3
            if any(token in p_area for token in q.split()):
                score += 2
            if q in p_cat:
                score += 1

            if score > 0:
                matches.append((score, p))

        matches.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in matches[:limit]]

        if results:
            return results

        # 2. Try external OSM Nominatim with bounded Nagpur viewbox if available
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&viewbox=78.95,21.25,79.25,21.05&bounded=1&limit={limit}"
            headers = {"User-Agent": "NaviFlow-Nagpur-ITMS/1.0"}
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        results.append({
                            "id": f"osm_{item.get('place_id', '')}",
                            "name": item.get("display_name", "").split(",")[0],
                            "area": ", ".join(item.get("display_name", "").split(",")[1:3]).strip(),
                            "category": item.get("type", "Location").replace("_", " ").title(),
                            "lat": float(item["lat"]),
                            "lon": float(item["lon"]),
                        })
        except Exception as e:
            logger.info(f"External Nominatim fallback skipped: {e}")

        # If still empty, return top landmarks
        return results if results else self.places[:limit]

geocoding_provider = GeocodingProvider()
