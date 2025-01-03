module.exports = {
    networks: {
      nile: {
        privateKey: 'c2ab128a88ca1597a1ff3c840408c9aee8b1ab0ed3d259585189f2a758e41940',
        consume_user_resource_percent: 50,
        fee_limit: 1e9,
        fullHost: 'https://nile.trongrid.io',
        network_id: '*',
      },
      development: {
        privateKey: '5e39b89d49a5470b68ef628c73fe8de7dce539571951b9b187ba17a9afe4c445',
        consume_user_resource_percent: 100,
        fee_limit: 1000000000,
        fullHost: 'http://127.0.0.1:9090', 
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
  };
  