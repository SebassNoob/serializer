
type JSONPrimitive = 
  | string
  | number
  | boolean
  | null

type BaseSerializable<ExtensionType = never> = JSONPrimitive | Blob | ExtensionType;

export type Serializable<ExtensionType = never> = 
  | BaseSerializable<ExtensionType>
  | { [key: string]: Serializable<ExtensionType> }
  | Serializable<ExtensionType>[];

export interface SerializationExtension<T = any> {
  name: string;
  serialize: (value: T) => string | Blob;
  deserialize: (value: string | Blob) => T;
  canHandle: (value: unknown) => value is T;
}

export type ExtractExtensionTypes<T extends readonly SerializationExtension<any>[]> = 
  T extends readonly (infer U)[] 
    ? U extends SerializationExtension<infer V> 
      ? V 
      : never 
    : never;