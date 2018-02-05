import { Presenter } from "./presenter";

export interface PagingEntity {
  after: string;
}

export interface PaginatedInput<DataInput> {
  value: DataInput;
  paging: PagingEntity;
}

export interface PaginatedOutput<DataOutput> {
  data: DataOutput;
  paging: PagingEntity;
}

// tslint:disable-next-line
export class PageableDataLayoutPresenter<DataInput, DataOutput> implements Presenter<PaginatedInput<DataInput>, PaginatedOutput<DataOutput>> {
  public static schemas() {
    return this._schemas;
  }

  private static _schemas: any = { // tslint:disable-line
    PagingEntity: {
      type: "object",
      required: [
        "after",
      ],
      properties: {
        after: {
          type: "string",
        },
      },
    },
  };

  private _outputJSONSchema = { // tslint:disable-line
    type: "object",
    required: [
      "data",
      "paging",
    ],
    properties: {
      data: this.presenter.outputJSONSchema(),
      paging: {
        $ref: "#/definitions/PagingEntity",
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
    const dataOutput = await this.presenter.present(input.value);

    return {
      data: dataOutput,
      paging: input.paging,
    };
  }
}
