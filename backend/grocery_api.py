import urllib.request
import urllib.parse
import json
import random
import time
import hashlib
from typing import Optional

STORES = ['Walmart', 'Target', 'Safeway', 'Whole Foods', "Trader Joe's", 'King Soopers', 'Costco']

STORE_MODIFIERS = {
    'Walmart': 0.85,
    'Target': 1.00,
    'Safeway': 1.10,
    'Whole Foods': 1.38,
    "Trader Joe's": 0.90,
    'King Soopers': 1.02,
    'Costco': 0.88   # bulk savings — competitive but not always cheapest per item
}


def _store_jitter(product_name: str, store: str) -> float:
    """
    Return a deterministic jitter multiplier in [0.80, 1.20] seeded by the
    (product_name, store) pair. Wide enough that any store can win on a given
    product, yet stable — the same product always gets the same price.
    """
    key = f"{product_name.lower().strip()}|{store}"
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return 0.80 + (h % 10000) / 10000 * 0.40  # uniform in [0.80, 1.20]

# ── Simple TTL cache ───────────────────────────────────────────────────────────
_cache: dict[str, tuple[list, float]] = {}
CACHE_TTL_SECONDS = 300  # Cache results for 5 minutes


def _cache_get(key: str) -> Optional[list]:
    entry = _cache.get(key)
    if entry and (time.time() - entry[1]) < CACHE_TTL_SECONDS:
        print(f"[Cache HIT] '{key}'")
        return entry[0]
    return None


def _cache_set(key: str, value: list):
    _cache[key] = (value, time.time())


# ── Helpers ────────────────────────────────────────────────────────────────────

def clean_tag(tag: str) -> str:
    return tag.replace("en:", "").replace("-", " ").title()


def _extract_name(p: dict) -> str:
    """Try several fields Open Food Facts uses for product name."""
    for field in ("product_name", "product_name_en", "product_name_fr", "abbreviated_product_name", "generic_name"):
        val = p.get(field, "").strip()
        if val:
            return val
    return ""


# ── Main search ────────────────────────────────────────────────────────────────

