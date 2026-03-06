from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base


class GroceryList(Base):
    __tablename__ = "lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)


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

