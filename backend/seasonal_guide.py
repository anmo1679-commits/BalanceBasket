"""
Seasonal produce guide — curated local dataset.
Provides rich, always-available seasonal produce data without relying on the OFF API.
"""
from typing import List, Dict, Any
import datetime
from dietary_filters import filter_products_by_diet


def get_current_season() -> str:
    """Returns the current season based on the month (Northern Hemisphere)."""
    month = datetime.datetime.now().month
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    else:
        return "Autumn"


# Curated seasonal produce per season — 10 items each.
# All items are vegan/vegetarian/gluten-free/dairy-free produce.
_SEASONAL_PRODUCE: dict[str, list[dict]] = {
    "Spring": [
        {"product_name": "Fresh Strawberries",       "category": "Produce", "size": "1 lb",        "calories": 49,  "protein_g": 1.0, "carbs_g": 11.7, "fat_g": 0.5, "fiber_g": 3.0, "fun_fact": "Peak season March–May. Rich in vitamin C and antioxidants."},
        {"product_name": "Baby Spinach",              "category": "Produce", "size": "5 oz bag",    "calories": 23,  "protein_g": 2.9, "carbs_g": 3.6,  "fat_g": 0.4, "fiber_g": 2.2, "fun_fact": "Harvested in cooler spring temps — sweetest and most tender now."},
        {"product_name": "Fresh Broccoli",            "category": "Produce", "size": "1 head",      "calories": 55,  "protein_g": 3.7, "carbs_g": 11.2, "fat_g": 0.6, "fiber_g": 5.1, "fun_fact": "Broccoli thrives in cool spring weather — look for tight, dark green florets."},
        {"product_name": "Asparagus Bunch",           "category": "Produce", "size": "1 lb",        "calories": 27,  "protein_g": 2.9, "carbs_g": 5.2,  "fat_g": 0.2, "fiber_g": 2.8, "fun_fact": "Spring's signature vegetable. Only available fresh for a short window!"},
        {"product_name": "Sugar Snap Peas",           "category": "Produce", "size": "8 oz",        "calories": 41,  "protein_g": 2.8, "carbs_g": 7.5,  "fat_g": 0.2, "fiber_g": 2.6, "fun_fact": "Eat the whole pod! Best eaten fresh — peak flavor in spring months."},
        {"product_name": "Radishes",                  "category": "Produce", "size": "1 bunch",     "calories": 16,  "protein_g": 0.7, "carbs_g": 3.4,  "fat_g": 0.1, "fiber_g": 1.6, "fun_fact": "One of the fastest growing vegetables — planted and harvested within spring."},
        {"product_name": "Green Onions",              "category": "Produce", "size": "1 bunch",     "calories": 32,  "protein_g": 1.8, "carbs_g": 7.3,  "fat_g": 0.2, "fiber_g": 2.6, "fun_fact": "Among the easiest spring crops — regrowing from scraps in a glass of water!"},
        {"product_name": "Fresh Mint",                "category": "Herbs",   "size": "1 oz",        "calories": 6,   "protein_g": 0.3, "carbs_g": 1.1,  "fat_g": 0.1, "fiber_g": 0.8, "fun_fact": "Mint grows explosively in spring — it's best kept in a pot to control spreading."},
        {"product_name": "Artichokes",                "category": "Produce", "size": "2 ct",        "calories": 60,  "protein_g": 4.2, "carbs_g": 13.5, "fat_g": 0.2, "fiber_g": 6.9, "fun_fact": "Artichokes are actually flower buds — peak season is March through May."},
        {"product_name": "Watercress",                "category": "Produce", "size": "4 oz",        "calories": 11,  "protein_g": 2.3, "carbs_g": 1.3,  "fat_g": 0.1, "fiber_g": 0.5, "fun_fact": "Ounce for ounce, watercress has more calcium than milk. A perfect spring green."},
    ],
    "Summer": [
        {"product_name": "Fresh Blueberries",         "category": "Produce", "size": "1 pint",      "calories": 84,  "protein_g": 1.1, "carbs_g": 21.5, "fat_g": 0.5, "fiber_g": 3.6, "fun_fact": "Peak July–August. One of the highest antioxidant fruits available."},
        {"product_name": "Bell Peppers (Mixed)",      "category": "Produce", "size": "3-pack",      "calories": 31,  "protein_g": 1.0, "carbs_g": 7.6,  "fat_g": 0.3, "fiber_g": 2.5, "fun_fact": "Red peppers have 3× the vitamin C of oranges! Summer is peak season."},
        {"product_name": "Zucchini",                  "category": "Produce", "size": "1 lb",        "calories": 17,  "protein_g": 1.2, "carbs_g": 3.1,  "fat_g": 0.3, "fiber_g": 1.0, "fun_fact": "Summer squash grows so fast they pick it every other day on farms."},
        {"product_name": "Sweet Corn",                "category": "Produce", "size": "4 ears",      "calories": 86,  "protein_g": 3.2, "carbs_g": 19.0, "fat_g": 1.2, "fiber_g": 2.7, "fun_fact": "Freshest within 24 hours of harvest — sugars convert to starch quickly."},
        {"product_name": "Beefsteak Tomatoes",        "category": "Produce", "size": "1 lb",        "calories": 18,  "protein_g": 0.9, "carbs_g": 3.9,  "fat_g": 0.2, "fiber_g": 1.2, "fun_fact": "Nothing beats a summer tomato! Out-of-season ones are gas ripened."},
        {"product_name": "Fresh Peaches",             "category": "Produce", "size": "1 lb",        "calories": 39,  "protein_g": 0.9, "carbs_g": 9.5,  "fat_g": 0.3, "fiber_g": 1.5, "fun_fact": "Peak June–August. A ripe peach should smell like a peach from 3 feet away."},
        {"product_name": "Fresh Basil",               "category": "Herbs",   "size": "2 oz",        "calories": 6,   "protein_g": 0.8, "carbs_g": 0.6,  "fat_g": 0.2, "fiber_g": 0.4, "fun_fact": "Basil is a tropical plant — it thrives in summer heat and dies at first frost."},
        {"product_name": "Fresh Raspberries",         "category": "Produce", "size": "6 oz",        "calories": 52,  "protein_g": 1.2, "carbs_g": 11.9, "fat_g": 0.7, "fiber_g": 6.5, "fun_fact": "Raspberries have the highest fiber content of any common berry."},
        {"product_name": "Cucumber",                  "category": "Produce", "size": "1 ea",        "calories": 16,  "protein_g": 0.7, "carbs_g": 3.6,  "fat_g": 0.1, "fiber_g": 0.5, "fun_fact": "Cucumbers are 96% water — great for hydration on hot summer days."},
        {"product_name": "Watermelon",                "category": "Produce", "size": "~8 lb",       "calories": 30,  "protein_g": 0.6, "carbs_g": 7.6,  "fat_g": 0.2, "fiber_g": 0.4, "fun_fact": "Peak July–August. Tap a ripe watermelon and you'll hear a hollow thud."},
    ],
    "Autumn": [
        {"product_name": "Honeycrisp Apples",         "category": "Produce", "size": "3 lb bag",    "calories": 72,  "protein_g": 0.4, "carbs_g": 19.1, "fat_g": 0.2, "fiber_g": 3.3, "fun_fact": "Honeycrisp was developed at the University of Minnesota. Harvested Sept–Oct."},
        {"product_name": "Butternut Squash",          "category": "Produce", "size": "~2 lb",       "calories": 45,  "protein_g": 1.0, "carbs_g": 11.7, "fat_g": 0.1, "fiber_g": 2.0, "fun_fact": "A fall staple — winter squash stores well for several months after harvest."},
        {"product_name": "Curly Kale",                "category": "Produce", "size": "1 bunch",     "calories": 49,  "protein_g": 4.3, "carbs_g": 8.8,  "fat_g": 0.9, "fiber_g": 3.6, "fun_fact": "Kale gets sweeter after frost — autumn is prime season."},
        {"product_name": "Sweet Potatoes",            "category": "Produce", "size": "3 lb bag",    "calories": 86,  "protein_g": 1.6, "carbs_g": 20.1, "fat_g": 0.1, "fiber_g": 3.0, "fun_fact": "Harvested in fall, sweet potatoes cure for 2 weeks to develop their sweetness."},
        {"product_name": "Fuji Pears",                "category": "Produce", "size": "3 lb bag",    "calories": 57,  "protein_g": 0.4, "carbs_g": 15.2, "fat_g": 0.1, "fiber_g": 3.1, "fun_fact": "Unlike most fruits, pears ripen best off the tree. September–November peak."},
        {"product_name": "Brussels Sprouts",          "category": "Produce", "size": "1 lb",        "calories": 43,  "protein_g": 3.4, "carbs_g": 8.9,  "fat_g": 0.3, "fiber_g": 3.8, "fun_fact": "Like kale, a frost actually improves the flavor of Brussels sprouts."},
        {"product_name": "Sugar Pie Pumpkin",         "category": "Produce", "size": "~3 lb",       "calories": 26,  "protein_g": 1.0, "carbs_g": 6.5,  "fat_g": 0.1, "fiber_g": 0.5, "fun_fact": "Sugar pie pumpkins are smaller and sweeter than carving pumpkins — great for cooking."},
        {"product_name": "Concord Grapes",            "category": "Produce", "size": "2 lb bag",    "calories": 62,  "protein_g": 0.6, "carbs_g": 16.1, "fat_g": 0.3, "fiber_g": 0.9, "fun_fact": "Native to North America, Concord grapes only ripen in fall — September through October."},
        {"product_name": "Turnips",                   "category": "Produce", "size": "1 lb",        "calories": 28,  "protein_g": 0.9, "carbs_g": 6.4,  "fat_g": 0.1, "fiber_g": 1.8, "fun_fact": "Turnips are frost-hardy — cold weather makes them sweeter and more flavorful."},
        {"product_name": "Fresh Cranberries",         "category": "Produce", "size": "12 oz bag",   "calories": 46,  "protein_g": 0.4, "carbs_g": 12.2, "fat_g": 0.1, "fiber_g": 4.6, "fun_fact": "Cranberries only grow in North America and are harvested by flooding bogs in fall."},
    ],
    "Winter": [
        {"product_name": "Navel Oranges",             "category": "Produce", "size": "4 lb bag",    "calories": 62,  "protein_g": 1.2, "carbs_g": 15.4, "fat_g": 0.2, "fiber_g": 3.1, "fun_fact": "Navel oranges peak November–January — grown primarily in California."},
        {"product_name": "Baby Carrots",              "category": "Produce", "size": "1 lb bag",    "calories": 35,  "protein_g": 0.6, "carbs_g": 8.2,  "fat_g": 0.1, "fiber_g": 2.8, "fun_fact": "Carrots are sweeter in cold weather — cold converts starch to sugar as frost protection."},
        {"product_name": "Clementines",               "category": "Produce", "size": "5 lb bag",    "calories": 47,  "protein_g": 0.9, "carbs_g": 12.0, "fat_g": 0.2, "fiber_g": 1.7, "fun_fact": "A.k.a. 'Cuties' — November through January is peak season."},
        {"product_name": "Delicata Squash",           "category": "Produce", "size": "1 ea",        "calories": 40,  "protein_g": 1.0, "carbs_g": 10.0, "fat_g": 0.0, "fiber_g": 1.5, "fun_fact": "The edible skin saves prep time — no peeling needed! A true winter staple."},
        {"product_name": "Pomelo",                    "category": "Produce", "size": "1 ea",        "calories": 72,  "protein_g": 1.4, "carbs_g": 18.3, "fat_g": 0.1, "fiber_g": 2.0, "fun_fact": "The largest citrus fruit — ancestor of the grapefruit. Peak December–February."},
        {"product_name": "Parsnips",                  "category": "Produce", "size": "1 lb",        "calories": 75,  "protein_g": 1.2, "carbs_g": 18.0, "fat_g": 0.3, "fiber_g": 4.9, "fun_fact": "Like carrots, parsnips get sweeter after frost. Great roasted."},
        {"product_name": "Leeks",                     "category": "Produce", "size": "1 bunch",     "calories": 61,  "protein_g": 1.5, "carbs_g": 14.2, "fat_g": 0.3, "fiber_g": 1.8, "fun_fact": "Leeks are milder than onions — the national symbol of Wales and a winter staple."},
        {"product_name": "Blood Oranges",             "category": "Produce", "size": "2 lb bag",    "calories": 50,  "protein_g": 1.1, "carbs_g": 11.8, "fat_g": 0.1, "fiber_g": 2.5, "fun_fact": "Blood oranges get their deep red color from cold winter nights — peak January–March."},
        {"product_name": "Fennel Bulb",               "category": "Produce", "size": "1 ea",        "calories": 31,  "protein_g": 1.2, "carbs_g": 7.3,  "fat_g": 0.2, "fiber_g": 3.1, "fun_fact": "Fennel's mild anise flavor is at its peak in fall and winter months."},
        {"product_name": "Red Beets",                 "category": "Produce", "size": "1 bunch",     "calories": 43,  "protein_g": 1.6, "carbs_g": 9.6,  "fat_g": 0.2, "fiber_g": 2.8, "fun_fact": "Beets can be stored in a root cellar for months — a true winter storage vegetable."},
    ],
}

