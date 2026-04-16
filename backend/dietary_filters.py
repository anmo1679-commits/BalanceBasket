import pandas as pd

DIET_BLACKLIST = {
    "Vegan": ["milk", "cheese", "whey", "yogurt", "beef", "chicken", "pork", "egg", "honey", "butter", "fish", "salmon", "tuna"],
    "Vegetarian": ["beef", "chicken", "pork", "fish", "salmon", "tuna", "meat"],
    "Gluten-Free": ["wheat", "bread", "flour", "pasta", "barley", "rye", "cracker", "cookie"],
    "Dairy-Free": ["milk", "cheese", "whey", "yogurt", "butter", "cream", "lactose"],
    "Nut-Free": ["peanut", "almond", "walnut", "pecan", "cashew", "macadamia", "pistachio", "nut"],
    "Shellfish-Free": ["shrimp", "crab", "lobster", "clam", "oyster", "mussel", "scallop"],
    "Pescatarian": ["beef", "chicken", "pork", "meat", "turkey", "lamb"],
    "Keto": ["bread", "pasta", "rice", "sugar", "potato", "corn", "flour", "cookie", "cake", "cracker"],
    "Paleo": ["bread", "pasta", "rice", "sugar", "potato", "corn", "flour", "milk", "cheese", "peanut", "bean", "lentil"]
}

DIET_COLUMN_MAP = {
    "Vegan": "vegan",
    "Vegetarian": "vegetarian",
    "Gluten-Free": "gluten_free",
    "Dairy-Free": "dairy_free"
}

def filter_products_by_diet(products: list, diet: str) -> list:
    """
    Filters a list of product dictionaries based on dietary restrictions.
    Prioritizes actual boolean flags in the dataset if they exist, 
    otherwise falls back to heuristic string matching on the product name.
    """
    if not diet or diet == "None" or not products:
        return products
        
    filtered = []
    blacklist = DIET_BLACKLIST.get(diet, [])
    has_column = diet in DIET_COLUMN_MAP
    col = DIET_COLUMN_MAP.get(diet)
    
    for p in products:
        # 1. If we have a dedicated trusted key for this diet, use it strictly!
        if has_column and col in p:
            if p[col]:
                filtered.append(p)
            continue
            
        # 2. Heuristic text-based fallback for complex diets without exact columns
        if not blacklist:
            filtered.append(p) # No column and no blacklist
            continue
            
        normalized_name = p.get("normalized_name", "")
        if not normalized_name and "product_name" in p:
            normalized_name = p["product_name"].lower()
            
        # Check if any blacklisted word is in the normalized name
        is_safe = True
        for word in blacklist:
            if word in normalized_name:
                is_safe = False
                break
                
        if is_safe:
            filtered.append(p)
            
    return filtered

def is_diet_compliant(product_name: str, diet: str) -> bool:
    if not diet or diet == "None":
        return True
        
    blacklist = DIET_BLACKLIST.get(diet, [])
    name_lower = product_name.lower()
    
    for word in blacklist:
        if word in name_lower:
            return False
            
    return True
