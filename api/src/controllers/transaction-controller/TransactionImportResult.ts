export interface TransactionImportResult {
    parsed: number;
    duplicates: number;
    newTransactions: number;
    businessRecognized: number;
    multipleBusinessesMatched: number;
    unrecognized: number;
    unposted: number;
}
