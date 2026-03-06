from typing import List, Dict, Any, Optional
from price_compare import get_price_comparison

def optimize_list(product_names: List[str]) -> Dict[str, Any]:
    """
    Takes a list of product names and calculates the total cost at each store.
    Returns the cheapest overall store for the entire cart and the per-store totals.
    """
    store_totals = {}
    itemized_breakdown = {}
    
    for product in product_names:
        comparison = get_price_comparison(product)
        if not comparison:
            continue
            
        prices = comparison.get("prices", {})
        itemized_breakdown[product] = prices
        
        # Accumulate totals for stores that carry the item
        for store, price in prices.items():
            if store not in store_totals:
                store_totals[store] = 0.0
            store_totals[store] += price
            
    if not store_totals:
        return {
            "cheapest_store": None,
            "cheapest_total": 0.0,
            "store_totals": {},
            "itemized_breakdown": {}
        }
        
    # Find the store with the lowest total cart price
    cheapest_store = min(store_totals, key=store_totals.get)
    cheapest_total = store_totals[cheapest_store]
    
    return {
        "cheapest_store": cheapest_store,
        "cheapest_total": round(cheapest_total, 2),
        "store_totals": {store: round(total, 2) for store, total in store_totals.items()},
        "itemized_breakdown": itemized_breakdown
    }
