from typing import List

class DataPipeline:
    def transform_batch(self, items: List[str]) -> List[str]:
        return [item.strip().lower() for item in items if item.strip()]
