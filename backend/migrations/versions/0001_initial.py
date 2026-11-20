"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-20
"""
import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

TIMESTAMP = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", TIMESTAMP, nullable=False),
    )
    op.create_table(
        "points",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("region", sa.String(120), nullable=False),
        sa.Column("store", sa.String(255), nullable=False),
        sa.Column("register_number", sa.String(64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", TIMESTAMP, nullable=False),
        sa.Column("updated_at", TIMESTAMP, nullable=False),
        sa.UniqueConstraint("store", "register_number", name="uq_points_store_register"),
    )
    op.create_table(
        "survey_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("point_id", sa.Integer(), sa.ForeignKey("points.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("device_hash", sa.String(64), nullable=False),
        sa.Column("user_agent", sa.String(512), nullable=False),
        sa.Column("started_at", TIMESTAMP, nullable=False),
        sa.Column("finished_at", TIMESTAMP, nullable=True),
    )
    op.create_index("ix_survey_sessions_started_at", "survey_sessions", ["started_at"])
    op.create_index("ix_survey_sessions_point_device", "survey_sessions", ["point_id", "device_hash", "started_at"])
    op.create_table(
        "survey_answers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "session_id", sa.String(36), sa.ForeignKey("survey_sessions.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("question", sa.String(32), nullable=False),
        sa.Column("option", sa.String(32), nullable=False),
        sa.Column("answered_at", TIMESTAMP, nullable=False),
        sa.UniqueConstraint("session_id", "question", name="uq_survey_answers_session_question"),
    )


def downgrade() -> None:
    op.drop_table("survey_answers")
    op.drop_index("ix_survey_sessions_point_device", table_name="survey_sessions")
    op.drop_index("ix_survey_sessions_started_at", table_name="survey_sessions")
    op.drop_table("survey_sessions")
    op.drop_table("points")
    op.drop_table("admins")
