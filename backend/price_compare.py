import pandas as pd
from typing import Dict, Any, Optional
from dataset_loader import get_dataset
from product_search import search_products

def get_price_comparison(product_name: str) -> Optional[Dict[str, Any]]:
    """
    Get the price comparison for a specific product name across different stores.
    Returns a dictionary with prices per store and the cheapest option.
    """
    df = get_dataset()
    if df.empty or not product_name:
        return None
        
    # We want an exact match on the normalized product name to get its prices
    normalized_query = product_name.lower().strip()
    mask = df["normalized_name"] == normalized_query
    product_df = df[mask]
    
    if product_df.empty:
        return None
        
    prices = {}
    cheapest_store = None
    cheapest_price = float('inf')
    
    # Iterate through each store's offering for this exact product
    for _, row in product_df.iterrows():
        store = row.get("store")
        price = row.get("effective_price")
        
        # Determine actual price taking into account sales
        if pd.isna(price):
            continue
            
        prices[store] = float(price)
        
        if price < cheapest_price:
            cheapest_price = price
            cheapest_store = store
            
    if not prices:
       return None
       
    return {
        "product_name": product_df.iloc[0]["product_name"],
        "prices": prices,
        "cheapest_option": cheapest_store,
        "cheapest_price": cheapest_price
    }
