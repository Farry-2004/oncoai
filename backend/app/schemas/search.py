from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    label: str
    sublabel: str | None = None
    link: str


class SearchResults(BaseModel):
    patients: list[SearchResultItem]
    tumor_boards: list[SearchResultItem]
    specialists: list[SearchResultItem]
    reports: list[SearchResultItem]
