"""add created_at column to products

Revision ID: 202409240003
Revises: 202409240002
Create Date: 2025-09-24 03:45:00
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "202409240003"
down_revision = "202409240002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ")
    op.execute("UPDATE products SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW()")
    op.execute("ALTER TABLE products ALTER COLUMN created_at SET NOT NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS created_at")