def search_open_food_facts(query: str, limit: int = 20) -> list[dict]:
    """
    Query Open Food Facts v2 API for the given search term.
    Results are cached for CACHE_TTL_SECONDS to make repeat searches instant.
    """
    cache_key = f"{query.lower().strip()}:{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    # Fetch generously — many OFF products have blank names so we need extras
    fetch_size = max(limit * 6, 100)
    url = "https://world.openfoodfacts.org/api/v2/search"
    base_params = {
        "search_terms": query,
        "page_size": fetch_size,
        "lc": "en",      # prefer English product names
        "cc": "us",      # prefer US products
        "fields": (
            "code,product_name,product_name_en,abbreviated_product_name,generic_name,"
            "brands,image_url,categories_tags,labels_tags,nutriments,"
            "ingredients_analysis_tags,quantity,ecoscore_score"
        )
    }

    all_products: list[dict] = []

    # Fetch up to 2 pages so we have a rich pool to filter from
    for page in range(1, 3):
        params = urllib.parse.urlencode({**base_params, "page": page})
        req = urllib.request.Request(
            f"{url}?{params}",
            headers={"User-Agent": "BalanceBasketApp - Web - Version 1.0 (contact@balancebasket.com)"}
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                batch = data.get("products", [])
                all_products.extend(batch)
                # Stop early if the first page already gave us plenty of named results
                named = sum(1 for p in batch if _extract_name(p))
                if named >= limit * 2 or not batch:
                    break
        except Exception as e:
            print(f"[OFF API] Error page {page} for '{query}': {e}")
            break

    if all_products:
        results = _transform_and_expand_products(all_products, limit, query)
        _cache_set(cache_key, results)
        return results
    else:
        print(f"[OFF API] No results for '{query}' — using synthetic fallback")
        results = _make_synthetic_fallback(query)
        _cache_set(cache_key, results)
        return results


def _is_relevant(name: str, query: str) -> bool:
    """Return True if the product name contains at least one word from the query."""
    query_words = [w for w in query.lower().split() if len(w) > 2]  # skip tiny words like 'a', 'of'
    if not query_words:
        return True  # very short query — let everything through
    name_lower = name.lower()
    return any(word in name_lower for word in query_words)


# ── Synthetic fallback ─────────────────────────────────────────────────────────

def _make_synthetic_fallback(query: str) -> list[dict]:
    """Return a realistic synthetic product when the API is unavailable."""
    mock = {
        "product_name": query.title().strip(),
        "brands": "Generic",
        "image_url": "",
        "code": str(random.randint(100000000000, 999999999999)),
        "quantity": "1 lb",
        "categories_tags": ["en:fresh-vegetables"],
        "labels_tags": [],
        "nutriments": {
            "energy-kcal_100g": random.randint(20, 200),
            "proteins_100g": round(random.uniform(1, 10), 1),
            "carbohydrates_100g": round(random.uniform(5, 25), 1),
            "fat_100g": round(random.uniform(0, 15), 1),
            "sugars_100g": round(random.uniform(0, 10), 1),
            "fiber_100g": round(random.uniform(1, 5), 1),
            "sodium_100g": round(random.uniform(0, 0.5), 3)
        },
        "ingredients_analysis_tags": ["en:vegan", "en:vegetarian"]
    }
    return _transform_and_expand_products([mock], limit=1)


# ── Realistic pricing engine ───────────────────────────────────────────────────

# Each entry: (keywords_in_name, (min_price, max_price))
# Ordered from most-specific to most-general — first match wins.
_PRICE_RULES: list[tuple[tuple[str, ...], tuple[float, float]]] = [
    # Meat & seafood
    (("wagyu", "kobe"),                         (18.0, 35.0)),
    (("salmon", "tuna steak", "halibut"),        (8.0,  16.0)),
    (("shrimp", "scallop", "lobster"),           (10.0, 22.0)),
    (("ribeye", "filet", "sirloin"),             (10.0, 22.0)),
    (("chicken breast", "chicken thigh"),        (5.0,  10.0)),
    (("ground beef", "ground turkey"),           (5.0,  10.0)),
    (("chicken", "turkey", "pork", "beef", "lamb"), (4.0, 12.0)),
    (("tuna", "sardine", "anchovy"),             (2.0,   5.0)),
    # Dairy
    (("parmesan", "gruyere", "brie", "manchego"), (6.0, 14.0)),
    (("cheese",),                               (3.0,   8.0)),
    (("greek yogurt", "skyr"),                  (4.0,   7.0)),
    (("yogurt",),                               (2.5,   5.0)),
    (("butter",),                               (3.5,   7.0)),
    (("cream cheese",),                         (3.0,   5.0)),
    (("heavy cream", "whipping cream"),          (3.0,   5.5)),
    (("milk", "oat milk", "almond milk", "soy milk"), (3.0, 6.0)),
    (("eggs", "egg"),                            (3.0,   7.0)),
    (("ice cream", "gelato"),                    (4.0,   9.0)),
    # Produce
    (("avocado",),                              (1.0,   3.5)),
    (("berry", "berries", "blueberry", "strawberry", "raspberry"), (3.0, 6.0)),
    (("apple", "orange", "pear", "peach"),       (1.5,   4.0)),
    (("banana",),                               (0.99,  2.5)),
    (("spinach", "kale", "arugula", "lettuce"),  (2.5,   5.0)),
    (("tomato", "pepper", "zucchini", "broccoli"), (2.0,  4.5)),
    (("carrot", "celery", "onion", "potato"),    (1.5,   3.5)),
    (("mushroom",),                             (2.5,   5.5)),
    # Bakery / bread
    (("sourdough", "artisan"),                  (4.0,   8.0)),
    (("bread", "loaf", "baguette",  "bun", "roll", "bagel", "pita", "tortilla"), (2.5, 5.5)),
    (("muffin", "croissant", "pastry"),          (3.0,   7.0)),
    (("cake", "pie"),                           (5.0,  15.0)),
    # Pantry staples
    (("olive oil", "avocado oil"),              (7.0,  16.0)),
    (("coconut oil", "vegetable oil"),           (4.0,   9.0)),
    (("maple syrup", "honey"),                  (6.0,  14.0)),
    (("peanut butter", "almond butter"),        (4.0,   9.0)),
    (("pasta",),                               (1.5,   4.0)),
    (("rice",),                                (2.0,   6.0)),
    (("oats", "granola", "cereal"),             (3.0,   7.0)),
    (("flour",),                               (3.0,   6.0)),
    (("sugar",),                               (2.0,   5.0)),
    (("salt",),                                (1.0,   3.0)),
    (("coffee",),                              (8.0,  18.0)),
    (("tea",),                                 (4.0,  10.0)),
    (("juice",),                               (3.0,   7.0)),
    (("water",),                               (1.0,   4.0)),
    (("soda", "cola", "sparkling"),             (1.5,   5.0)),
    (("chips", "crackers", "pretzels"),         (3.0,   6.0)),
    (("chocolate", "candy"),                    (2.0,   7.0)),
    (("cookie", "biscuit"),                     (3.0,   6.0)),
    (("soup", "broth", "stock"),                (2.5,   5.0)),
    (("beans", "lentils", "chickpeas"),         (1.5,   4.0)),
    (("salsa", "hot sauce", "ketchup", "mustard"), (2.0, 5.0)),
    (("vinegar",),                             (2.0,   6.0)),
    (("nuts", "almonds", "walnuts", "cashews", "pistachios", "pecans"), (5.0, 12.0)),
    (("seeds", "chia", "flax", "hemp"),         (4.0,  10.0)),
    (("protein powder", "protein shake"),       (25.0, 60.0)),
    (("vitamin", "supplement"),                (8.0,  25.0)),
    # Frozen
    (("frozen pizza",),                        (5.0,  12.0)),
    (("frozen",),                              (3.0,   9.0)),
]

_FALLBACK_PRICE_RANGE = (2.0, 8.0)  # sensible default


def _estimate_base_price(name: str, is_organic: bool, upc: str) -> float:
    """Return a realistic base price using keyword matching on the product name."""
    name_lower = name.lower()

    lo, hi = _FALLBACK_PRICE_RANGE
    for keywords, price_range in _PRICE_RULES:
        if any(kw in name_lower for kw in keywords):
            lo, hi = price_range
            break

    # Organic items cost 25-35% more (deterministic, seeded by name)
    if is_organic:
        name_hash = int(hashlib.md5(name.encode()).hexdigest(), 16)
        premium = 1.25 + (name_hash % 1000) / 1000 * 0.10  # [1.25, 1.35]
        lo, hi = lo * premium, hi * premium

    # Use the UPC to seed a deterministic (but varied) position within the range
    seed_pos = (sum(ord(c) for c in upc) % 100) / 100.0  # 0.0 – 1.0
    return round(lo + seed_pos * (hi - lo), 2)


# ── Transform ──────────────────────────────────────────────────────────────────

def _transform_and_expand_products(api_products: list[dict], limit: int = 20, query: str = "") -> list[dict]:
    expanded_results = []
    seen_names: set[str] = set()

    for p in api_products:
        if len(seen_names) >= limit:
            break

        name = _extract_name(p)
        if not name:
            continue

        # Skip products that don't match the query at all
        if query and not _is_relevant(name, query):
            continue

        # Deduplicate by normalised name so we don't show duplicates
        norm_name = name.lower().strip()
        if norm_name in seen_names:
            continue
        seen_names.add(norm_name)

        brands = p.get("brands", "Generic") or "Generic"
        image_url = p.get("image_url", "")
        upc = p.get("code", "000000000000")
        size = p.get("quantity", "1 ea") or "1 ea"
        categories = p.get("categories_tags", []) or []
        labels = p.get("labels_tags", []) or []
        category = clean_tag(categories[0]) if categories else "General Grocery"

        nutriments = p.get("nutriments", {}) or {}
        calories = nutriments.get("energy-kcal_100g", 0) or 0
        protein = nutriments.get("proteins_100g", 0) or 0
        carbs = nutriments.get("carbohydrates_100g", 0) or 0
        fat = nutriments.get("fat_100g", 0) or 0
        sugar = nutriments.get("sugars_100g", 0) or 0
        fiber = nutriments.get("fiber_100g", 0) or 0
        sodium = (nutriments.get("sodium_100g", 0) or 0) * 1000

        analysis_tags = p.get("ingredients_analysis_tags", []) or []
        vegan = "en:vegan" in analysis_tags
        vegetarian = "en:vegetarian" in analysis_tags
        gluten_free = "en:gluten-free" in categories or "en:gluten-free" in analysis_tags
        dairy_free = "en:dairy-free" in categories or "en:dairy-free" in labels
        organic = "en:organic" in categories or "en:organic" in labels
        kosher = "en:kosher" in labels

        tags = []
        if vegan: tags.append("vegan")
        if vegetarian: tags.append("vegetarian")
        if gluten_free: tags.append("gluten_free")
        if dairy_free: tags.append("dairy_free")
        if organic: tags.append("organic")
        if kosher: tags.append("kosher")

        base_price = _estimate_base_price(name, organic, upc)

        for store in STORES:
            mod = STORE_MODIFIERS[store]
            jitter = _store_jitter(name, store)
            actual_price = round(base_price * mod * jitter, 2)

            # Sale is also deterministic: seeded by name+store so it doesn't flicker
            sale_seed = int(hashlib.md5(f"{name}|{store}|sale".encode()).hexdigest(), 16)
            on_sale = (sale_seed % 100) < 15  # ~15% chance
            sale_pct = 10 + (sale_seed % 21) if on_sale else None  # 10-30%
            sale_price = round(actual_price * (1 - sale_pct / 100.0), 2) if on_sale else None

            expanded_results.append({
                "product_id": random.randint(1000000, 9999999),
                "upc_12": upc,
                "product_name": name,
                "category": category,
                "brand": brands,
                "size": size,
                "store": store,
                "price_usd": actual_price,
                "on_sale": on_sale,
                "sale_price_usd": sale_price,
                "sale_discount_pct": sale_pct,
                "product_image_url": image_url,
                "analysis_neighborhood": "Boulder, CO",
                "calories": round(calories),
                "protein_g": round(protein, 1),
                "carbs_g": round(carbs, 1),
                "fat_g": round(fat, 1),
                "sugar_g": round(sugar, 1),
                "fiber_g": round(fiber, 1),
                "sodium_mg": round(sodium),
                "serving_size_g": 100,
                "vegan": vegan,
                "vegetarian": vegetarian,
                "gluten_free": gluten_free,
                "dairy_free": dairy_free,
                "organic": organic,
                "kosher": kosher,
                "dietary_tags": ";".join(tags),
                "normalized_name": norm_name
            })

    return expanded_results
