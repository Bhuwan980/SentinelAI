"""fix relationships

Revision ID: d1b34858cd62
Revises: f2fd1e5ccfd4
Create Date: 2025-10-04 01:48:30.180776

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import pgvector


# revision identifiers, used by Alembic.
revision: str = 'd1b34858cd62'
down_revision: Union[str, None] = 'f2fd1e5ccfd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Convert vector columns to JSON safely using to_json()
    op.execute("""
        ALTER TABLE image_embeddings
        ALTER COLUMN vector TYPE JSON
        USING to_json(vector);
    """)

    op.execute("""
        ALTER TABLE ip_embeddings
        ALTER COLUMN vector TYPE JSON
        USING to_json(vector);
    """)

    op.alter_column('image_embeddings', 'model',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.String(length=50),
               existing_nullable=True)
    op.drop_constraint(op.f('image_embeddings_image_id_fkey'), 'image_embeddings', type_='foreignkey')
    op.create_foreign_key(None, 'image_embeddings', 'images', ['image_id'], ['id'])
    op.alter_column('images', 'source_page_url',
               existing_type=sa.VARCHAR(length=500),
               type_=sa.String(length=1000),
               existing_nullable=True)
    op.alter_column('images', 'content_type',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=50),
               existing_nullable=True)
    op.alter_column('images', 'phash',
               existing_type=sa.VARCHAR(length=16),
               type_=sa.String(length=64),
               existing_nullable=True)
    op.alter_column('images', 'status',
               existing_type=sa.VARCHAR(length=32),
               type_=sa.String(length=50),
               nullable=True)
    op.drop_constraint(op.f('images_image_url_key'), 'images', type_='unique')
    op.drop_index(op.f('ix_images_phash'), table_name='images')
    op.drop_index(op.f('ix_images_sha256'), table_name='images')
    op.add_column('ip_assets', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('ip_embeddings', 'model',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.String(length=50),
               existing_nullable=True)
    op.drop_constraint(op.f('ip_embeddings_asset_id_fkey'), 'ip_embeddings', type_='foreignkey')
    op.create_foreign_key(None, 'ip_embeddings', 'ip_assets', ['asset_id'], ['id'])
    op.add_column('ip_matches', sa.Column('source_image_id', sa.Integer(), nullable=False))
    op.add_column('ip_matches', sa.Column('user_confirmed', sa.Boolean(), nullable=True))
    op.drop_constraint(op.f('ip_matches_matched_asset_id_fkey'), 'ip_matches', type_='foreignkey')
    op.drop_constraint(op.f('ip_matches_source_asset_id_fkey'), 'ip_matches', type_='foreignkey')
    op.create_foreign_key(None, 'ip_matches', 'images', ['source_image_id'], ['id'])
    op.create_foreign_key(None, 'ip_matches', 'ip_assets', ['matched_asset_id'], ['id'])
    op.drop_column('ip_matches', 'source_asset_id')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('ip_matches', sa.Column('source_asset_id', sa.INTEGER(), autoincrement=False, nullable=False))
    op.drop_constraint(None, 'ip_matches', type_='foreignkey')
    op.drop_constraint(None, 'ip_matches', type_='foreignkey')
    op.create_foreign_key(op.f('ip_matches_source_asset_id_fkey'), 'ip_matches', 'ip_assets', ['source_asset_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('ip_matches_matched_asset_id_fkey'), 'ip_matches', 'ip_assets', ['matched_asset_id'], ['id'], ondelete='CASCADE')
    op.drop_column('ip_matches', 'user_confirmed')
    op.drop_column('ip_matches', 'source_image_id')

    # revert vector back to pgvector
    op.execute("""
        ALTER TABLE image_embeddings
        ALTER COLUMN vector TYPE vector(512)
        USING (vector::vector(512));
    """)

    op.execute("""
        ALTER TABLE ip_embeddings
        ALTER COLUMN vector TYPE vector(512)
        USING (vector::vector(512));
    """)

    op.alter_column('ip_embeddings', 'model',
               existing_type=sa.String(length=50),
               type_=sa.VARCHAR(length=100),
               existing_nullable=True)
    op.drop_column('ip_assets', 'updated_at')
    op.create_index(op.f('ix_images_sha256'), 'images', ['sha256'], unique=True)
    op.create_index(op.f('ix_images_phash'), 'images', ['phash'], unique=False)
    op.create_unique_constraint(op.f('images_image_url_key'), 'images', ['image_url'], postgresql_nulls_not_distinct=False)
