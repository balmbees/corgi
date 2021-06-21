import { Presenter } from "./presenter";

export interface PagingEntity {
  before?: string;
  after?: string;
  total?: number;
}

export interface PaginatedInput<DataInput> {
  data: DataInput;
  paging: PagingEntity;
}

export interface PaginatedOutput<DataOutput> {
  data: DataOutput;
  paging: PagingEntity;
}

// tslint:disable-next-line
export class PageableDataLayoutPresenter<DataInput, DataOutput> implements Presenter<PaginatedInput<DataInput>, PaginatedOutput<DataOutput>> {
  private _outputJSONSchema = { // tslint:disable-line
    type: "object",
    required: [
      "data",
      "paging",
    ],
    properties: {
      data: this.presenter.outputJSONSchema(),
      paging: {
        type: "object",
        properties: {
          before: {
            type: "string",
          },
          after: {
            type: "string",
          },
        },
      },
    },
  };

  constructor(
    private presenter: Presenter<DataInput, DataOutput>,
  ) {}

  public outputJSONSchema() {
    return this._outputJSONSchema;
  }

  public async present(input: PaginatedInput<DataInput>) {
    const dataOutput = await this.presenter.present(input.data);

    return {
      data: dataOutput,
      paging: input.paging,
    };
  }
}
