from fastapi import APIRouter, Depends, HTTPException

from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.task_schema import Task, TaskCreateInput, TaskListResponse, TaskUpdateInput
from app.services.task_service import create_task, delete_task, list_tasks, update_task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
async def get_tasks(_current_user: UserProfile = Depends(get_current_user)) -> TaskListResponse:
    return TaskListResponse(items=list_tasks())


@router.post("", response_model=Task, status_code=201)
async def post_task(
    payload: TaskCreateInput, _current_user: UserProfile = Depends(get_current_user)
) -> Task:
    return create_task(payload)


@router.put("/{task_id}", response_model=Task)
async def put_task(
    task_id: int, payload: TaskUpdateInput, _current_user: UserProfile = Depends(get_current_user)
) -> Task:
    updated_task = update_task(task_id, payload)
    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return updated_task


@router.delete("/{task_id}")
async def remove_task(task_id: int, _current_user: UserProfile = Depends(get_current_user)) -> dict:
    is_deleted = delete_task(task_id)
    if not is_deleted:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"deleted": True, "id": task_id}
