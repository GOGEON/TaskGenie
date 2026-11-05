"""테스트용 인메모리 Firestore 대체 구현 (서비스에서 사용하는 API만 지원)."""
import uuid


class FakeSnapshot:
    def __init__(self, ref, data):
        self.reference = ref
        self.id = ref.id
        self._data = data

    @property
    def exists(self):
        return self._data is not None

    def to_dict(self):
        return dict(self._data) if self._data is not None else None


class FakeDocRef:
    def __init__(self, store, doc_id):
        self._store = store
        self.id = doc_id

    def get(self):
        return FakeSnapshot(self, self._store.get(self.id))

    def set(self, data):
        self._store[self.id] = dict(data)

    def update(self, data):
        self._store[self.id].update(data)

    def delete(self):
        self._store.pop(self.id, None)


class FakeQuery:
    def __init__(self, store, filters=(), limit=None):
        self._store = store
        self._filters = filters
        self._limit = limit

    def where(self, field, op, value):
        assert op == '==', 'only equality filters are supported'
        return FakeQuery(self._store, self._filters + ((field, value),), self._limit)

    def limit(self, n):
        return FakeQuery(self._store, self._filters, n)

    def stream(self):
        results = [
            FakeSnapshot(FakeDocRef(self._store, doc_id), data)
            for doc_id, data in list(self._store.items())
            if all(data.get(f) == v for f, v in self._filters)
        ]
        return iter(results[: self._limit] if self._limit else results)


class FakeCollection(FakeQuery):
    def document(self, doc_id=None):
        return FakeDocRef(self._store, doc_id or str(uuid.uuid4()))


class FakeBatch:
    def __init__(self):
        self._ops = []

    def set(self, ref, data):
        self._ops.append(lambda: ref.set(data))

    def update(self, ref, data):
        self._ops.append(lambda: ref.update(data))

    def delete(self, ref):
        self._ops.append(ref.delete)

    def commit(self):
        for op in self._ops:
            op()


class FakeFirestore:
    def __init__(self):
        self.data = {}

    def collection(self, name):
        return FakeCollection(self.data.setdefault(name, {}))

    def batch(self):
        return FakeBatch()
