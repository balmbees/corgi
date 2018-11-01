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

export class ErrorResponseFormatter {
  // If Password is provided, it will show detailed information (encrypted)
  constructor(private password: string | undefined) {}

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
        metadata: this.encryptErrorMetadata(error),
      };
    }
  }

  private static readonly CipherAlgorithm = "aes-128-cbc";

  public encryptErrorMetadata(error: Error) {
    if (this.password) {
      const iv = new Buffer(crypto.randomBytes(8)).toString("hex");
      const cipher = crypto.createCipheriv(ErrorResponseFormatter.CipherAlgorithm, this.password, iv);
      cipher.setEncoding("hex");
      cipher.write(JSON.stringify({
        name: error.name,
        message: error.message,
        stack: (error.stack || "").split("\n"),
      }));
      cipher.end();
      const cipherText = cipher.read();

      return cipherText + "$" + iv;
    } else {
      // Otherwise don't show metadata for security
      return undefined;
    }
  }

  public decryptErrorMetadata(message: string) {
    const [decipherText, iv] = message.split("$");
    const decipher = crypto.createDecipheriv(ErrorResponseFormatter.CipherAlgorithm, this.password, iv);
    const payload = JSON.parse([
      decipher.update(decipherText, 'hex', 'utf8'),
      decipher.final('utf8'),
    ].join(""));
    return payload;
  }
}