from pydantic import BaseModel

class BehaviorSummaryResponse(BaseModel):
    user_id: str
    total_swipes: int
    like_count: int
    pass_count: int
    super_like_count: int
    like_rate: float
    super_like_rate: float
    received_like_count: int
    mutual_match_count: int
    selectivity_score: float


class BehaviorVectorResponse(BaseModel):
    user_id: str
    feature_names: list[str]
    vector: list[float]
