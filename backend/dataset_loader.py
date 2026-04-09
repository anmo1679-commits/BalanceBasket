import pandas as pd
import os

# Globals caching the loaded dataset
_dataset = None

def get_dataset() -> pd.DataFrame:
    """
    Loads the grocery dataset from the CSV file.
    Caches the dataset in memory to avoid reloading on every request.
    """
    global _dataset
    if _dataset is not None:
        return _dataset
    
    # In the current setup, Dataset is located in the root 'balancebasket' directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, "..", "Dataset")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
        
    df = pd.read_csv(dataset_path)
    
    # Basic data cleaning and normalization
    # Ensure product_name is string and handle NaNs
    df["product_name"] = df["product_name"].fillna("").astype(str)
    
    # Create a normalized product name column for easier searching
    df["normalized_name"] = df["product_name"].str.lower().str.strip()
    
    # Ensure base price exists
    df["price_usd"] = pd.to_numeric(df["price_usd"], errors="coerce")
    
    # Calculate effective price (use sale price if on sale)
    df["effective_price"] = df.apply(
        lambda row: row["sale_price_usd"] if pd.notna(row.get("sale_price_usd")) and row.get("on_sale") is True else row["price_usd"],
        axis=1
    )
    
    # Cache and return
    _dataset = df
    return _dataset
