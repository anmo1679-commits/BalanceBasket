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


# ── Authentication ──────────────────────────────────────────────────────────────

from auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
import jwt
from datetime import timedelta
from schemas import UserCreate, UserOut, Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


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


# ── AI Assistant ───────────────────────────────────────────────────────────────

from pydantic import BaseModel
from ai_service import generate_chat_response

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    cart_items: list[str] = []

@app.post("/api/chat")
async def chat_api(payload: ChatRequest):
    # Convert Pydantic models to dicts for the OpenAI API
    messages_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
    
    response_text = await generate_chat_response(messages_dicts, payload.cart_items)
    return {"reply": response_text}
