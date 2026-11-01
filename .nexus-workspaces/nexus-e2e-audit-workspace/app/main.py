from dataclasses import dataclass
from typing import Dict, Optional
import hashlib

@dataclass
class UserRecord:
    username: str
    password_hash: str
    role: str = "developer"

class AuthService:
    def __init__(self) -> None:
        self.users: Dict[str, UserRecord] = {}

    def register(self, username: str, raw_password: str) -> UserRecord:
        digest = hashlib.sha256(raw_password.encode("utf-8")).hexdigest()
        record = UserRecord(username=username, password_hash=digest)
        self.users[username] = record
        return record

    def verify(self, username: str, raw_password: str) -> bool:
        user: Optional[UserRecord] = self.users.get(username)
        if not user:
            return False
        digest = hashlib.sha256(raw_password.encode("utf-8")).hexdigest()
        return user.password_hash == digest
