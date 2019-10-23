import { JSONSchema } from "../../route";

export interface Presenter<Input, Output> {
  readonly outputJSONSchema: () => JSONSchema | { $ref: string };
  readonly present: (input: Input) => Promise<Output> | Output;
}
