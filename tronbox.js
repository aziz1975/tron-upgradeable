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
        privateKey: '9b9902297149a8e7939b2b5acfc7c8095102ddd04fa96657d19cc853020e6020',
        consume_user_resource_percent: 100,
        fee_limit: 1000000000,
        fullHost: 'http://127.0.0.1:9090', 
        network_id: '*'
      },
    },
    solc: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
    },
  };
  