from typing import List, Dict, Any, Optional
from price_compare import get_price_comparison

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
        comparison = get_price_comparison(best_match)
        if not comparison:
            continue
            
        prices = comparison.get("prices", {})
        itemized_breakdown[product] = prices
        
        # Accumulate totals for stores that carry the item
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
