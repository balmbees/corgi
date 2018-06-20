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
