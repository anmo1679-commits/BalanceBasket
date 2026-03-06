import pandas as pd
from typing import List, Dict, Any
from dataset_loader import get_dataset

def search_products(query: str, limit: int = 10) -> List[str]:
    """
    Search for products matching the given query.
    Returns a list of unique matching product names.
    """
    df = get_dataset()
    if not query or df.empty:
        return []
        
    query_lower = query.lower().strip()
    
    # Find matching products using substring match on the normalized name
    mask = df["normalized_name"].str.contains(query_lower, na=False)
    matching_df = df[mask]
    
    if matching_df.empty:
        return []
        
    # Get unique product names that match
    unique_products = matching_df["product_name"].unique().tolist()
    
    # Sort matching products by length to prioritize exact/shorter matches
    unique_products.sort(key=len)
    
    return unique_products[:limit]
