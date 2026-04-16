from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)

class GroceryList(Base):
    __tablename__ = "lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("lists.id"), index=True)
    name = Column(String, nullable=False)
    checked = Column(Boolean, default=False)

class MealRate(Base):
    __tablename__ = "meals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)

class PantryItem(Base):
    __tablename__ = "pantry_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)

class SavedList(Base):
    """Persistent named grocery lists that survive across sessions."""
    __tablename__ = "saved_lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default="My List")
    # Items stored as a JSON array string: '["Milk","Eggs"]'
    items_json = Column(Text, nullable=False, default="[]")
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PurchaseHistory(Base):
    """Immutable snapshot created every time a list is marked as purchased."""
    __tablename__ = "purchase_history"
    id = Column(Integer, primary_key=True, index=True)
    list_name = Column(String, nullable=False)
    # Items stored as a JSON array string
    items_json = Column(Text, nullable=False, default="[]")
    store = Column(String, nullable=True)
    total = Column(Float, nullable=True)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
