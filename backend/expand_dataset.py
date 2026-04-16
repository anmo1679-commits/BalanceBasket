import pandas as pd
import random
import os

# Load dataset
csv_path = "Dataset"
if not os.path.exists(csv_path):
    csv_path = "../Dataset"

df = pd.read_csv(csv_path)

max_product_id = df["product_id"].max() if not df.empty else 0

stores = ['Walmart', 'Target', 'Safeway', "Whole Foods", "Trader Joe's", 'King Soopers', 'Costco']

store_modifiers = {
    'Walmart': 0.85,
    'Target': 1.0,
    'Safeway': 1.1,
    'Whole Foods': 1.4,
    "Trader Joe's": 0.95,
    'King Soopers': 1.05,
    'Costco': 0.75  # Costco is bulk usually, but for synthetic we'll just drop the price multiplier a bit
}

base_items = [
    {
        "product_name": "Raw Walnuts Halves & Pieces", "category": "Nuts & Seeds", "brand": "Nature's Harvest", "size": "16 oz",
        "base_price": 7.99, "calories": 180, "protein_g": 4, "carbs_g": 4, "fat_g": 18, "sugar_g": 1, "fiber_g": 2, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free"
    },
    {
        "product_name": "Organic Whole Almonds", "category": "Nuts & Seeds", "brand": "Earth Elements", "size": "16 oz",
        "base_price": 8.99, "calories": 160, "protein_g": 6, "carbs_g": 6, "fat_g": 14, "sugar_g": 1, "fiber_g": 3, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": True, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;organic;kosher"
    },
    {
        "product_name": "Pecan Halves", "category": "Nuts & Seeds", "brand": "Nature's Harvest", "size": "12 oz",
        "base_price": 9.49, "calories": 190, "protein_g": 3, "carbs_g": 4, "fat_g": 20, "sugar_g": 1, "fiber_g": 3, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Roasted Pistachios (Salted)", "category": "Nuts & Seeds", "brand": "Snack Time", "size": "16 oz",
        "base_price": 10.99, "calories": 160, "protein_g": 6, "carbs_g": 8, "fat_g": 13, "sugar_g": 2, "fiber_g": 3, "sodium_mg": 120, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Raw Cashews", "category": "Nuts & Seeds", "brand": "Nature's Harvest", "size": "16 oz",
        "base_price": 8.49, "calories": 150, "protein_g": 5, "carbs_g": 9, "fat_g": 12, "sugar_g": 1, "fiber_g": 1, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Organic Chia Seeds", "category": "Pantry Staples", "brand": "Earth Elements", "size": "12 oz",
        "base_price": 6.99, "calories": 140, "protein_g": 5, "carbs_g": 12, "fat_g": 9, "sugar_g": 0, "fiber_g": 10, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": True, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;organic;kosher"
    },
    {
        "product_name": "Ground Flaxseed", "category": "Pantry Staples", "brand": "Earth Elements", "size": "14 oz",
        "base_price": 4.99, "calories": 110, "protein_g": 4, "carbs_g": 6, "fat_g": 7, "sugar_g": 0, "fiber_g": 5, "sodium_mg": 0, "serving_size_g": 21,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Extra Virgin Olive Oil", "category": "Pantry Staples", "brand": "Tuscan Sun", "size": "16.9 fl oz",
        "base_price": 12.99, "calories": 120, "protein_g": 0, "carbs_g": 0, "fat_g": 14, "sugar_g": 0, "fiber_g": 0, "sodium_mg": 0, "serving_size_g": 15,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Pure Vanilla Extract", "category": "Pantry Staples", "brand": "Baking Essentials", "size": "2 fl oz",
        "base_price": 5.99, "calories": 12, "protein_g": 0, "carbs_g": 0.5, "fat_g": 0, "sugar_g": 0.5, "fiber_g": 0, "sodium_mg": 0, "serving_size_g": 4,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "All-Purpose Unbleached Flour", "category": "Pantry Staples", "brand": "Baking Essentials", "size": "5 lb",
        "base_price": 3.49, "calories": 110, "protein_g": 3, "carbs_g": 23, "fat_g": 0, "sugar_g": 0, "fiber_g": 1, "sodium_mg": 0, "serving_size_g": 30,
        "vegan": True, "vegetarian": True, "gluten_free": False, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;dairy_free;kosher"
    },
    {
        "product_name": "Almond Flour", "category": "Pantry Staples", "brand": "Earth Elements", "size": "16 oz",
        "base_price": 10.99, "calories": 160, "protein_g": 6, "carbs_g": 6, "fat_g": 14, "sugar_g": 1, "fiber_g": 3, "sodium_mg": 0, "serving_size_g": 28,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": True, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;organic;kosher"
    },
    {
        "product_name": "Old Fashioned Rolled Oats", "category": "Breakfast", "brand": "Morning Harvest", "size": "42 oz",
        "base_price": 4.99, "calories": 150, "protein_g": 5, "carbs_g": 27, "fat_g": 2.5, "sugar_g": 1, "fiber_g": 4, "sodium_mg": 0, "serving_size_g": 40,
        "vegan": True, "vegetarian": True, "gluten_free": False, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;dairy_free;kosher"
    },
    {
        "product_name": "Organic Pure Maple Syrup", "category": "Pantry Staples", "brand": "Earth Elements", "size": "12 fl oz",
        "base_price": 9.99, "calories": 110, "protein_g": 0, "carbs_g": 27, "fat_g": 0, "sugar_g": 24, "fiber_g": 0, "sodium_mg": 5, "serving_size_g": 40,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": True, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;organic;kosher"
    },
    {
        "product_name": "Creamy Peanut Butter", "category": "Pantry Staples", "brand": "Nutty Joy", "size": "16 oz",
        "base_price": 3.99, "calories": 190, "protein_g": 7, "carbs_g": 8, "fat_g": 16, "sugar_g": 3, "fiber_g": 2, "sodium_mg": 140, "serving_size_g": 32,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Canned Black Beans", "category": "Pantry Staples", "brand": "Generic", "size": "15 oz",
        "base_price": 1.29, "calories": 110, "protein_g": 7, "carbs_g": 20, "fat_g": 0, "sugar_g": 1, "fiber_g": 8, "sodium_mg": 130, "serving_size_g": 130,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    },
    {
        "product_name": "Quinoa", "category": "Pantry Staples", "brand": "Earth Elements", "size": "16 oz",
        "base_price": 5.49, "calories": 160, "protein_g": 6, "carbs_g": 30, "fat_g": 2.5, "sugar_g": 1, "fiber_g": 3, "sodium_mg": 0, "serving_size_g": 45,
        "vegan": True, "vegetarian": True, "gluten_free": True, "dairy_free": True, "organic": False, "kosher": True,
        "dietary_tags": "vegan;vegetarian;gluten_free;dairy_free;kosher"
    }
]

