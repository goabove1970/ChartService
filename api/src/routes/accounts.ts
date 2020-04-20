import { Router } from 'express';

import { AccountError } from '@models/errors/errors';
import { DeepPartial } from '@models/DeepPartial';
import accountController from '@controllers/account-controller';
import { AccountResponse, AccountRequest } from './request-types/AccountRequests';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { UserAccount } from '@models/accounts/Account';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';

const router = Router();

router.post('/', process);
router.get('/', process);

async function process(req, res, next) {
    console.log(`Received a request in account controller: ${JSON.stringify(req.body, null, 4)}`);
    const accountRequest = req.body as AccountRequest;
    if (!accountRequest) {
        return res.status(500).send(new AccountError());
    }

    let responseData: AccountResponse = {};

    switch (accountRequest.action) {
        case 'read-accounts':
            responseData = await processReadAccountsRequest(accountRequest.args);
            break;
        case 'create-account':
            responseData = await processCreateAccountRequest(accountRequest.args);
            break;
        case 'delete-account':
            responseData = await processDeleteAccountRequest(accountRequest.args);
            break;
        case 'update-account':
            responseData = await processUpdateAccountRequest(accountRequest.args);
            break;
        default:
            return res.status(500).send(new AccountError(`Unknown account request type: ${accountRequest.action}`));
    }

    res.send(responseData);
}

async function processReadAccountsRequest(args: ReadAccountArgs): Promise<AccountResponse> {
    console.log(`Processing read-account request`);
    const response: AccountResponse = {
        action: 'read-accounts',
        payload: {},
    };

    try {
        return await accountController
            .read({
                status: args.status,
                userId: args.userId,
                accountId: args.accountId,
            })
            .then((res: DeepPartial<UserAccount>[]) => {
                response.payload = {
                    count: res.length,
                    accounts: res,
                };
                return response;
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processCreateAccountRequest(request: AccountCreateArgs): Promise<AccountResponse> {
    console.log(`Processing create-account request`);
    const response: AccountResponse = {
        action: 'create-account',
        payload: {},
    };

    try {
        return await accountController
            .create(request)
            .then((accountId) => {
                response.payload = {
                    accountId,
                };
                return response;
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processDeleteAccountRequest(request: AccountDeleteArgs): Promise<AccountResponse> {
    console.log(`Processing delete-account request`);
    const response: AccountResponse = {
        action: 'delete-account',
        payload: {},
    };

    try {
        return await accountController
            .delete(request)
            .then(() => {
                response.payload = {
                    accountId: request.accountId,
                };
                return response;
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processUpdateAccountRequest(request: AccountUpdateArgs): Promise<AccountResponse> {
    console.log(`Processing update-account request`);
    const response: AccountResponse = {
        action: 'update-account',
        payload: {},
    };
    try {
        return await accountController
            .update(request)
            .then(() => {
                response.payload = {
                    accountId: request.accountId,
                };
                return response;
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
