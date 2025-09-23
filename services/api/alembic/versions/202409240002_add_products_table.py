"""Recreate products table with JSONB tags and audit columns.

Revision ID: 202409240002
Revises: 202409240001
Create Date: 2025-09-24 03:04:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202409240002"
down_revision = "202409240001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_user_id")
    op.execute("DROP TABLE IF EXISTS products CASCADE")

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("stock_info", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_products_user_id", "products", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_products_user_id", table_name="products")
    op.drop_table("products")

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("image", sa.String(length=2048), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("stock_info", sa.JSON(), nullable=True),
    )
    op.create_index("ix_products_user_id", "products", ["user_id"])
