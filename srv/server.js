const cds = require('@sap/cds');

const log = cds.log('app-mtx-bootstrap');

cds.on('bootstrap', app => {
  log.debug('entering bootstrap')
    cds.mtx.in(app).then(async () => {
        log.debug('setup provisioningService and modelService handlers')
        const provisioning = await cds.connect.to('ProvisioningService');
        provisioning.impl(require('./provisioning'));
        const model = await cds.connect.to('ModelService');
        model.impl(require('./modelservice'));
        const metadata = await cds.connect.to('MetadataService');
        metadata.impl(require('./metadataservice'));
    });
});

module.exports = cds.server;
