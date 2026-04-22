from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TaskStatus = Literal["todo", "in-progress", "done"]


class Task(BaseModel):
    id: int
    title: str = Field(min_length=1, max_length=120)
    status: TaskStatus
    created_at: datetime
    updated_at: datetime


class TaskCreateInput(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    status: TaskStatus = "todo"


class TaskUpdateInput(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    status: TaskStatus


class TaskListResponse(BaseModel):
    items: list[Task]