# All produce items are fully plant-based, gluten-free, dairy-free
_BASE_FLAGS = {
    "vegan": True, "vegetarian": True, "gluten_free": True,
    "dairy_free": True, "organic": False, "kosher": True,
}


def get_seasonal_produce(diet: str = "None") -> List[Dict[str, Any]]:
    """
    Returns curated seasonal produce for the current season.
    Always fast — uses local data, no API calls.
    Applies dietary filter and attaches price comparison via the pricing engine.
    """
    from grocery_api import _estimate_base_price, _store_jitter, STORES, STORE_MODIFIERS

    season = get_current_season()
    raw = _SEASONAL_PRODUCE.get(season, [])

    # Attach base flags so filter_products_by_diet works
    produce = [{**_BASE_FLAGS, **item} for item in raw]
    filtered = filter_products_by_diet(produce, diet)

    results = []
    for item in filtered:
        name = item["product_name"]
        upc = str(sum(ord(c) for c in name))
        base_price = _estimate_base_price(name, False, upc)

        store_prices: dict[str, float] = {}
        for store in STORES:
            mod = STORE_MODIFIERS[store]
            jitter = _store_jitter(name, store)
            produce_discount = 0.85  # fresh produce typically cheaper than packaged
            price = round(base_price * mod * jitter * produce_discount, 2)
            store_prices[store] = price

        cheapest_store = min(store_prices, key=store_prices.get)  # type: ignore[arg-type]
        cheapest_price = store_prices[cheapest_store]

        results.append({
            "product_name": name,
            "season": season,
            "category": item.get("category", "Produce"),
            "size": item.get("size", ""),
            "fun_fact": item.get("fun_fact", ""),
            "vegan": True,
            "vegetarian": True,
            "gluten_free": True,
            "dairy_free": True,
            "organic": False,
            "calories": item.get("calories", 0),
            "protein_g": item.get("protein_g", 0),
            "carbs_g": item.get("carbs_g", 0),
            "fat_g": item.get("fat_g", 0),
            "fiber_g": item.get("fiber_g", 0),
            "prices": store_prices,
            "cheapest_store": cheapest_store,
            "cheapest_price": cheapest_price,
        })

    return results
