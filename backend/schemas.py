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
