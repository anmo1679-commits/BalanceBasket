from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, SessionLocal
from schemas import ListCreate, ListOut, ItemCreate, ItemOut, ItemUpdate

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BalanceBasket API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Lists ──────────────────────────────────────────────────────────────────────

@app.post("/lists", response_model=ListOut, status_code=201)
def create_list(payload: ListCreate, db: Session = Depends(get_db)):
    new_list = models.GroceryList(name=payload.name)
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@app.get("/lists", response_model=list[ListOut])
def get_lists(db: Session = Depends(get_db)):
    return db.query(models.GroceryList).all()


# ── Items ──────────────────────────────────────────────────────────────────────

@app.post("/lists/{list_id}/items", response_model=ItemOut, status_code=201)
def create_item(list_id: int, payload: ItemCreate, db: Session = Depends(get_db)):
    grocery_list = db.get(models.GroceryList, list_id)
    if not grocery_list:
        raise HTTPException(status_code=404, detail="List not found")
    new_item = models.Item(list_id=list_id, name=payload.name)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.get("/lists/{list_id}/items", response_model=list[ItemOut])
def get_items(list_id: int, db: Session = Depends(get_db)):
    grocery_list = db.get(models.GroceryList, list_id)
    if not grocery_list:
        raise HTTPException(status_code=404, detail="List not found")
    return db.query(models.Item).filter(models.Item.list_id == list_id).all()


@app.patch("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if payload.checked is not None:
        item.checked = payload.checked
    db.commit()
    db.refresh(item)
    return item

# ── Products ───────────────────────────────────────────────────────────────────

from product_search import search_products
from price_compare import get_price_comparison

@app.get("/api/products/search")
def search_products_api(q: str = ""):
    if not q:
        return []
        
    matching_products = search_products(q)
    results = []
    
    for product in matching_products:
        comparison = get_price_comparison(product)
        if comparison:
            results.append(comparison)
            
    return results

# ── Optimization ───────────────────────────────────────────────────────────────

from list_optimizer import optimize_list
from schemas import ListOptimizationRequest

@app.post("/api/lists/optimize")
def optimize_list_api(payload: ListOptimizationRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="List cannot be empty")
        
    return optimize_list(payload.items)

# ── Seasonal ───────────────────────────────────────────────────────────────────

from seasonal_guide import get_seasonal_produce

@app.get("/api/seasonal")
def seasonal_produce_api():
    seasonal_data = get_seasonal_produce()
    if not seasonal_data:
        # Fallback if the dataset is empty or logic fails
        return []
        
    # We'll attach the cheapest option to each seasonal produce item if possible
    from price_compare import get_price_comparison
    for item in seasonal_data:
        comp = get_price_comparison(item["product_name"])
        if comp:
             item["cheapest_store"] = comp.get("cheapest_option")
             item["cheapest_price"] = comp.get("cheapest_price")
             
    return seasonal_data


# ── Social Feed ────────────────────────────────────────────────────────────────

from schemas import MealCreate, MealOut

@app.post("/api/meals", response_model=MealOut, status_code=201)
def create_meal(payload: MealCreate, db: Session = Depends(get_db)):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    new_meal = models.MealRate(
        name=payload.name,
        description=payload.description,
        rating=payload.rating
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return new_meal

@app.get("/api/meals", response_model=list[MealOut])
def get_meals(db: Session = Depends(get_db)):
    # Return meals ordered by newest first (descending ID)
    return db.query(models.MealRate).order_by(models.MealRate.id.desc()).all()
