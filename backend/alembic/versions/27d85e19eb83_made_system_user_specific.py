"""made system user specific

Revision ID: 27d85e19eb83
Revises: e76b52702594
Create Date: 2025-09-30 16:38:23.175607
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27d85e19eb83'
down_revision: Union[str, None] = 'e76b52702594'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema safely."""
    # 1️⃣ Add nullable column first
    op.add_column('images', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'images', 'users', ['user_id'], ['id'])

    # 2️⃣ Backfill existing rows with system user (assumes user id=1 exists)
    op.execute("UPDATE images SET user_id = 1 WHERE user_id IS NULL")

    # 3️⃣ Alter column to NOT NULL
    op.alter_column('images', 'user_id', nullable=False)

    # 4️⃣ Drop old username column
    op.drop_column('images', 'username')

    # 5️⃣ Add new columns to users table
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('auth_provider', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('phone_number', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('profile_image_url', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('bio', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('language', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('timezone', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('notification_preferences', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Drop newly added user columns
    op.drop_column('users', 'notification_preferences')
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'language')
    op.drop_column('users', 'location')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'profile_image_url')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_active')

    # Add old username column back
    op.add_column('images', sa.Column('username', sa.String(length=255), nullable=True))

    # Drop foreign key and user_id column
    op.drop_constraint(None, 'images', type_='foreignkey')
    op.drop_column('images', 'user_id')