new_rows = []

for base in base_items:
    max_product_id += 1
    base_price = base.pop("base_price")
    
    # Generate 12 digit UPC
    upc_12 = str(random.randint(100000000000, 999999999999))
    
    for store in stores:
        modifier = store_modifiers[store]
        # Randomize price slightly around the modifier (-5% to +5%)
        rand_mod = modifier * random.uniform(0.95, 1.05)
        price = round(base_price * rand_mod, 2)
        
        # 10% chance to be on sale
        on_sale = random.random() < 0.1
        sale_discount_pct = random.randint(10, 30) if on_sale else None
        sale_price_usd = round(price * (1 - sale_discount_pct/100.0), 2) if on_sale else None
        
        row = {
            "product_id": max_product_id,
            "upc_12": upc_12,
            "product_name": base["product_name"],
            "category": base["category"],
            "brand": base["brand"],
            "size": base["size"],
            "store": store,
            "price_usd": price,
            "on_sale": on_sale,
            "sale_price_usd": sale_price_usd,
            "sale_discount_pct": sale_discount_pct,
            "product_image_url": "",
            "analysis_neighborhood": "Boulder, CO",
            "calories": base["calories"],
            "protein_g": base["protein_g"],
            "carbs_g": base["carbs_g"],
            "fat_g": base["fat_g"],
            "sugar_g": base["sugar_g"],
            "fiber_g": base["fiber_g"],
            "sodium_mg": base["sodium_mg"],
            "serving_size_g": base["serving_size_g"],
            "vegan": base["vegan"],
            "vegetarian": base["vegetarian"],
            "gluten_free": base["gluten_free"],
            "dairy_free": base["dairy_free"],
            "organic": base["organic"],
            "kosher": base["kosher"],
            "dietary_tags": base["dietary_tags"],
        }
        new_rows.append(row)

new_df = pd.DataFrame(new_rows)
combined_df = pd.concat([df, new_df], ignore_index=True)
combined_df.to_csv(csv_path, index=False)

print(f"Successfully added {len(new_rows)} new product listings across 7 stores.")
print("Unique products added:")
for b in base_items:
    print(f"- {b['product_name']}")
