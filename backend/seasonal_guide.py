import datetime
from typing import List, Dict, Any
from dataset_loader import get_dataset

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

def get_seasonal_produce(diet: str = "None") -> List[Dict[str, Any]]:
    """
    Returns a sample of seasonal produce based on the current season.
    Hardcodes some produce-to-season mappings and filters the dataset.
    """
    season = get_current_season()
    
    # Define some generic seasonal items found in our dataset
    seasonal_mappings = {
        "Winter": ["apples", "carrots", "kale", "onions", "sweet potatoes"],
        "Spring": ["spinach", "strawberries", "broccoli", "carrots"],
        "Summer": ["berries", "strawberries", "blueberries", "bell peppers", "tomatoes", "zucchini"],
        "Autumn": ["apples", "sweet potatoes", "kale", "broccoli"]
    }
    
    current_items = seasonal_mappings.get(season, [])
    
    df = get_dataset()
    if df.empty:
        return []
        
    # We want to match produce where normalized_name contains any of our seasonal items
    seasonal_products = []
    seen = set()
    
    for item in current_items:
        mask = df["normalized_name"].str.contains(item, na=False)
        matches = df[mask]
        
        # Take up to 3 unique products per seasonal category to avoid overwhelming the feed
        unique_matches = matches["product_name"].unique().tolist()
        
        from dietary_filters import is_diet_compliant
        for p in unique_matches[:3]:
            if p not in seen and is_diet_compliant(p, diet):
                seasonal_products.append({
                    "product_name": p,
                    "season": season,
                    "category_match": item
                })
                seen.add(p)
                
    return seasonal_products
