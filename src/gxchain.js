const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const {table, getBorderCharacters} = require('table');
const superagent = require('superagent');
const {Apis} = require('./lib/gxbjs-ws/cjs');
const TimeAgo = require('timeago.js');
const util = require('./util');
const ChainTypes = require('./chain/types');
const TxTypes = require('./chain/TxTypes');
const ops = Object.keys(ChainTypes.operations);
const account_listing = {
    no_listing: 0,
    white_listed: 1,
    black_listed: 2,
    white_and_black_listed: 1 | 2
};
const listings = Object.keys(account_listing);
const BLOCK_APIURL = 'https://block.gxb.io/api';
const WALLET_APIURL = 'https://wallet.gxb.io/statistics/gxchain';
const WS_URL = 'wss://node18.gxb.io';

class GXChain {

    /**
     * 获取账号信息
     *
     * @static
     * @param {*} id_or_name
     * @memberof GXChain
     */
    static async getAccountInfo (id_or_name) {
        try {
            let resp = await superagent.get(`${BLOCK_APIURL}/account/${id_or_name}`).send();
            let info = resp.body;
            GXChain._displayAccountInfo(info);
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop();
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示账号信息
     *
     * @static
     * @param {*} info
     * @memberof GXChain
     */
    static async _displayAccountInfo (info) {
        if (info && info.account) {
            let account = info.account;
            let balances = info.balances;
            let basicOutput = '';
            let permissionsOutput = '';
            let balancesOutput = '';
            if (account) {
                let referrerInfo = await superagent.get(`${BLOCK_APIURL}/account/${account.referrer}`).send();
                let basicData = [
                    ['账号名', account.name],
                    ['账号ID', account.id],
                    ['推荐人', referrerInfo.body.account.name + `(${account.referrer})`],
                    ['账号类型', GXChain._getAccountType(account)]
                ];
                basicOutput = table(basicData, {
                    border: getBorderCharacters(`ramac`)
                });
                let permissionsData = [
                    ['活跃权限', '阈值'],
                    [account.active.key_auths[0][0], account.active.key_auths[0][1]],
                    ['账户权限', '阈值'],
                    [account.owner.key_auths[0][0], account.owner.key_auths[0][1]]
                ];
                permissionsOutput = table(permissionsData, {
                    border: getBorderCharacters(`ramac`)
                });
            }
            if (balances) {
                let assets = await GXChain._getAssets();
                let assetsMap = {};
                assets.forEach(asset => {
                    assetsMap[asset.id] = asset;
                });
                let balancesData = [
                    ['资产', '余额']
                ];
                balances.forEach(balance => {
                    balancesData.push([assetsMap[balance.asset_type].symbol, util.number((balance.balance / 100000).toFixed(5), 5)]);
                });
                balancesOutput = table(balancesData, {
                    border: getBorderCharacters(`ramac`)
                });
            }
            let history = await GXChain.getAccountHistory(account.id);
            let historyData = await GXChain._formatHistory(history);
            historyData = table(historyData, {
                border: getBorderCharacters(`ramac`)
            });
            if (process.spinner) {
                process.spinner.stop();
            }
            console.log(chalk.green('\n' + chalk.bold('[基本信息]') + '\n' + basicOutput + '\n' + chalk.bold('[权限]') + '\n' + permissionsOutput + '\n' + chalk.bold('[账户余额]') + '\n' + balancesOutput + '\n' + chalk.bold('[最近交易记录]') + '\n' + historyData));
        } else {
            if (process.spinner) {
                process.spinner.stop();
            }
            console.log(chalk.green('\n' + chalk.bold('未查询到账户信息') + '\n'));
        }
    }

    /**
     * 获取账号历史信息
     *
     * @static
     * @param {*} accountId
     * @returns
     * @memberof GXChain
     */
    static async getAccountHistory (accountId) {
        let res = await Apis.instance(WS_URL, true).init_promise;
        if (res[0].network) {
            let history = await Apis.instance().history_api().exec('get_account_history', [accountId, '1.11.0', 100, '1.11.0']);
            let blockInfo = await Apis.instance().db_api().exec('get_objects', [['2.0.0', '2.1.0']]);
            let blockInterval = blockInfo[0].parameters.block_interval;
            let headBlockNumber = blockInfo[1].head_block_number;
            let headBlockTime = new Date(blockInfo[1].time + '+00:00');
            history = history.map((item) => {
                item.op.timestamp = GXChain._calcBlockTime(item.block_num, blockInterval, headBlockNumber, headBlockTime);
                return item;
            });
            Apis.close();
            return history;
        }
    }

    /**
     * 计算交易时间
     *
     * @static
     * @param {*} blockNumber
     * @param {*} blockInterval
     * @param {*} headBlock
     * @param {*} headBlockTime
     * @returns
     * @memberof GXChain
     */
    static _calcBlockTime (blockNumber, blockInterval, headBlock, headBlockTime) {
        let secondsBelow = (headBlock - blockNumber) * blockInterval;
        return new Date(headBlockTime - secondsBelow * 1000);
    }

    /**
     * 格式化交易内容
     *
     * @static
     * @param {*} history
     * @returns
     * @memberof GXChain
     */
    static async _formatHistory (history) {
        let historyData = [
            ['类型', '内容', '时间']
        ];
        let res = await Apis.instance(WS_URL, true).init_promise;
        let formatItem;
        if (res[0].network) {
            formatItem = async (item) => {
                let type = ops[item.op[0]];
                switch (type) {
                    case 'transfer': // 0
                        let from = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].from}`).send();
                        let to = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].to}`).send();
                        let asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].amount.asset_id]]);
                        let amount = util.number(item.op[1].amount.amount / Math.pow(10, asset[0].precision), asset[0].precision);
                        return [TxTypes[type].name, `${from.body.account.name} 发送 ${amount} ${asset[0].symbol} 到 ${to.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'limit_order_create': // 1
                    case 'limit_order_create': // 2
                    case 'call_order_update': // 3
                    case 'fill_order': // 4
                    case 'asset_update': // 11
                    case 'asset_update_bitasset': // 12
                    case 'asset_update_feed_producers': // 13
                    case 'asset_reserve': // 15
                    case 'asset_fund_fee_pool': // 16
                    case 'asset_settle': // 17
                    case 'asset_global_settle': // 18
                    case 'asset_publish_feed': // 19
                    case 'witness_create': // 20
                    case 'witness_update': // 21
                    case 'withdraw_permission_create': // 25
                    case 'withdraw_permission_update': // 26
                    case 'withdraw_permission_claim': // 27
                    case 'withdraw_permission_delete': // 28
                    case 'committee_member_create': // 29
                    case 'committee_member_update': // 30
                    case 'committee_member_update_global_parameters': // 31
                    case 'vesting_balance_create': // 32
                    case 'worker_create': // 34
                    case 'assert': // 36
                    case 'balance_claim': // 37
                    case 'transfer_to_blind': // 39
                    case 'blind_transfer': // 40
                    case 'transfer_from_blind': // 41
                    case 'asset_settle_cancel': // 42
                    case 'asset_claim_fees': // 43
                    case 'fba_distribute': // 44
                        return [TxTypes[type].name, '-', new TimeAgo().format(item.op.timestamp)];
                    case 'account_create': // 5
                        let registrar = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].registrar}`).send();
                        let name = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].name}`).send();
                        return [TxTypes[type].name, `${registrar.body.account.name} 注册了账户 ${name.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'account_update': // 6
                        let account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account}`).send();
                        return [TxTypes[type].name, `${account.body.account.name} 更新了账户信息`, new TimeAgo().format(item.op.timestamp)];
                    case 'account_whitelist': // 7
                        let authorizing_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].authorizing_account}`).send();
                        let account_to_list = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_to_list}`).send();
                        if (item.op[1].new_listing === listings.no_listing) {
                            return [TxTypes[type].name, `${authorizing_account.body.account.name} 将 ${account_to_list.body.account.name} 移出清单`, new TimeAgo().format(item.op.timestamp)];
                        }
                        if (item.op[1].new_listing === listings.white_listed) {
                            return [TxTypes[type].name, `${authorizing_account.body.account.name} 将 ${account_to_list.body.account.name} 加入白名单`, new TimeAgo().format(item.op.timestamp)];
                        }
                        if (item.op[1].new_listing === listings.black_listed) {
                            return [TxTypes[type].name, `${authorizing_account.body.account.name} 将 ${account_to_list.body.account.name} 加入黑名单`, new TimeAgo().format(item.op.timestamp)];
                        }
                    case 'account_upgrade': // 8
                        let account_to_upgrade = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_to_upgrade}`).send();
                        if (item.op[1].upgrade_to_lifetime_member) {
                            return [TxTypes[type].name, `${account_to_upgrade.body.account.name} 升级到终身会员`, new TimeAgo().format(item.op.timestamp)];
                        } else {
                            return [TxTypes[type].name, `${account_to_upgrade.body.account.name} 升级到年度会员`, new TimeAgo().format(item.op.timestamp)];
                        }
                    case 'account_transfer': // 9
                        let account_id = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_id}`).send();
                        let new_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].new_account}`).send();
                        return [TxTypes[type].name, `${account_id.body.account.name} 转移了账户 ${new_account.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'asset_create': // 10
                        let issuer = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${issuer.body.account.name} 创建了资产 ${item.op[1].symbol}`, new TimeAgo().format(item.op.timestamp)];
                    case 'asset_issue': // 14
                        let asset_issue_issuer = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        let asset_issue_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].asset_to_issue.asset_id]]);
                        let asset_issue_amount = util.number(item.op[1].asset_to_issue.amount / Math.pow(10, asset_issue_asset[0].precision), asset_issue_asset[0].precision);
                        let issue_to_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issue_to_account}`).send();
                        return [TxTypes[type].name, `${asset_issue_issuer.body.account.name} 发行了 ${asset_issue_amount}${asset_issue_asset[0].symbol} ${issue_to_account.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'proposal_create': // 22
                        let fee_paying_account1 = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].fee_paying_account}`).send();
                        return [TxTypes['proposal'].proposal_create, `${fee_paying_account1.body.account.name} 创建了拟议交易`, new TimeAgo().format(item.op.timestamp)];
                    case 'proposal_update': // 23
                        let fee_paying_account2 = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].fee_paying_account}`).send();
                        return [TxTypes['proposal'].proposal_update, `${fee_paying_account2.body.account.name} 更新了拟议交易`, new TimeAgo().format(item.op.timestamp)];
                    case 'proposal_delete': // 24
                        let fee_paying_account3 = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].fee_paying_account}`).send();
                        return [TxTypes['proposal'].proposal_delete, `${fee_paying_account3.body.account.name} 删除了拟议交易`, new TimeAgo().format(item.op.timestamp)];
                    case 'vesting_balance_withdraw': // 33
                        let vesting_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].owner}`).send();
                        let vesting_account_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].amount.asset_id]]);
                        let vesting_account_amount = util.number(item.op[1].amount.amount / Math.pow(10, vesting_account_asset[0].precision), vesting_account_asset[0].precision);
                        return [TxTypes[type].name, `${vesting_account.body.account.name} 提取了解冻金额 ${vesting_account_amount}${vesting_account_asset[0].symbol}`, new TimeAgo().format(item.op.timestamp)];
                    case 'custom': // 35
                        let payer = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].payer}`).send();
                        return [TxTypes[type].name, `${payer.body.account.name} 创建了一笔自定义操作`, new TimeAgo().format(item.op.timestamp)];
                    case 'override_transfer': // 38
                        let override_transfer_issuer = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        let override_transfer_from = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].from}`).send();
                        let override_transfer_to = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].to}`).send();
                        let override_transfer_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].amount.asset_id]]);
                        let voverride_transfer_amount = util.number(item.op[1].amount.amount / Math.pow(10, override_transfer_asset[0].precision), override_transfer_asset[0].precision);
                        return [TxTypes[type].name, `${override_transfer_issuer.body.account.name} 从 ${override_transfer_from.body.account.name} 到 ${override_transfer_to.body.account.name} 发送 ${voverride_transfer_amount}${override_transfer_asset[0].symbol}`, new TimeAgo().format(item.op.timestamp)];
                    case 'account_upgrade_merchant': // 45
                        let account_upgrade_merchant = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_to_upgrade}`).send();
                        return [TxTypes[type].name, `${account_upgrade_merchant.body.account.name} 认证为商户`, new TimeAgo().format(item.op.timestamp)];
                    case 'account_upgrade_datasource': // 46
                        let account_upgrade_datasource = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_to_upgrade}`).send();
                        return [TxTypes[type].name, `${account_upgrade_datasource.body.account.name} 认证为数据源`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_data_market_category_create': // 47
                        let stale_data_market_category_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${stale_data_market_category_create.body.account.name} 创建了类目 ${item.op[1].category_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_data_market_category_update': // 48
                        let stale_data_market_category_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${stale_data_market_category_update.body.account.name} 决议通过并更新了类目 ${item.op[1].new_category_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_free_data_product_create': // 49
                        let stale_free_data_product_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${stale_free_data_product_create.body.account.name} 创建了自由市场数据产品 ${item.op[1].product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_free_data_product_update': // 50
                        let stale_free_data_product_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${stale_free_data_product_update.body.account.name} 决议通过并更新了自由市场数据产品  ${item.op[1].new_product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_league_data_product_create': // 51
                        let stale_league_data_product_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${stale_league_data_product_create.body.account.name} 创建了联盟数据产品 ${item.op[1].product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_league_data_product_update': // 52
                        let stale_league_data_product_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${stale_league_data_product_update.body.account.name} 决议通过并更新了联盟数据产品  ${item.op[1].new_product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_league_create': // 53
                        let stale_league_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${stale_league_create.body.account.name} 创建了联盟 ${item.op[1].league_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'stale_league_update': // 54
                        let stale_league_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${stale_league_update.body.account.name} 决议通过并更新了联盟 ${item.op[1].new_league_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_transaction_create': // 55
                        let requester = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].requester}`).send();
                        return [TxTypes[type].name, `${requester.body.account.name} 发起了一笔数据交易请求`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_transaction_update': // 56
                        let new_requester = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].new_requester}`).send();
                        return [TxTypes[type].name, `${new_requester.body.account.name} 更新了一笔数据交易请求状态`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_transaction_pay': // 57
                        let data_transaction_pay_from = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].from}`).send();
                        let data_transaction_pay_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].amount.asset_id]]);
                        let data_transaction_pay_amount = util.number(item.op[1].amount.amount / Math.pow(10, data_transaction_pay_asset[0].precision), data_transaction_pay_asset[0].precision);
                        let data_transaction_pay_to = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].to}`).send();
                        return [TxTypes[type].name, `${data_transaction_pay_from.body.account.name} 支付金额为 ${data_transaction_pay_amount} ${data_transaction_pay_asset[0].symbol} 的数据购买费用到 ${data_transaction_pay_to.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'account_upgrade_data_transaction_member': // 58
                        let account_upgrade_data_transaction_member = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account_to_upgrade}`).send();
                        return [TxTypes[type].name, `${account_upgrade_data_transaction_member.body.account.name} 升级为交易确认节点`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_transaction_datasource_upload': // 59
                        let data_transaction_datasource_upload_requester = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].requester}`).send();
                        let data_transaction_datasource_upload_datasource = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].datasource}`).send();
                        return [TxTypes[type].name, `${data_transaction_datasource_upload_requester.body.account.name} 验证了数据源 ${data_transaction_datasource_upload_datasource.body.account.name} 的数据上传`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_transaction_datasource_validate_error': // 60
                        let datasource = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].datasource}`).send();
                        return [TxTypes[type].name, `${datasource.body.account.name} 数据返回验证失败`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_market_category_create': // 61
                        let data_market_category_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${data_market_category_create.body.account.name} 创建了类目 ${item.op[1].category_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'data_market_category_update': // 62
                        let data_market_category_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${data_market_category_update.body.account.name} 决议通过并更新了类目 ${item.op[1].new_category_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'free_data_product_create': // 63
                        let free_data_product_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${free_data_product_create.body.account.name} 创建了自由市场数据产品 ${item.op[1].product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'free_data_product_update': // 64
                        let free_data_product_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${free_data_product_update.body.account.name} 决议通过并更新了自由市场数据产品 ${item.op[1].new_product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'league_data_product_create': // 65
                        let league_data_product_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${league_data_product_create.body.account.name} 创建了联盟数据产品 ${item.op[1].product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'league_data_product_update': // 66
                        let league_data_product_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${league_data_product_update.body.account.name} 决议通过并更新了联盟数据产品 ${item.op[1].new_product_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'league_create': // 67
                        let league_create = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].issuer}`).send();
                        return [TxTypes[type].name, `${league_create.body.account.name} 创建了联盟 ${item.op[1].league_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'league_update': // 68
                        let league_update = await superagent.get(`${BLOCK_APIURL}/account/1.2.0`).send();
                        return [TxTypes[type].name, `${league_update.body.account.name} 决议通过并更新了联盟 ${item.op[1].new_league_name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'balance_lock': // 71
                        let balance_lock_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1]['account']}`).send();
                        let balance_lock_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].amount.asset_id]]);
                        let balance_lock_amount = util.number(item.op[1].amount.amount / Math.pow(10, balance_lock_asset[0].precision), balance_lock_asset[0].precision);
                        return [TxTypes[type].name, `${balance_lock_account.body.account.name} 参与忠诚计划，冻结了 ${balance_lock_amount}${balance_lock_asset[0].symbol}`, new TimeAgo().format(item.op.timestamp)];
                    case 'balance_unlock': // 72
                        let balance_unlock_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1]['account']}`).send();
                        return [TxTypes[type].name, `${balance_unlock_account.body.account.name} 完成一笔忠诚计划余额解冻操作`, new TimeAgo().format(item.op.timestamp)];
                    case 'proxy_transfer': // 73
                        let proxy_transfer_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].request_params.proxy_account}`).send();
                        let proxy_transfer_from = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].request_params.from}`).send();
                        let proxy_transfer_to = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].request_params.to}`).send();
                        let proxy_transfer_asset = await Apis.instance().db_api().exec('get_objects', [[item.op[1].request_params.amount.asset_id]]);
                        let proxy_transfer_amount = util.number(item.op[1].request_params.amount.amount / Math.pow(10, proxy_transfer_asset[0].precision), proxy_transfer_asset[0].precision);
                        return [TxTypes[type].name, `${proxy_transfer_account.body.account.name} 发起了一笔代理转账交易: ${proxy_transfer_from.body.account.name} 发送 ${proxy_transfer_amount} ${proxy_transfer_asset[0].symbol} 到 ${proxy_transfer_to.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'create_contract': // 74
                        let create_contract_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account}`).send();
                        return [TxTypes[type].name, `${create_contract_account.body.account.name} 创建了智能合约 ${item.op[1].name}`, new TimeAgo().format(item.op.timestamp)];
                    case 'call_contract': // 75
                        let call_contract_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].account}`).send();
                        let contract_id = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].contract_id}`).send();
                        return [TxTypes[type].name, `${call_contract_account.body.account.name} 调用了智能合约 ${contract_id.body.account.name} 的 ${item.op[1].method_name} 方法`, new TimeAgo().format(item.op.timestamp)];
                    case 'update_contract': // 76
                        let update_contract_account = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].owner}`).send();
                        let update_contract = await superagent.get(`${BLOCK_APIURL}/account/${item.op[1].contract}`).send();
                        return [TxTypes[type].name, `${update_contract_account.body.account.name} 更新了智能合约 ${update_contract.body.account.name}`, new TimeAgo().format(item.op.timestamp)];
                    default:
                        return ['-', '-', '-'];
                }
            }
        }
        let promises = history.map(item => formatItem(item));
        for (let promise of promises) {
            let result = await promise;
            historyData.push(result);
        }
        Apis.close();
        return historyData;
    }

    /**
     * 获取账号类型
     *
     * @static
     * @param {*} accountInfo
     * @returns
     * @memberof GXChain
     */
    static _getAccountType (accountInfo) {
        let result = '';
        if (accountInfo.membership_expiration_date !== '1970-01-01T00:00:00') {
            result = '终身会员';
        } else {
            result = '普通会员';
        }
        if (accountInfo.merchant_expiration_date !== '1970-01-01T00:00:00') {
            result = '认证商户';
        }
        if (accountInfo.datasource_expiration_date !== '1970-01-01T00:00:00') {
            result = '认证数据源';
        }
        if (accountInfo.data_transaction_member_expiration_date !== '1970-01-01T00:00:00') {
            result = '认证交易节点';
        }
        return result;
    }

    /**
     * 获取链上资产
     *
     * @static
     * @returns
     * @memberof GXChain
     */
    static async _getAssets () {
        let resp = await superagent.get(`${BLOCK_APIURL}/assets`).send();
        let assets = resp.body;
        return assets;
    }

    /**
     * 获取链上资产
     *
     * @static
     * @returns
     * @memberof GXChain
     */
    static async getAssetsInfo () {
        try {
            let assets = await GXChain._getAssets();
            GXChain._displayAssetsInfo(assets);
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop();
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示链上资产
     *
     * @static
     * @memberof GXChain
     */
    static _displayAssetsInfo (assets) {
        let output = '';
        let data = [
            ['资产', '发行人', '当前供给']
        ];
        assets.forEach((item) => {
            let arr = [item.symbol, item.issuer.name, util.number(item.detail.current_supply / Math.pow(10, item.precision), item.precision)];
            data.push(arr);
        });
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[GXChain 资产]') + '\n' + output));
    }

    /**
     * 获取某个资产信息
     *
     * @static
     * @param {*} symbol
     * @memberof GXChain
     */
    static async getAssetInfo (symbol) {
        try {
            let resp = await superagent.get(`${BLOCK_APIURL}/asset/${symbol.toUpperCase()}`).send();
            GXChain._displayAssetInfo(resp.body);
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示某个资产信息
     *
     * @static
     * @param {*} info
     * @memberof GXChain
     */
    static _displayAssetInfo (info) {
        let output = '';
        let data = [
            ['发行人', info.issuer.name],
            ['发行总量',info.detail.current_supply/Math.pow(10,info.precision)],
            ['流通量',info.options.max_supply/Math.pow(10,info.precision)],
            ['精度',info.precision]
        ];
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green(`\n${info.symbol}-${info.id}`));
        console.log(chalk.green('\n' + chalk.bold(JSON.parse(info.options.description).main + '\n')));
        console.log(chalk.green(output));
    }

    /**
     * 获取持仓排名
     *
     * @static
     * @param {*} assetSymbol
     * @memberof GXChain
     */
    static async getPositionRanking (assetSymbol) {
        try {
            assetSymbol = assetSymbol.toUpperCase();
            let assets = await GXChain._getAssets();
            let assetsMap = {};
            assets.forEach(asset => {
                assetsMap[asset.symbol] = asset;
            });
            let assetInfo = assetsMap[assetSymbol];
            if (!assetInfo) {
                if (process.spinner) {
                    process.spinner.stop()
                }
                console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
                return;
            }
            let resp = await superagent.get(`${WALLET_APIURL}/account/assetRankList?symbol=${assetSymbol}&pageNo=1&pageSize=100`).send();
            let currentSupply = assetInfo.detail.current_supply / Math.pow(10, assetInfo.precision);
            let ranking = JSON.parse(resp.text);
            ranking = ranking.map(item => {
                return {
                    accountName: item.accountName,
                    amount: util.number(item.amount, assetInfo.precision),
                    freezeAmount: util.number(item.freezeAmount, assetInfo.precision),
                    totalAmount: util.number(item.totalAmount, assetInfo.precision),
                    percent: util.number((item.amount + item.freezeAmount) / currentSupply, assetInfo.precision)
                };
            });
            GXChain._displayRankingInfo(assetSymbol, ranking);
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示持仓列表
     *
     * @static
     * @param {*} ranking
     * @memberof GXChain
     */
    static _displayRankingInfo (assetSymbol, ranking) {
        let output = '';
        let data = [
            ['序号', '账户', '锁仓资产', '流通资产', '总资产', '流通占比']
        ];
        ranking.forEach((item, index) => {
            let arr = [index, item.accountName, item.freezeAmount, item.amount, item.totalAmount, (item.percent * 100).toFixed(2) + '%'];
            data.push(arr);
        });
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[' + assetSymbol +' 持仓排名]') + '\n' + output));
    }

    /**
     * 获取区块信息
     *
     * @static
     * @memberof GXChain
     */
    static async getBlockInfo () {
        try {
            let res = await Apis.instance(WS_URL, true).init_promise;
            if (res[0].network) {
                let blockInfo = await Apis.instance().db_api().exec('get_objects', [['2.0.0', '2.1.0']]);
                GXChain._displayBlockInfo(blockInfo);
                Apis.close();
            }
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示区块信息
     *
     * @static
     * @memberof GXChain
     */
    static async _displayBlockInfo (blockInfo) {
        let output = '';
        let data = [
            ['最新区块', blockInfo[1].head_block_number, '最新不可逆区块', blockInfo[1].last_irreversible_block_num],
            ['出块时间(秒)', blockInfo[0].parameters.block_interval, '最近缺失', blockInfo[1].recently_missed_count]
        ];
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        let currentBlock = await superagent.get(`${BLOCK_APIURL}/block/${blockInfo[1].head_block_number}`).send();
        let trxs = currentBlock.body.transactions;
        trxs = trxs.map((item) => {
            item.op = item.operations[0];
            item.op.timestamp = GXChain._calcBlockTime(blockInfo[1].head_block_number, blockInfo[0].parameters.block_interval, blockInfo[1].head_block_number, new Date(blockInfo[1].time + '+00:00'));
            return item;
        });
        let historyData = await GXChain._formatHistory(trxs);
        historyData = table(historyData, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[区块信息]') + '\n' + output + '\n' + chalk.bold('[最近交易记录]') + '\n' + historyData));
    }

    /**
     * 获取见证人列表
     *
     * @static
     * @memberof GXChain
     */
    static async getWitnessesInfo () {
        try {
            let res = await Apis.instance(WS_URL, true).init_promise;
            if (res[0].network) {
                let info = await Apis.instance().db_api().exec('get_objects', [['2.0.0']]);
                await GXChain._displayWitnessesInfo(info[0].active_witnesses);
                Apis.close();
            }
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示见证人列表
     *
     * @static
     * @memberof GXChain
     */
    static async _displayWitnessesInfo (witnesses) {
        let output = '';
        let data = [
            ['公信节点', '最近确认', '得票数']
        ];
        let getName = async (witness) => {
            let witnessInfo = await Apis.instance().db_api().exec('get_objects', [[witness]])
            let accountInfo = await superagent.get(`${BLOCK_APIURL}/account/${witnessInfo[0].witness_account}`).send();
            return [accountInfo.body.account.name, witnessInfo[0].last_confirmed_block_num, witnessInfo[0].total_votes / 100000];
        }
        let promises = witnesses.map(witness => getName(witness));
        for (let promise of promises) {
            let result = await promise;
            data.push(result);
        }
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[活跃公信节点]') + '\n' + output));
    }

    /**
     * 获取候选公信节点
     *
     * @static
     * @memberof GXChain
     */
    static async getTrustNodeCandidates () {
        try {
            let resp = await superagent.get(`${BLOCK_APIURL}/trustnode/candidates`).send();
            let info = resp.body;
            GXChain._displayTrustNodeCandidates(info);
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }

    /**
     * 展示候选公信节点
     *
     * @static
     * @param {*} info
     * @memberof GXChain
     */
    static _displayTrustNodeCandidates (info) {
        let output = '';
        let data = [
            ['账号', '保证金余额', '得票数'],
        ];
        info.forEach((item, index) => {
            let arr = [item.account, item.margin/100000, item.votes/100000];
            data.push(arr);
        });
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[公信节点候选人]') + '\n' + output));
    }

    /**
     * 获取活跃理事会成员
     *
     * @static
     * @memberof GXChain
     */
    static async getCommitteeMembers () {
        try {
            let res = await Apis.instance(WS_URL, true).init_promise;
            if (res[0].network) {
                let info = await Apis.instance().db_api().exec('get_objects', [['2.0.0']]);
                await GXChain._displayCommitteeMembers(info[0].active_committee_members);
                Apis.close();
            }
        } catch (error) {
            if (process.spinner) {
                process.spinner.stop()
            }
            console.log(chalk.green('\n' + chalk.bold('获取信息失败') + '\n'));
        }
    }
    
    /**
     * 展示活跃理事会成员
     *
     * @static
     * @param {*} members
     * @memberof GXChain
     */
    static async _displayCommitteeMembers (members) {
        let output = '';
        let data = [
            ['账户', '得票数'],
        ];
        let getName = async (member) => {
            let memberInfo = await Apis.instance().db_api().exec('get_objects', [[member]]);
            let accountInfo = await superagent.get(`${BLOCK_APIURL}/account/${memberInfo[0].committee_member_account}`).send();
            return [accountInfo.body.account.name, memberInfo[0].total_votes / 100000]
        }
        // for (let member of members) {
        //     let result = await getName(member);
        //     data.push(result);
        // }
        let promises = members.map(member => getName(member));
        for (let promise of promises) {
            let result = await promise;
            data.push(result);
        }
        output = table(data, {
            border: getBorderCharacters(`ramac`)
        });
        if (process.spinner) {
            process.spinner.stop()
        }
        console.log(chalk.green('\n' + chalk.bold('[活跃理事会成员]') + '\n' + output));
    }

    /**
     * 获取版本信息
     *
     * @static
     * @returns
     * @memberof GXChain
     */
    static version () {
        const banner = gradient.vice(figlet.textSync('GXChain', {
            font: 'standard'
        }));
        const gxchainVersion = chalk.cyanBright(`GXChain Cli Version: ${require('../package').version}`);
        const version = `${banner}\n${gxchainVersion}\n`;
        return version;
    }
}

module.exports = GXChain;
