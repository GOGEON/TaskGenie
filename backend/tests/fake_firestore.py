"""
테스트용 인메모리 Firestore 대체 구현.

백엔드 서비스가 사용하는 Firestore API의 일부만 구현:
- collection(name).document(id).get() / set() / update() / delete()
- collection(name).where(field, '==', value) 체이닝, limit(n), stream()
- batch() 의 set / update / delete / commit
"""
import copy
from typing import Any, Dict, Optional


class FakeDocumentSnapshot:
    def __init__(self, reference: "FakeDocumentReference", data: Optional[Dict[str, Any]]):
        self.reference = reference
        self.id = reference.id
        self._data = data

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> Optional[Dict[str, Any]]:
        return copy.deepcopy(self._data) if self._data is not None else None


class FakeDocumentReference:
    def __init__(self, store: Dict[str, Dict[str, Any]], doc_id: str):
        self._store = store
        self.id = doc_id

    def get(self) -> FakeDocumentSnapshot:
        return FakeDocumentSnapshot(self, self._store.get(self.id))

    def set(self, data: Dict[str, Any]) -> None:
        self._store[self.id] = copy.deepcopy(data)

    def update(self, data: Dict[str, Any]) -> None:
        if self.id not in self._store:
            raise KeyError(f"No document to update: {self.id}")
        self._store[self.id].update(copy.deepcopy(data))

    def delete(self) -> None:
        self._store.pop(self.id, None)


class FakeQuery:
    def __init__(self, store: Dict[str, Dict[str, Any]], filters=None, limit_count: Optional[int] = None):
        self._store = store
        self._filters = filters or []
        self._limit = limit_count

    def where(self, field: str, op: str, value: Any) -> "FakeQuery":
        if op != '==':
            raise NotImplementedError(f"FakeFirestore only supports '==' filters, got {op!r}")
        return FakeQuery(self._store, self._filters + [(field, value)], self._limit)

    def limit(self, count: int) -> "FakeQuery":
        return FakeQuery(self._store, self._filters, count)

    def stream(self):
        matches = [
            doc_id for doc_id, data in list(self._store.items())
            if all(data.get(field) == value for field, value in self._filters)
        ]
        if self._limit is not None:
            matches = matches[:self._limit]
        for doc_id in matches:
            yield FakeDocumentReference(self._store, doc_id).get()


class FakeCollectionReference(FakeQuery):
    def __init__(self, store: Dict[str, Dict[str, Any]]):
        super().__init__(store)

    def document(self, doc_id: str) -> FakeDocumentReference:
        return FakeDocumentReference(self._store, doc_id)


class FakeWriteBatch:
    def __init__(self):
        self._ops = []

    def set(self, ref: FakeDocumentReference, data: Dict[str, Any]) -> None:
        self._ops.append(lambda: ref.set(data))

    def update(self, ref: FakeDocumentReference, data: Dict[str, Any]) -> None:
        self._ops.append(lambda: ref.update(data))

    def delete(self, ref: FakeDocumentReference) -> None:
        self._ops.append(ref.delete)

    def commit(self) -> None:
        for op in self._ops:
            op()
        self._ops = []


class FakeFirestore:
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def collection(self, name: str) -> FakeCollectionReference:
        return FakeCollectionReference(self._collections.setdefault(name, {}))

    def batch(self) -> FakeWriteBatch:
        return FakeWriteBatch()
