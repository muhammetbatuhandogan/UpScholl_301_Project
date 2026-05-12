"""otp sessions, users.phone, family_members

Revision ID: 0003_otp_family
Revises: 0002_slice1
Create Date: 2026-05-12

"""
from alembic import op
import sqlalchemy as sa

revision = "0003_otp_family"
down_revision = "0002_slice1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=20), nullable=True))
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_table(
        "otp_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts_remaining", sa.Integer(), nullable=False, server_default="3"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_otp_sessions_phone", "otp_sessions", ["phone"], unique=False)
    op.create_table(
        "family_members",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_family_members_user_id", "family_members", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_family_members_user_id", table_name="family_members")
    op.drop_table("family_members")
    op.drop_index("ix_otp_sessions_phone", table_name="otp_sessions")
    op.drop_table("otp_sessions")
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_column("users", "phone")
