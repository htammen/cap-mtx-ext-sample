const cds = require('@sap/cds');
const LOG = cds.log('app1')

cds.on('bootstrap', app => {
    // cds.mtx.in(app).then(async () => {
        // const provisioning = await cds.connect.to('ProvisioningService');
        // provisioning.impl(require('./provisioning'));
        // const model = await cds.connect.to('ModelService');
        // model.impl(require('./modelservice'));
    // });
});

cds.on('served', async () => {
  const { 'cds.xt.SaasProvisioningService': provisioning } = cds.services
  const { 'cds.xt.DeploymentService': deployment } = cds.services
  const { 'cds.xt.ModelProviderService': modelProvider } = cds.services

  // provisioning?.impl(require('./provisioning'));
  // LOG._debug && LOG.debug('service provisioning instance created', provisioning ? 'yes': 'no'); 
  // modelProvider?.impl(require('./modelservice'));
  // LOG._debug && LOG.debug('service modelProvider instance created', modelProvider ? 'yes': 'no'); 

  // provisioning.prepend(() => {
  //   provisioning.on('UPDATE', 'tenant', async (req, next) => { ... })
  //   provisioning.on('dependencies', async (req, next) => { ... })
  // })
  // deployment.prepend(() => {
  //    // previously this was `upgradeTenant`
  //   deployment.on('upgrade', async (req) => {
  //     // HDI container credentials are not yet available here
  //   })
  // })
})

module.exports = cds.server;
