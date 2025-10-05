"""Add IP models and notifications with pgvector

Revision ID: f2fd1e5ccfd4
Revises: 27d85e19eb83  # replace with your last working revision
Create Date: 2025-10-04 02:30:00

"""
from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy as pgvector

# revision identifiers, used by Alembic.
revision = 'f2fd1e5ccfd4'
down_revision = '27d85e19eb83'  # <-- replace with actual last working migration ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ---------------------- Images ----------------------
    if not conn.dialect.has_table(conn, 'images'):
        op.create_table(
            'images',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('user_id', sa.Integer, nullable=True),
            sa.Column('image_url', sa.String(1000), nullable=False, unique=True),
            sa.Column('source_page_url', sa.String(1000), nullable=True),
            sa.Column('domain', sa.String(255), nullable=True),
            sa.Column('status_code', sa.Integer, nullable=True),
            sa.Column('content_type', sa.String(50), nullable=True),
            sa.Column('file_size_bytes', sa.Integer, nullable=True),
            sa.Column('width', sa.Integer, nullable=True),
            sa.Column('height', sa.Integer, nullable=True),
            sa.Column('page_title', sa.String(500), nullable=True),
            sa.Column('img_alt', sa.String(500), nullable=True),
            sa.Column('sha256', sa.String(64), nullable=True),
            sa.Column('phash', sa.String(64), nullable=True),
            sa.Column('s3_path', sa.String(1000), nullable=True),
            sa.Column('status', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        )
        op.create_foreign_key(
            None, 'images', 'users', ['user_id'], ['id'], ondelete='SET NULL'
        )

    # ---------------------- Image Embeddings ----------------------
    if not conn.dialect.has_table(conn, 'image_embeddings'):
        op.create_table(
            'image_embeddings',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('image_id', sa.Integer, nullable=False),
            sa.Column('vector', pgvector.Vector(512), nullable=False),
            sa.Column('model', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_foreign_key(None, 'image_embeddings', 'images', ['image_id'], ['id'], ondelete='CASCADE')

    # ---------------------- IP Assets ----------------------
    if not conn.dialect.has_table(conn, 'ip_assets'):
        op.create_table(
            'ip_assets',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('user_id', sa.Integer, nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('asset_type', sa.String(50), nullable=True),
            sa.Column('file_url', sa.String(1000), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        )
        op.create_foreign_key(None, 'ip_assets', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # ---------------------- IP Embeddings ----------------------
    if not conn.dialect.has_table(conn, 'ip_embeddings'):
        op.create_table(
            'ip_embeddings',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('asset_id', sa.Integer, nullable=False),
            sa.Column('vector', pgvector.Vector(512), nullable=False),
            sa.Column('model', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_foreign_key(None, 'ip_embeddings', 'ip_assets', ['asset_id'], ['id'], ondelete='CASCADE')

    # ---------------------- IP Matches ----------------------
    if not conn.dialect.has_table(conn, 'ip_matches'):
        op.create_table(
            'ip_matches',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('source_image_id', sa.Integer, nullable=False),
            sa.Column('matched_asset_id', sa.Integer, nullable=False),
            sa.Column('similarity_score', sa.Float, nullable=True),
            sa.Column('user_confirmed', sa.Boolean, nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_foreign_key(None, 'ip_matches', 'images', ['source_image_id'], ['id'], ondelete='CASCADE')
        op.create_foreign_key(None, 'ip_matches', 'ip_assets', ['matched_asset_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    conn = op.get_bind()

    if conn.dialect.has_table(conn, 'ip_matches'):
        op.drop_table('ip_matches')
    if conn.dialect.has_table(conn, 'ip_embeddings'):
        op.drop_table('ip_embeddings')
    if conn.dialect.has_table(conn, 'ip_assets'):
        op.drop_table('ip_assets')
    if conn.dialect.has_table(conn, 'image_embeddings'):
        op.drop_table('image_embeddings')
    if conn.dialect.has_table(conn, 'images'):
        op.drop_table('images')