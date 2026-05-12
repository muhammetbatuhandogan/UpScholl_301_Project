from typing import Optional

from pydantic import BaseModel, Field


class OtpRequestBody(BaseModel):
    phone: str = Field(min_length=11, max_length=20)


class OtpVerifyBody(BaseModel):
    phone: str = Field(min_length=11, max_length=20)
    code: str = Field(min_length=6, max_length=6)


class OtpRequestResponse(BaseModel):
    ok: bool = True
    expires_in_seconds: int = 300
    debug_code: Optional[str] = None
