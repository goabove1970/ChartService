import pool from './database/PgPool';
import { Value, Result } from 'ts-postgres';
import { CONFIG } from '@root/app.config';

export abstract class DataController<T> {}

export abstract class DatabaseController<T> extends DataController<T> {
    tableName: string;
    constructor(table: string) {
        super();
        this.tableName = table;
    }

    abstract readSelectResponse(values: Value[][]): T[];

    query(query?: string): Promise<Result> {
        return pool.query(query);
    }

    delete(where?: string): Promise<Result> {
        return pool.query(`DELETE FROM ${CONFIG.PgConfig.schema}.${this.tableName} ${where}`);
    }

    select(where?: string): Promise<T[]> {
        return pool.query(`SELECT * FROM ${CONFIG.PgConfig.schema}.${this.tableName} ${where}`).then((value) => {
            const { rows } = value;
            const categories = this.readSelectResponse(rows);
            return categories;
        });
    }

    update(where?: string): Promise<Result> {
        return pool.query(`UPDATE ${CONFIG.PgConfig.schema}.${this.tableName} ${where}`);
    }

    insert(where?: string): Promise<Result> {
        return pool.query(`INSERT INTO ${CONFIG.PgConfig.schema}.${this.tableName} ${where}`);
    }
}
