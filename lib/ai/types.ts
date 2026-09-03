export interface JsonCompleteArgs {
  system: string;
  prompt: string;
  image?: { base64: string; mime: string };
  /** Optional back-view photo — improves analysis of two-sided products. */
  imageBack?: { base64: string; mime: string };
}

export interface LLMProvider {
  name: string;
  /** Ask the model to return a single JSON object. Implementations must
   *  enforce JSON output mode where available. */
  jsonComplete(args: JsonCompleteArgs): Promise<unknown>;
}

export function newError(message: string): Error {
  return new Error(message);
}
