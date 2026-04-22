from datetime import datetime, timezone
from typing import Optional

from app.schemas.task_schema import Task, TaskCreateInput, TaskUpdateInput

_task_id_counter = 3
_tasks: list[Task] = [
    Task(
        id=1,
        title="Prepare emergency bag starter items",
        status="todo",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    ),
    Task(
        id=2,
        title="Set family meeting point",
        status="in-progress",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    ),
]


def list_tasks() -> list[Task]:
    return _tasks


def create_task(payload: TaskCreateInput) -> Task:
    global _task_id_counter
    now_utc = datetime.now(timezone.utc)
    new_task = Task(
        id=_task_id_counter,
        title=payload.title.strip(),
        status=payload.status,
        created_at=now_utc,
        updated_at=now_utc,
    )
    _task_id_counter += 1
    _tasks.insert(0, new_task)
    return new_task


def get_task_by_id(task_id: int) -> Optional[Task]:
    for task in _tasks:
        if task.id == task_id:
            return task
    return None


def update_task(task_id: int, payload: TaskUpdateInput) -> Optional[Task]:
    task = get_task_by_id(task_id)
    if task is None:
        return None
    task.title = payload.title.strip()
    task.status = payload.status
    task.updated_at = datetime.now(timezone.utc)
    return task


def delete_task(task_id: int) -> bool:
    for index, task in enumerate(_tasks):
        if task.id == task_id:
            _tasks.pop(index)
            return True
    return False
