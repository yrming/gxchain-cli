#!/usr/bin/env node

const program = require('commander');
const importLazy = require('import-lazy')(require);
const ora = importLazy('ora');
const GXChain = importLazy('../src/gxchain.js');

program
    .option('-v, --version', 'Output the version info')
    .version(GXChain.version());

program
    .command('account <id_or_name>')
    .action((id_or_name) => {
        process.spinner = ora('Fetching').start();
        GXChain.getAccountInfo(id_or_name);
    });

program
    .command('rank <asset_symbol>')
    .action((asset_symbol) => {
        process.spinner = ora('Fetching').start();
        GXChain.getPositionRanking(asset_symbol);
    });

program
    .command('assets')
    .action(() => {
        process.spinner = ora('Fetching').start();
        GXChain.getAssetsInfo();
    });

program
    .command('asset <asset_symbol>')
    .action((asset_symbol) => {
        process.spinner = ora('Fetching').start();
        GXChain.getAssetInfo(asset_symbol);
    });

program
    .command('block')
    .action(() => {
        process.spinner = ora('Fetching').start();
        GXChain.getBlockInfo();
    });

program
    .command('witnesses')
    .action(() => {
        process.spinner = ora('Fetching').start();
        GXChain.getWitnessesInfo();
    });

program
    .command('trustnodes')
    .action(() => {
        process.spinner = ora('Fetching').start();
        GXChain.getTrustNodeCandidates();
    });

program
    .command('committee')
    .action(() => {
        process.spinner = ora('Fetching').start();
        GXChain.getCommitteeMembers();
    });

program
    .command('tx <tx_id>')
    .action((tx_id) => {
        process.spinner = ora('Fetching').start();
        GXChain.getTransaction(tx_id);
    });
    
program
    .command("*")
    .action(function () {
        console.log('\nerror: command not found\n');
        process.exit(1);
    });
program.parse(process.argv);

if (program.args.length === 0) {
    console.log(GXChain.version());
}