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

  private static outputJSONSchemaMap = new Map<any, any>();

  public static create<Model, Entity>(outputClass: { new(): Entity }, presentMethod: (input: Model) => Entity) {
    const presenter: Presenter<Model, Entity> = {
      outputJSONSchema: () => {
        const modelName = outputClass.name;
        let schema = this.outputJSONSchemaMap.get(modelName);
        if (!schema) {
          schema = this.schemas()[modelName];
          if (!schema) {
            throw new Error(`${modelName} must be decorated with ClassValidator`);
          }
          this.outputJSONSchemaMap.set(modelName, schema);
        }
        return schema;
      },
      present: presentMethod,
    };
    return presenter;
  }

  public static createArray<Model, Entity>(outputClass: { new(): Entity }, presentMethod: (input: Model) => Entity[]) {
    const presenter: Presenter<Model, Entity[]> = {
      outputJSONSchema: () => {
        const modelName = outputClass.name;
        const storeName = `${modelName}List`;
        let schema = this.outputJSONSchemaMap.get(storeName);
        if (!schema) {
          schema = this.schemas()[modelName];
          if (!schema) {
            throw new Error(`${modelName} must be decorated with ClassValidator`);
          }
          schema = {
            "type": "array",
            "items": schema
          };
          this.outputJSONSchemaMap.set(storeName, schema);
        }
        return schema;
      },
      present: presentMethod,
    };
    return presenter;
  }
}
