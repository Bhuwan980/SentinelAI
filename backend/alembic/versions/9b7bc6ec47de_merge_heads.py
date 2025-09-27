"""merge heads

Revision ID: 9b7bc6ec47de
Revises: 001_enable_vector, 657dcfe5ec27
Create Date: 2025-09-19 02:02:38.440180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b7bc6ec47de'
down_revision: Union[str, None] = ('001_enable_vector', '657dcfe5ec27')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
