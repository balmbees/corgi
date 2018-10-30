export class StandardError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly options: {
      code: string,
      message: string,
      metadata?: object,
    }
  ) {
    super()
  }
}

export interface StandardErrorResponseBody {
  error: {
    id?: string;
    /**
     * Developer readable code of error, such as "NOT_FOUND", "WRONG_PASSWORD" ...etc
     */
    code: string;
    /**
     * Developer readable metadata.
     */
    metadata?: object;
    /**
     * Human readable Error message, such as "You're not allowed to do this"
     */
    message: string;
  }
}

import * as crypto from "crypto";
const CipherAlgorithm = "aes-256-ctr";

export class ErrorResponseFormatter {
  // If Password is provided, it will show detailed information (encrypted)
  constructor(private password: string | undefined) {
    console.log("ErrorResponseFormatter : ", password);
  }

  public format(error: Error) {
    if (error instanceof StandardError) {
      return {
        code: error.options.code,
        message: error.options.message,
        metadata: error.options.metadata,
      };
    } else {
      // For Non-Standard error,
      return {
        code: error.name,
        message: error.message,
        metadata: (() => {
          console.log("Password : ", this.password);
          if (this.password) {
            const cipher = crypto.createCipher(CipherAlgorithm, this.password)
            return [
              cipher.update(JSON.stringify({
                name: error.name,
                message: error.message,
                stack: (error.stack || "").split("\n"),
              }), 'utf8', 'hex'),
              cipher.final('hex')
            ].join("");
          } else {
            // Otherwise don't show metadata for security
            return undefined;
          }
        })(),
      };
    }
  }

  public decryptErrorMetadata(message: string) {
    const decipher = crypto.createDecipher(CipherAlgorithm, this.password);
    const payload = JSON.parse([
      decipher.update(message, 'hex', 'utf8'),
      decipher.final('utf8'),
    ].join(""));
    return payload;
  }
}