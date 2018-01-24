import { Presenter } from "./presenter";

export class DataLayoutPresenter<Input, Output> implements Presenter<Input, { data: Output }> {
  private _outputJSONSchema = {
    type: "object",
    required: [
      "data",
    ],
    properties: {
      data: this.presenter.outputJSONSchema(),
    },
  }

  public outputJSONSchema() {
    return this._outputJSONSchema;
  }

  constructor(private presenter: Presenter<Input, Output>) {}

  public present(input: Input) {
    const output = this.presenter.present(input);
    return {
      data: output,
    };
  }
}