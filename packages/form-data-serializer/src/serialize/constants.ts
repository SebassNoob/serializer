export const DATA_KEY = "$data" as const;
export const FILE_HOLE_KEY = (id: string) => `$ref:${id}` as const;
export const EXTENSION_KEY = (name: string, id: string) => `$ext:${name}:${id}` as const;

export const REF_KEY_REGEX = /^\$ref:(.+)$/;
export const EXT_KEY_REGEX = /^\$ext:([^:]+):(.+)$/;
