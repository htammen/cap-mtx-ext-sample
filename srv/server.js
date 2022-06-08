const cds = require('@sap/cds');

cds.on('bootstrap', app => {
    cds.mtx.in(app).then(async () => {
        const provisioning = await cds.connect.to('ProvisioningService');
        provisioning.impl(require('./provisioning'));
        const model = await cds.connect.to('ModelService');
        model.impl(require('./modelservice'));
    });
});

module.exports = cds.server;
