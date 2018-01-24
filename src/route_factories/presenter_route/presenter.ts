import { Entity, EntityArray } from "./entity";

export interface Presenter<Input, Output> {
  readonly outputJSONSchema: () => any;
  readonly present: (input: Input) => Output;
}

import * as Joi from "joi";
export class DataLayout<Input, Output> implements Presenter<Input, { data: Output }> {
  private _outputJSONSchema = Joi.object({
    data: Joi.array().items(this.presenter.outputJSONSchema)
  });
  public outputJSONSchema() {
    return this._outputJSONSchema;
  }

  constructor(private presenter: Presenter<Input, Output>) {
  }

  public present(input: Input) {
    const output = this.presenter.present(input);
    return {
      data: output,
    };
  }
}

