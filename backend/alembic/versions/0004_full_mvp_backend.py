"""refresh tokens, family groups, bag/score sync, SOS, push, notification prefs

Revision ID: 0004_full_mvp
Revises: 0003_otp_family
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_full_mvp"
down_revision = "0003_otp_family"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "access_tokens",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_token", "refresh_tokens", ["token"], unique=True)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)

    op.create_table(
        "family_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("leader_user_id", sa.Integer(), nullable=False),
        sa.Column("invite_code", sa.String(length=6), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["leader_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_family_groups_invite_code", "family_groups", ["invite_code"], unique=True)

    op.create_table(
        "family_group_members",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("family_group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("is_leader", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["family_group_id"], ["family_groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_family_group_members_user_id"),
        sa.UniqueConstraint(
            "family_group_id",
            "user_id",
            name="uq_family_group_members_group_user",
        ),
    )
    op.create_index(
        "ix_family_group_members_family_group_id",
        "family_group_members",
        ["family_group_id"],
        unique=False,
    )

    op.create_table(
        "bag_item_states",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("item_key", sa.String(length=80), nullable=False),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "item_key", name="uq_bag_item_states_user_item"),
    )
    op.create_index("ix_bag_item_states_user_id", "bag_item_states", ["user_id"], unique=False)

    op.create_table(
        "user_readiness_scores",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("breakdown", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "sos_contacts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "sort_order", name="uq_sos_contacts_user_sort"),
    )
    op.create_index("ix_sos_contacts_user_id", "sos_contacts", ["user_id"], unique=False)

    op.create_table(
        "sos_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("recipients", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sos_events_user_id", "sos_events", ["user_id"], unique=False)

    op.create_table(
        "device_push_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=512), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "token", name="uq_device_push_tokens_user_token"),
    )
    op.create_index("ix_device_push_tokens_user_id", "device_push_tokens", ["user_id"], unique=False)

    op.create_table(
        "notification_settings",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Istanbul"),
        sa.Column("dnd", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("notification_settings")
    op.drop_index("ix_device_push_tokens_user_id", table_name="device_push_tokens")
    op.drop_table("device_push_tokens")
    op.drop_index("ix_sos_events_user_id", table_name="sos_events")
    op.drop_table("sos_events")
    op.drop_index("ix_sos_contacts_user_id", table_name="sos_contacts")
    op.drop_table("sos_contacts")
    op.drop_table("user_readiness_scores")
    op.drop_index("ix_bag_item_states_user_id", table_name="bag_item_states")
    op.drop_table("bag_item_states")
    op.drop_index("ix_family_group_members_family_group_id", table_name="family_group_members")
    op.drop_table("family_group_members")
    op.drop_index("ix_family_groups_invite_code", table_name="family_groups")
    op.drop_table("family_groups")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_token", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_column("access_tokens", "expires_at")
