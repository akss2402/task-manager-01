export function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

