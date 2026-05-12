import secrets
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import FamilyGroup, FamilyGroupMember, User, UserReadinessScore


MAX_GROUP_MEMBERS = 5


def _random_invite_code(db: Session) -> str:
    for _ in range(80):
        code = f"{secrets.randbelow(1000000):06d}"
        exists = db.scalar(select(FamilyGroup.id).where(FamilyGroup.invite_code == code))
        if exists is None:
            return code
    raise RuntimeError("Could not allocate invite code.")


def _membership(db: Session, user_id: int) -> Optional[FamilyGroupMember]:
    return db.scalar(select(FamilyGroupMember).where(FamilyGroupMember.user_id == user_id))


def create_group(db: Session, user_id: int) -> FamilyGroup:
    if _membership(db, user_id) is not None:
        raise ValueError("already_in_group")
    code = _random_invite_code(db)
    group = FamilyGroup(leader_user_id=user_id, invite_code=code)
    db.add(group)
    db.flush()
    db.add(FamilyGroupMember(family_group_id=group.id, user_id=user_id, is_leader=True))
    db.commit()
    db.refresh(group)
    return group


def join_group(db: Session, user_id: int, code: str) -> FamilyGroup:
    raw = "".join(c for c in code if c.isdigit())[:6]
    if len(raw) != 6:
        raise ValueError("invalid_code")
    if _membership(db, user_id) is not None:
        raise ValueError("already_in_group")
    group = db.scalar(select(FamilyGroup).where(FamilyGroup.invite_code == raw))
    if group is None:
        raise ValueError("invalid_code")
    n = db.scalar(
        select(func.count())
        .select_from(FamilyGroupMember)
        .where(FamilyGroupMember.family_group_id == group.id)
    )
    if n is None or int(n) >= MAX_GROUP_MEMBERS:
        raise ValueError("group_full")
    db.add(FamilyGroupMember(family_group_id=group.id, user_id=user_id, is_leader=False))
    db.commit()
    db.refresh(group)
    return group


def leave_group(db: Session, user_id: int) -> None:
    m = _membership(db, user_id)
    if m is None:
        raise ValueError("not_in_group")
    group = db.get(FamilyGroup, m.family_group_id)
    if group is None:
        db.delete(m)
        db.commit()
        return
    if m.is_leader:
        db.delete(group)
    else:
        db.delete(m)
    db.commit()


def get_dashboard(db: Session, user_id: int) -> Optional[dict]:
    m = _membership(db, user_id)
    if m is None:
        return None
    group = db.get(FamilyGroup, m.family_group_id)
    if group is None:
        return None
    members = db.scalars(
        select(FamilyGroupMember).where(FamilyGroupMember.family_group_id == group.id)
    ).all()
    rows: list[dict] = []
    for mem in members:
        u = db.get(User, mem.user_id)
        if u is None:
            continue
        score_row = db.get(UserReadinessScore, mem.user_id)
        total = score_row.total_score if score_row is not None else 0
        rows.append(
            {
                "user_id": mem.user_id,
                "username": u.username,
                "total_score": total,
                "is_leader": mem.is_leader,
            }
        )
    if not rows:
        return None
    avg = sum(r["total_score"] for r in rows) / len(rows)
    weakest = min(rows, key=lambda r: r["total_score"])
    return {
        "id": group.id,
        "invite_code": group.invite_code,
        "members": rows,
        "family_average_score": round(avg, 2),
        "weakest_user_id": weakest["user_id"],
    }
