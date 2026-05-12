"""notification dispatch audit log

Revision ID: 0005_notif_log
Revises: 0004_full_mvp
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa

revision = "0005_notif_log"
down_revision = "0004_full_mvp"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification_dispatch_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("slot_kind", sa.String(length=40), nullable=False),
        sa.Column("local_day", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("body", sa.String(length=400), nullable=False),
        sa.Column("push_attempted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("push_detail", sa.String(length=300), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "slot_kind", "local_day", name="uq_notif_dispatch_user_slot_day"),
    )
    op.create_index(
        "ix_notification_dispatch_logs_user_id",
        "notification_dispatch_logs",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_dispatch_logs_user_id", table_name="notification_dispatch_logs")
    op.drop_table("notification_dispatch_logs")
