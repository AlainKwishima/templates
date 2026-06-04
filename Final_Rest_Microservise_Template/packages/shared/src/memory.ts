export type WithId = { id: string };

export function createMemoryStore<T extends WithId>(initial: T[] = []) {
  const items = [...initial];

  return {
    all: () => [...items],
    count: () => items.length,
    findById: (id: string) => items.find((item) => item.id === id) ?? null,
    findOne: (predicate: (item: T) => boolean) => items.find(predicate) ?? null,
    findMany: (predicate: (item: T) => boolean = () => true) => items.filter(predicate),
    create: (item: T) => {
      items.push(item);
      return item;
    },
    upsertById: (id: string, next: T) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        items.push(next);
      } else {
        items[index] = next;
      }
      return next;
    },
    updateById: (id: string, updater: (item: T) => T) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }

      const next = updater(items[index]);
      items[index] = next;
      return next;
    },
    deleteById: (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return false;
      }
      items.splice(index, 1);
      return true;
    },
    replaceAll: (nextItems: T[]) => {
      items.splice(0, items.length, ...nextItems);
    },
  };
}

