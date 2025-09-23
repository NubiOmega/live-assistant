from http import HTTPStatus
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import db
from app.models.product import Product
from app.schemas.product import ProductIn, ProductOut

router = APIRouter()

_DEFAULT_USER_ID = 1


@router.get("/", response_model=List[ProductOut])
async def list_products(session: AsyncSession = Depends(db.get_async_session)) -> List[ProductOut]:
    stmt = (
        select(Product)
        .where(Product.user_id == _DEFAULT_USER_ID)
        .order_by(Product.created_at.desc())
    )
    result = await session.scalars(stmt)
    return list(result.all())


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductIn,
    session: AsyncSession = Depends(db.get_async_session),
) -> ProductOut:
    product = Product(
        user_id=_DEFAULT_USER_ID,
        title=payload.title,
        price=payload.price,
        url=str(payload.url),
        image=str(payload.image) if payload.image else None,
        tags=list(payload.tags),
        stock_info=payload.stock_info,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def _get_product_or_404(product_id: int, session: AsyncSession) -> Product:
    stmt = select(Product).where(
        Product.id == product_id,
        Product.user_id == _DEFAULT_USER_ID,
    )
    product = await session.scalar(stmt)
    if product is None:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    payload: ProductIn,
    session: AsyncSession = Depends(db.get_async_session),
) -> ProductOut:
    product = await _get_product_or_404(product_id, session)

    product.title = payload.title
    product.price = payload.price
    product.url = str(payload.url)
    product.image = str(payload.image) if payload.image else None
    product.tags = list(payload.tags)
    product.stock_info = payload.stock_info

    await session.commit()
    await session.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(db.get_async_session),
) -> None:
    product = await _get_product_or_404(product_id, session)
    await session.delete(product)
    await session.commit()
    return None
