from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, SessionLocal
from schemas import ListCreate, ListOut, ItemCreate, ItemOut, ItemUpdate

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BalanceBasket API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173"
    ],
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
import asyncio
from functools import partial

@app.get("/api/products/search")
async def search_products_api(q: str = "", diet: str = "None"):
    if not q:
        return []

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(search_products, q, diet=diet))

# ── Optimization ───────────────────────────────────────────────────────────────

from list_optimizer import optimize_list
from schemas import ListOptimizationRequest

@app.post("/api/lists/optimize")
def optimize_list_api(payload: ListOptimizationRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="List cannot be empty")
    return optimize_list(payload.items)

# ── Saved Lists ────────────────────────────────────────────────────────────────

import json as _json
from pydantic import BaseModel as _BM
from typing import Optional as _Opt

class SavedListCreate(_BM):
    name: str = "My List"
    items: list[str] = []
    is_template: bool = False

class SavedListUpdate(_BM):
    name: _Opt[str] = None
    items: _Opt[list[str]] = None
    is_template: _Opt[bool] = None

class PurchaseCreate(_BM):
    list_name: str
    items: list[str]
    store: _Opt[str] = None
    total: _Opt[float] = None

def _sl_to_dict(sl) -> dict:
    return {
        "id": sl.id,
        "name": sl.name,
        "items": _json.loads(sl.items_json or "[]"),
        "is_template": sl.is_template,
        "created_at": sl.created_at.isoformat() if sl.created_at else None,
        "updated_at": sl.updated_at.isoformat() if sl.updated_at else None,
    }

def _ph_to_dict(ph) -> dict:
    return {
        "id": ph.id,
        "list_name": ph.list_name,
        "items": _json.loads(ph.items_json or "[]"),
        "store": ph.store,
        "total": ph.total,
        "purchased_at": ph.purchased_at.isoformat() if ph.purchased_at else None,
    }

@app.get("/api/saved-lists")
def get_saved_lists(db: Session = Depends(get_db)):
    rows = db.query(models.SavedList).order_by(models.SavedList.updated_at.desc()).all()
    return [_sl_to_dict(r) for r in rows]

@app.post("/api/saved-lists", status_code=201)
def create_saved_list(payload: SavedListCreate, db: Session = Depends(get_db)):
    sl = models.SavedList(
        name=payload.name,
        items_json=_json.dumps(payload.items),
        is_template=payload.is_template,
    )
    db.add(sl)
    db.commit()
    db.refresh(sl)
    return _sl_to_dict(sl)

@app.patch("/api/saved-lists/{list_id}")
def update_saved_list(list_id: int, payload: SavedListUpdate, db: Session = Depends(get_db)):
    sl = db.get(models.SavedList, list_id)
    if not sl:
        raise HTTPException(status_code=404, detail="List not found")
    if payload.name is not None:
        sl.name = payload.name
    if payload.items is not None:
        sl.items_json = _json.dumps(payload.items)
    if payload.is_template is not None:
        sl.is_template = payload.is_template
    db.commit()
    db.refresh(sl)
    return _sl_to_dict(sl)

@app.delete("/api/saved-lists/{list_id}", status_code=204)
def delete_saved_list(list_id: int, db: Session = Depends(get_db)):
    sl = db.get(models.SavedList, list_id)
    if not sl:
        raise HTTPException(status_code=404, detail="List not found")
    db.delete(sl)
    db.commit()

@app.post("/api/purchase-history", status_code=201)
def record_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    ph = models.PurchaseHistory(
        list_name=payload.list_name,
        items_json=_json.dumps(payload.items),
        store=payload.store,
        total=payload.total,
    )
    db.add(ph)
    db.commit()
    db.refresh(ph)
    return _ph_to_dict(ph)

@app.get("/api/purchase-history")
def get_purchase_history(db: Session = Depends(get_db)):
    rows = db.query(models.PurchaseHistory).order_by(models.PurchaseHistory.purchased_at.desc()).all()
    return [_ph_to_dict(r) for r in rows]

# ── Seasonal ───────────────────────────────────────────────────────────────────

from seasonal_guide import get_seasonal_produce

@app.get("/api/seasonal")
def seasonal_produce_api(diet: str = "None"):
    seasonal_data = get_seasonal_produce(diet=diet)
    return seasonal_data if seasonal_data else []




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
def get_meals(db: Session = Depends(get_db), diet: str = "None"):
    # Return meals ordered by newest first (descending ID)
    return db.query(models.MealRate).order_by(models.MealRate.id.desc()).all()


# ── Pantry ─────────────────────────────────────────────────────────────────────

from schemas import PantryItemOut, PantryItemCreate, PantryListCreate

@app.get("/api/pantry", response_model=list[PantryItemOut])
def get_pantry(db: Session = Depends(get_db)):
    return db.query(models.PantryItem).all()

@app.post("/api/pantry", response_model=PantryItemOut, status_code=201)
def create_pantry_item(payload: PantryItemCreate, db: Session = Depends(get_db)):
    new_item = models.PantryItem(name=payload.name, quantity=payload.quantity)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.post("/api/pantry/bulk", response_model=list[PantryItemOut], status_code=201)
def sync_pantry_items(payload: PantryListCreate, db: Session = Depends(get_db)):
    new_items = []
    for item_name in payload.items:
        # Avoid duplicate exact matches or just add them? Let's add them or update.
        # Simple for now: just add.
        new_item = models.PantryItem(name=item_name, quantity="1")
        db.add(new_item)
        new_items.append(new_item)
    db.commit()
    for i in new_items:
        db.refresh(i)
    return new_items

@app.delete("/api/pantry/{item_id}", status_code=204)
def delete_pantry_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# ── AI Assistant ───────────────────────────────────────────────────────────────

from pydantic import BaseModel
from ai_service import generate_chat_response

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    cart_items: list[str] = []
    pantry_items: list[str] = []
    diet: str = "None"

from fastapi.responses import StreamingResponse

@app.post("/api/chat")
async def chat_api(payload: ChatRequest):
    # Convert Pydantic models to dicts for the OpenAI API
    messages_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
    
    return StreamingResponse(
        generate_chat_response(messages_dicts, payload.cart_items, payload.diet, payload.pantry_items),
        media_type="text/plain"
    )

from ai_service import warmup_model

@app.post("/api/chat/warmup")
async def chat_warmup():
    success = await warmup_model()
    return {"status": "success" if success else "error"}
