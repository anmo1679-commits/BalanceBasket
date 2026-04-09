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

def is_diet_compliant(product_name: str, diet: str) -> bool:
    if not diet or diet == "None":
        return True
        
    blacklist = DIET_BLACKLIST.get(diet, [])
    name_lower = product_name.lower()
    
    for word in blacklist:
        if word in name_lower:
            return False
            
    return True
