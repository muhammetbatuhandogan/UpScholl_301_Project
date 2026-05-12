from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import FamilyMember
from app.schemas.family_schema import FamilyMemberCreate, FamilyMemberUpdate

MAX_MEMBERS = 5


def _count_members(db: Session, user_id: int) -> int:
    return int(
        db.scalar(
            select(func.count(FamilyMember.id)).where(FamilyMember.user_id == user_id)
        )
        or 0
    )


def list_members(db: Session, user_id: int) -> list[FamilyMember]:
    return list(
        db.scalars(
            select(FamilyMember)
            .where(FamilyMember.user_id == user_id)
            .order_by(FamilyMember.id.asc())
        ).all()
    )


def add_member(db: Session, user_id: int, payload: FamilyMemberCreate) -> FamilyMember:
    if _count_members(db, user_id) >= MAX_MEMBERS:
        raise ValueError("max_members")
    row = FamilyMember(
        user_id=user_id,
        name=payload.name.strip(),
        role=(payload.role or "Member").strip()[:40],
        score=payload.score,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_member(db: Session, user_id: int, member_id: int) -> Optional[FamilyMember]:
    row = db.get(FamilyMember, member_id)
    if row is None or row.user_id != user_id:
        return None
    return row


def update_member(
    db: Session, user_id: int, member_id: int, payload: FamilyMemberUpdate
) -> Optional[FamilyMember]:
    row = get_member(db, user_id, member_id)
    if row is None:
        return None
    row.name = payload.name.strip()
    row.role = payload.role.strip()[:40]
    row.score = payload.score
    db.commit()
    db.refresh(row)
    return row


def delete_member(db: Session, user_id: int, member_id: int) -> bool:
    row = get_member(db, user_id, member_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
