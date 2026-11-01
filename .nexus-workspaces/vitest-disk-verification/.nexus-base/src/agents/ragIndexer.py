from dataclasses import dataclass
from typing import List

@dataclass
class CodeChunk:
    file_path: str
    start_line: int
    end_line: int
    content: str

class VectorStoreIndex:
    def __init__(self) -> None:
        self.chunks: List[CodeChunk] = []

    def index_document(self, file_path: str, source: str, chunk_size: int = 25) -> int:
        lines = source.splitlines()
        for idx in range(0, len(lines), chunk_size):
            segment = "\n".join(lines[idx:idx + chunk_size])
            self.chunks.append(
                CodeChunk(
                    file_path=file_path,
                    start_line=idx + 1,
                    end_line=min(idx + chunk_size, len(lines)),
                    content=segment,
                )
            )
        return len(self.chunks)
