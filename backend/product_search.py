from typing import List, Dict, Any
from grocery_api import search_open_food_facts, _estimate_base_price, _store_jitter, STORES, STORE_MODIFIERS
from dietary_filters import filter_products_by_diet
from local_dataset import search_local_dataset
import hashlib


def _relevance_score(product_name: str, query: str) -> int:
    """
    Score how well a product name matches the query. Higher = more relevant.
    Scoring tiers:
      100  – exact phrase match (e.g. "ground beef" in "85% Lean Ground Beef")
       10  – every query word is present
        3  – each individual matching query word
        1  – first query word appears in first half of the name (position bonus)
    """
    name_lower = product_name.lower()
    query_lower = query.lower().strip()
    query_words = [w for w in query_lower.split() if len(w) > 1]

    if not query_words:
        return 0

    score = 0

    # Exact phrase anywhere in the name
    if query_lower in name_lower:
        score += 100

    # Count how many query words are present
    matched_words = [w for w in query_words if w in name_lower]
    score += len(matched_words) * 3

    # Bonus if ALL words match
    if len(matched_words) == len(query_words):
        score += 10

    # Position bonus: main keyword appears in the first half of the name
    if query_words:
        first_word = query_words[0]
        pos = name_lower.find(first_word)
        if pos != -1 and pos < len(name_lower) // 2:
            score += 1

    return score


def _expand_to_stores(products_raw: list[dict]) -> list[dict]:
    """Take a list of raw product dicts and expand each across all stores with synthetic prices."""
    expanded = []
    for p in products_raw:
        name = p["product_name"]
        upc = p.get("upc_12", str(sum(ord(c) for c in name)))
        organic = p.get("organic", False)
        base_price = _estimate_base_price(name, organic, upc)

        for store in STORES:
            mod = STORE_MODIFIERS[store]
            jitter = _store_jitter(name, store)
            actual_price = round(base_price * mod * jitter, 2)

            sale_seed = int(hashlib.md5(f"{name}|{store}|sale".encode()).hexdigest(), 16)
            on_sale = (sale_seed % 100) < 15
            sale_pct = 10 + (sale_seed % 21) if on_sale else None
            sale_price = round(actual_price * (1 - sale_pct / 100.0), 2) if on_sale else None

            expanded.append({
                **p,
                "store": store,
                "price_usd": actual_price,
                "on_sale": on_sale,
                "sale_price_usd": sale_price,
                "sale_discount_pct": sale_pct,
                "normalized_name": name.lower().strip(),
            })
    return expanded


def _group_into_price_results(products: list[dict]) -> list[dict]:
    """Group store-expanded products into PriceResult shape keyed by product name.
    Preserves dietary flags and nutritional metadata from the first product entry for each name.
    """
    groups: dict[str, dict] = {}
    meta: dict[str, dict] = {}  # name → metadata from first occurrence

    _DIET_FIELDS = ("vegan", "vegetarian", "gluten_free", "dairy_free", "organic", "kosher")
    _NUTRITION_FIELDS = ("calories", "protein_g", "carbs_g", "fat_g", "sugar_g", "fiber_g", "sodium_mg")
    _META_FIELDS = ("brand", "brands", "size", "category", "product_image_url")

    for p in products:
        name = p["product_name"]
        store = p["store"]
        sale_price = p.get("sale_price_usd")
        effective_price = float(sale_price if sale_price else p["price_usd"])

        if name not in groups:
            groups[name] = {}
            entry = {field: bool(p.get(field, False)) for field in _DIET_FIELDS}
            for field in _NUTRITION_FIELDS:
                entry[field] = p.get(field, 0) or 0
            for field in _META_FIELDS:
                entry[field] = p.get(field, "") or ""
            # Normalise brand: local dataset uses 'brands', API uses 'brand'
            if not entry["brand"] and entry["brands"]:
                entry["brand"] = entry["brands"]
            meta[name] = entry

        groups[name][store] = effective_price

    results = []
    for name, prices in groups.items():
        if not prices:
            continue
        cheapest_store = min(prices, key=prices.get)
        m = meta.get(name, {})
        results.append({
            "product_name": name,
            "prices": prices,
            "cheapest_option": cheapest_store,
            "cheapest_price": prices[cheapest_store],
            # Dietary flags
            "vegan": m.get("vegan", False),
            "vegetarian": m.get("vegetarian", False),
            "gluten_free": m.get("gluten_free", False),
            "dairy_free": m.get("dairy_free", False),
            "organic": m.get("organic", False),
            "kosher": m.get("kosher", False),
            # Nutritional facts (per 100g / per serving depending on source)
            "calories": m.get("calories", 0),
            "protein_g": m.get("protein_g", 0),
            "carbs_g": m.get("carbs_g", 0),
            "fat_g": m.get("fat_g", 0),
            "sugar_g": m.get("sugar_g", 0),
            "fiber_g": m.get("fiber_g", 0),
            "sodium_mg": m.get("sodium_mg", 0),
            # Product metadata
            "brand": m.get("brand") or m.get("brands", ""),
            "size": m.get("size", ""),
            "category": m.get("category", ""),
            "image_url": m.get("product_image_url", ""),
        })

    return results


def search_products(query: str, diet: str = "None", limit: int = 15) -> List[Dict[str, Any]]:
    """
    Search for products. Tries the Open Food Facts API first.
    Falls back to the local dataset if the API is unavailable or returns too few results.
    Results are sorted by relevance to the query (closest match first).
    """
    if not query:
        return []

    # ── 1. Try live API ────────────────────────────────────────────────────────
    api_products = search_open_food_facts(query, limit)
    filtered_api = filter_products_by_diet(api_products, diet)
    api_results = _group_into_price_results(filtered_api)

    if len(api_results) >= 3:
        return _sort_by_relevance(api_results, query)

    # ── 2. Supplement / fallback with local dataset ────────────────────────────
    local_raw = search_local_dataset(query, limit=limit, diet=diet)
    local_expanded = _expand_to_stores(local_raw)
    local_results = _group_into_price_results(local_expanded)

    if not api_results:
        return _sort_by_relevance(local_results, query)

    # Merge: local fills in what the API didn't return, avoiding name duplicates
    existing_names = {r["product_name"].lower() for r in api_results}
    for r in local_results:
        if r["product_name"].lower() not in existing_names:
            api_results.append(r)
            existing_names.add(r["product_name"].lower())

    return _sort_by_relevance(api_results[:limit], query)


def _sort_by_relevance(results: list[dict], query: str) -> list[dict]:
    """Sort a list of PriceResult dicts by relevance score, highest first."""
    return sorted(results, key=lambda r: _relevance_score(r["product_name"], query), reverse=True)
