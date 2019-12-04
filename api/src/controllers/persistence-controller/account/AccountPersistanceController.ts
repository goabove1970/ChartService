import { AccountPersistanceControllerBase } from './AccountPersistanceControllerBase';
import { DeepPartial } from '@models/DeepPartial';
import {
    matchesReadArgs,
    validateCreateAccountArgs,
    combineNewAccount,
    validateAccountUpdateArgs,
    toShortAccountDetails,
} from './helper';
import { UserAccount } from '@models/accounts/Account';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountStatus } from '@models/accounts/AccountStatus';
import { DatabaseController } from '../../data-controller/DataController';
import { DatabaseError } from '@root/src/models/errors/errors';
import { accountPostgresDataController } from '../../data-controller/account/AccountPostgresController';
import moment = require('moment');

export class AccountPersistanceController implements AccountPersistanceControllerBase {
    private dataController: DatabaseController<UserAccount>;

    constructor(controller: DatabaseController<UserAccount>) {
        this.dataController = controller;
    }

    private findAccountImpl(accountId: string): Promise<UserAccount | undefined> {
        return this.dataController
            .select(`WHERE account_id='${accountId}'`)
            .then((c) => {
                {
                    return c && c.length > 0 ? c[0] : undefined;
                }
            })
            .catch((error) => {
                throw error;
            });
    }

    read(args: ReadAccountArgs): Promise<DeepPartial<UserAccount>[]> {
        return this.dataController
            .select(matchesReadArgs(args))
            .then((c) => c.map(toShortAccountDetails))
            .catch((error) => {
                throw error;
            });
    }

    create(args: AccountCreateArgs): Promise<string> {
        const a = combineNewAccount(args);
        return validateCreateAccountArgs(args)
            .then(() => {
                return this.dataController.insert(`
                (
                    account_id, bank_routing_number, bank_account_number,
                    bank_name, create_date, status, service_comment, account_type)
                    VALUES (
                        '${a.accountId}', 
                        ${a.bankRoutingNumber},
                        ${a.bankAccountNumber},
                        ${a.bankName ? "'" + a.bankName + "'" : 'NULL'},
                        ${a.createDate ? "'" + moment(a.createDate).toISOString() + "'" : 'NULL'},
                        ${a.status ? a.status : 'NULL'},
                        ${a.serviceComment ? "'" + a.serviceComment + "'" : 'NULL'},
                        ${a.accountType ? a.accountType : 'NULL'});`);
            })
            .then(() => {
                return a.accountId;
            })
            .catch((error) => {
                throw error;
            });
    }

    update(args: AccountUpdateArgs): Promise<void> {
        return validateAccountUpdateArgs(args)
            .then(() => {
                return this.findAccountImpl(args.accountId);
            })
            .then((account) => {
                if (!account) {
                    throw new DatabaseError('Error updating account data, could not find account record');
                }
                if (!(account.status & AccountStatus.Active) && !args.forceUpdate) {
                    throw new DatabaseError('Error updating account data, user bank account is inactive');
                }
                return account;
            })
            .then((account) => {
                if (args.userId) {
                    account.userId = args.userId;
                }
                if (args.bankRoutingNumber) {
                    account.bankRoutingNumber = args.bankRoutingNumber;
                }
                if (args.bankAccountNumber) {
                    account.bankAccountNumber = args.bankAccountNumber;
                }
                if (args.bankName) {
                    account.bankName = args.bankName;
                }
                if (args.status) {
                    account.status = args.status;
                }
                return account;
            })
            .then((account) => {
                this.dataController.update(this.composeSetStatement(account));
            })
            .catch((error) => {
                throw error;
            });
    }

    private composeSetStatement(a: UserAccount): string {
        return `
        SET
            bank_routing_number=${a.bankRoutingNumber},
            bank_account_number=${a.bankAccountNumber},
            bank_name='${a.bankName}',
            create_date=${a.createDate ? "'" + moment(a.createDate).toISOString() + "'" : 'NULL'},
            status=${a.status ? a.status : 'NULL'},
            service_comment=${a.serviceComment ? "'" + a.serviceComment + "'" : 'NULL'},
            account_type=${a.accountType ? a.accountType : 'NULL'}
        WHERE
            account_id='${a.accountId}';`;
    }

    delete(args: AccountDeleteArgs): Promise<void> {
        const { accountId, serviceComment, deleteRecord } = args;
        return this.findAccountImpl(accountId)
            .then((a) => {
                if (!a) {
                    throw new DatabaseError('Error deleting account, could not find bank account record');
                }
                if (deleteRecord) {
                    return this.dataController.delete(`where "account_id"='${accountId}'`).then(() => {});
                } else {
                    a.serviceComment = a.serviceComment + `; ${serviceComment}`;
                    a.status = a.status & AccountStatus.Deactivated;
                    return this.dataController.update(this.composeSetStatement(a)).then(() => {});
                }
            })
            .catch((error) => {
                throw error;
            });
    }
}

export const accountPersistanceController = new AccountPersistanceController(accountPostgresDataController);
