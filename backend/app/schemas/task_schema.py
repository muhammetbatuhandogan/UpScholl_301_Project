from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TaskStatus = Literal["todo", "in-progress", "done"]


class Task(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
