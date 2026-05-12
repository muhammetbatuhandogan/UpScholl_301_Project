from pydantic import BaseModel, ConfigDict, Field


class BagItemStateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_key: str
    checked: bool


class BagItemRow(BaseModel):
    item_key: str = Field(max_length=80)
    checked: bool


class BagSyncBody(BaseModel):
    items: list[BagItemRow]


class BagListResponse(BaseModel):
    items: list[BagItemStateOut]
