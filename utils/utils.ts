export const safeInt = (value: string|number|undefined): number|undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value as number;
  }

  return parseInt(value);
}

export const parameterOrExistingOrDefault = <DataType>(
  param: DataType|undefined, existing: DataType|undefined, defaultValue: DataType|undefined
): DataType|undefined => {
  if (param !== undefined) {
    return param;
  }
  if (existing !== undefined) {
    return existing;
  }
  return defaultValue;
};
