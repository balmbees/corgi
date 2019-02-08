import { Presenter } from "./presenter";

export class DataLayoutPresenter<Input, Output> implements Presenter<Input, { data: Output }> {
  // tslint:disable-next-line:variable-name
  private __outputJSONSchema = {
    type: "object",
    required: [
      "data",
    ],
    properties: {
      data: this.presenter.outputJSONSchema(),
    },
  };

  constructor(private presenter: Presenter<Input, Output>) {}

  public outputJSONSchema() {
    return this.__outputJSONSchema;
  }

  public async present(input: Input) {
    const output = await this.presenter.present(input);
    return {
      data: output,
    };
  }
}
