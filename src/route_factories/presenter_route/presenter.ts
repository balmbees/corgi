export interface Presenter<Input, Output> {
  readonly outputJSONSchema: () => any;
  readonly present: (input: Input) => Output;
}
