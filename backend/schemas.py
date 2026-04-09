from pydantic import BaseModel
from typing import Optional


class ListCreate(BaseModel):
    name: str


class ListOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    name: str


class ItemUpdate(BaseModel):
    checked: Optional[bool] = None


class ItemOut(BaseModel):
    id: int
    list_id: int
    name: str
    checked: bool

    class Config:
        from_attributes = True


class ListOptimizationRequest(BaseModel):
    items: list[str]
    diet: str = "None"

class MealCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rating: int
    
class MealOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    rating: int
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

