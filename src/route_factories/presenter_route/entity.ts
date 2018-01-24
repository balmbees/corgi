// So Entity must be wrapped in ClassValidator
export class Entity {}

import { Presenter } from "./presenter";

import * as ClassValidator from "class-validator";
import * as ClassValidatorJSONSchema from "class-validator-jsonschema";

export class EntityPresenterFactory {
  private static __schemas: any;
  public static schemas() {
    if (!this.__schemas) {
      const metadatas = (ClassValidator.getFromContainer(ClassValidator.MetadataStorage) as any).validationMetadatas;
      this.__schemas = ClassValidatorJSONSchema.validationMetadatasToSchemas(metadatas);
    }
    return this.__schemas;
  }

  public static create<Model, Entity>(inputClass: { new(): Model }, outputClass: { new(): Entity }, presentMethod: (input: Model) => Entity) {
    const presenter: Presenter<Model, Entity> = {
      outputJSONSchema: () => {
        const modelName = outputClass.name;
        const schema = this.schemas()[modelName];
        if (!schema) {
          throw new Error(`${modelName} must be decorated with ClassValidator`);
        }
        return schema;
      },
      present: presentMethod,
    };
    return presenter;
  }

  public static createArray<Model, Entity>(inputClass: { new(): Model }, outputClass: { new(): Entity }, presentMethod: (input: Model) => Entity[]) {
    const presenter: Presenter<Model, Entity[]> = {
      outputJSONSchema: () => {
        const modelName = outputClass.name;
        const schema = this.schemas()[modelName];
        if (!schema) {
          throw new Error(`${modelName} must be decorated with ClassValidator`);
        }
        return schema;
      },
      present: presentMethod,
    };
    return presenter;
  }
}
