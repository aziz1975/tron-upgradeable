require('dotenv').config();

module.exports = {
  networks: {
    nile: {
      privateKey: process.env.PRIVATE_KEY_NILE,
      consume_user_resource_percent: 50,
      fee_limit: 1e9,
      fullHost: process.env.FULL_NODE_NILE,
      network_id: '*',
    },
    development: {
      privateKey: process.env.PRIVATE_KEY_DEVELOPMENT,
      consume_user_resource_percent: 100,
      fee_limit: 1000000000,
      fullHost: process.env.FULL_NODE_DEVELOPMENT,
      network_id: '*'
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true, // Optional optimization settings
          runs: 200,
        },
      },
    },
  },
  // solc compiler optimize
  solc: {
    optimizer: {
      enabled: true, // default: false, true: enable solc optimize
      runs: 200
    },
    evmVersion: 'shanghai'
  }

};
