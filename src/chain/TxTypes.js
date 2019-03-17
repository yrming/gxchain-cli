TrxTypes= {
    'all': '显示全部',
    'transfer': {
        name: '转账',
        from: '来自',
        amount: '金额',
        to: '发往',
        fee: '手续费'
    },
    'limit_order_create': '限价单',
    'limit_order_cancel': '取消限价单',
    'call_order_update': '更新订单',
    'account_create': {
        name: '创建账户',
        fee: '手续费',
        registrar: '注册人',
        referrer: '推荐人',
        account: '账户名'
    },
    'account_update': {
        name: '更新账户',
        fee: '手续费',
        account: '账户名'
    },
    'account_whitelist': {
        name: '账户白名单',
        fee: '手续费',
        authorizing_account: '授权账户',
        account_to_list: '被操作账户',
        new_listing: '操作',
        whitelist_states: {
            no_listing: '从列表移除',
            white_listed: '加入白名单',
            black_listed: '加入黑名单',
            white_and_black_listed: '加入白/黑名单'
        }
    },
    'account_upgrade': {
        name: '升级账户',
        account_to_upgrade: '升级账户',
        fee: '手续费',
        upgrade_to_lifetime_member: '认证为终身会员'
    },
    'account_transfer': {
        name: '账户转移',
        account_id: '原账户',
        new_owner: '新账户',
        fee: '手续费'
    },
    'asset_create': {
        name: '创建资产',
        fee: '手续费',
        issuer: '发行人',
        symbol: '代码',
        precision: '精度',
        max_supply: '最大供给量',
        description: '描述',
        market_fee: '市场手续费',
        maximum_market_fee: '最大市场手续费'
    },
    'asset_update': '更新资产',
    'asset_update_bitasset': '更新智能币',
    'asset_update_feed_producers': '更新资产喂价者',
    'asset_issue': {
        name: '资产发行',
        fee: '手续费',
        issuer: '发行人',
        asset_to_issue: '发行数量',
        issue_to_account: '发往'
    },
    'asset_reserve': '销毁资产',
    'asset_fund_fee_pool': '积存资产费用池',
    'asset_settle': '资产结算',
    'asset_global_settle': '全局资产清算',
    'asset_publish_feed': '发布资产喂价',
    'committee_member_create': '创建理事会成员',
    'witness_create': '创建公信节点',
    'witness_withdraw_pay': '公信节点取回报酬',
    'proposal': {
        proposal_create: '创建提案',
        proposal_update: '更新提案',
        proposal_delete: '删除提案',
        review_period: '复审期开始',
        expiration_time: '过期时间',
        proposed_ops: '提议操作',
        fee_paying_account: '付费账户',
        fee: '手续费',
        update: {
            active_approvals_to_add: '要添加的活跃权限许可',
            active_approvals_to_remove: '要移除的活跃权限许可',
            owner_approvals_to_add: '要添加的账户权限许可',
            owner_approvals_to_remove: '要移除的账户权限许可',
            key_approvals_to_add: '要添加的公钥许可',
            key_approvals_to_remove: '要移除的公钥许可'
        }
    },
    'withdraw_permission_create': '创建提取权限',
    'withdraw_permission_update': '更新提取权限',
    'withdraw_permission_claim': '主张提取权限',
    'withdraw_permission_delete': '删除提取权限',
    'fill_order': '订单撮合',
    'delegate_update_global_parameters': '全局参数更新',
    'vesting_balance_create': '创建冻结账目余额',
    'vesting_balance_withdraw': {
        name: '提取解冻账户余额',
        owner: '发往',
        amount: '金额',
        fee: '手续费'
    },
    'worker_create': '创建雇员',
    'custom': {
        name: '自定义',
        payer: '付费人',
        fee: '手续费',
        data: '数据',
        toHex: '字符转16进制',
        toString: '16进制转字符'
    },
    'assert': '断言操作',
    'balance_claim': '领取余额',
    'override_transfer': {
        name: '优先覆盖转账',
        fee: '手续费',
        issuer: '发行人',
        from: '来自',
        to: '发往',
        amount: '金额'
    },
    'witness_update': '更新公信节点',
    'committee_member_update_global_parameters': '全局参数更新',
    'transfer_to_blind': '向隐私账户转账',
    'blind_transfer': '隐私转账',
    'transfer_from_blind': '从隐私账户转出',
    'committee_member_update': '更新理事会成员账户',
    'asset_claim_fees': '领取资产手续费',
    'account_upgrade_merchant': {
        name: '商户认证',
        account_to_upgrade: '升级账户',
        auth_referrer: '授权账户',
        upgrade_to_merchant_member: '认证为认证商户',
        fee: '手续费'
    },
    'account_upgrade_datasource': {
        name: '数据源认证',
        account_to_upgrade: '升级账户',
        auth_referrer: '授权账户',
        upgrade_to_datasource_member: '认证为数据源',
        fee: '手续费'
    },
    'data_market_category_create': {
        name: '创建类目',
        category_name: '类目名称',
        issuer: '发行人',
        fee: '手续费',
        create_date_time: '创建时间'
    },
    'data_market_category_update': {
        name: '更新类目',
        category: '类目ID',
        new_category_name: '类目名称',
        new_status: '新状态',
        fee: '手续费'
    },
    'free_data_product_create': {
        name: '创建自由市场数据产品',
        product_name: '产品名称',
        issuer: '发行人',
        fee: '手续费',
        create_date_time: '创建时间'
    },
    'free_data_product_update': {
        name: '更新自由市场数据产品',
        free_data_product: '产品ID',
        new_product_name: '新产品名称',
        new_status: '新状态',
        fee: '手续费'
    },
    'league_data_product_create': {
        name: '创建联盟数据产品',
        product_name: '产品名称',
        issuer: '发行人',
        fee: '手续费',
        create_date_time: '创建时间'
    },
    'league_data_product_update': {
        name: '更新联盟数据产品',
        free_data_product: '产品ID',
        new_product_name: '新产品名称',
        new_status: '新状态',
        fee: '手续费'
    },
    'league_create': {
        name: '创建联盟',
        league_name: '联盟名称',
        fee: '手续费',
        create_date_time: '创建时间'
    },
    'league_update': {
        name: '更新联盟',
        league: '联盟ID',
        new_league_name: '新联盟名称',
        new_status: '新状态',
        fee: '手续费'
    },
    'data_transaction_create': {
        name: '发起数据交易',
        request_id: '请求ID',
        product_id: '产品名称',
        version: '版本',
        fee: '手续费',
        requester: '发起人',
        create_date_time: '创建时间'
    },
    'data_transaction_update': {
        name: '更新数据交易',
        request_id: '请求ID',
        fee: '手续费',
        new_requester: '新发起人',
        new_status: '新状态'
    },
    'data_transaction_pay': {
        name: '数据支付',
        fee: '手续费',
        from: '来自',
        to: '发往',
        amount: '金额',
        request_id: '请求ID'
    },
    'account_upgrade_data_transaction_member': {
        name: '交易节点认证',
        fee: '手续费',
        account_to_upgrade: '升级账户',
        upgrade_to_data_transaction_member: '认证为交易确认节点'
    },
    'data_transaction_datasource_upload': {
        name: '数据存证',
        request_id: '请求ID',
        requester: '发起人',
        datasource: '数据源',
        fee: '手续费'
    },
    'data_transaction_datasource_validate_error': {
        name: '数据交易失败',
        request_id: '请求ID',
        datasource: '数据源',
        fee: '手续费'
    },
    'balance_lock': {
        name: '冻结余额',
        create_date_time: '开始时间',
        amount: '锁定金额',
        program_id: '锁仓期限',
        term: '个月',
        interest_rate: '奖励年化'
    },
    'balance_unlock': {
        name: '解冻余额',
        account: '解锁账户',
        lock_id: '锁定ID'
    },
    'proxy_transfer': {
        name: '代理转账',
        from: '来自',
        to: '发往',
        amount: '金额',
        memo: '备注(memo)',
        proxy_memo: '代理备注(proxy memo)',
        proxy_account: '代理转账人',
        fee: '手续费'
    },
    'create_contract': {
        name: '创建合约',
        account: '账户',
        contract_name: '合约名称',
        fee: '手续费'
    },
    'call_contract': {
        name: '调用合约',
        account: '账户',
        contract_name: '合约名称',
        method_name: '合约方法',
        fee: '手续费'
    },
    'update_contract': {
        name: '更新合约',
        owner: '权限账户',
        new_owner: '新权限账户',
        contract_name: '合约名称',
        fee: '手续费'
    },
    'status_states': {
        0: '未发布',
        1: '已发布',
        2: '已删除'
    }
}

module.exports = TrxTypes;