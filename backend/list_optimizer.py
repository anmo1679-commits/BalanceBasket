from typing import List, Dict, Any, Optional

def optimize_list(product_names: List[str]) -> Dict[str, Any]:
    """
    Takes a list of product names and calculates the total cost at each store.
    Returns the cheapest overall store for the entire cart and the per-store totals.
    """
    store_totals = {}
    store_item_counts = {}
    itemized_breakdown = {}
    
    from product_search import search_products
    
    for product in product_names:
        matches = search_products(product, limit=1)
        if not matches:
            continue

        best_match = matches[0]
        prices = best_match.get("prices", {})
        cheapest_store_for_item = min(prices, key=prices.get) if prices else None
        cheapest_price_for_item = prices[cheapest_store_for_item] if cheapest_store_for_item else 0.0

        itemized_breakdown[product] = {
            "cheapest_store": cheapest_store_for_item,
            "cheapest_price": round(cheapest_price_for_item, 2),
            "prices": {s: round(p, 2) for s, p in prices.items()},
        }

        for store, price in prices.items():
            if store not in store_totals:
                store_totals[store] = 0.0
                store_item_counts[store] = 0
            store_totals[store] += price
            store_item_counts[store] += 1
            
    if not store_totals:
        return {
            "cheapest_store": None,
            "cheapest_total": 0.0,
            "store_totals": {},
            "store_item_counts": {},
            "itemized_breakdown": {}
        }
        
    # Find the store with the most items available, then the lowest total price
    max_items = max(store_item_counts.values())
    eligible_stores = [s for s, count in store_item_counts.items() if count == max_items]
    
    cheapest_store = min(eligible_stores, key=store_totals.get)
    cheapest_total = store_totals[cheapest_store]
    
    return {
        "cheapest_store": cheapest_store,
        "cheapest_total": round(cheapest_total, 2),
        "total_items_found": max_items,
        "store_totals": {store: round(total, 2) for store, total in store_totals.items()},
        "store_item_counts": store_item_counts,
        "itemized_breakdown": itemized_breakdown
    }
