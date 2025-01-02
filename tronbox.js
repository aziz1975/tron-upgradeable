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
        privateKey: '7d62b54ad1b154a74570cf4d928324335365d70265fd8e6eb72d22738b85f559',
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
  