from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Task as TaskORM
from app.schemas.task_schema import Task, TaskCreateInput, TaskUpdateInput


def list_tasks(db: Session, user_id: int) -> list[Task]:
    rows = db.scalars(
        select(TaskORM)
        .where(TaskORM.user_id == user_id)
        .order_by(TaskORM.id.desc())
    ).all()
    return [Task.model_validate(row) for row in rows]


def create_task(db: Session, user_id: int, payload: TaskCreateInput) -> Task:
    row = TaskORM(
        user_id=user_id,
        title=payload.title.strip(),
        status=payload.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return Task.model_validate(row)


def get_task_by_id(db: Session, user_id: int, task_id: int) -> Optional[TaskORM]:
    row = db.get(TaskORM, task_id)
    if row is None or row.user_id != user_id:
        return None
    return row


def update_task(db: Session, user_id: int, task_id: int, payload: TaskUpdateInput) -> Optional[Task]:
    row = get_task_by_id(db, user_id, task_id)
    if row is None:
        return None
    row.title = payload.title.strip()
    row.status = payload.status
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return Task.model_validate(row)


def delete_task(db: Session, user_id: int, task_id: int) -> bool:
    row = get_task_by_id(db, user_id, task_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
