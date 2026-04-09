import pandas as pd
from typing import List, Dict, Any
from dataset_loader import get_dataset

def search_products(query: str, limit: int = 10, diet: str = "None") -> List[str]:
    """
    Search for products matching the given query.
    Returns a list of unique matching product names.
    """
    df = get_dataset()
    if not query or df.empty:
        return []
        
    query_lower = query.lower().strip()
    
    # Tokenize query and remove basic plural 's' at the end of words > 3 chars
    terms = [t[:-1] if t.endswith('s') and len(t) > 3 else t for t in query_lower.split()]
    
    # Find matching products using substring match on the normalized name for all terms
    mask = pd.Series(True, index=df.index)
    for term in terms:
        mask = mask & df["normalized_name"].str.contains(term, na=False)
        
    matching_df = df[mask]
    
    if matching_df.empty:
        return []
        
    # Get unique product names that match
    unique_products = matching_df["product_name"].unique().tolist()
    
    # Filter by diet
    from dietary_filters import is_diet_compliant
    unique_products = [p for p in unique_products if is_diet_compliant(p, diet)]
    
    # Sort matching products by length to prioritize exact/shorter matches
    unique_products.sort(key=len)
    
    return unique_products[:limit]
