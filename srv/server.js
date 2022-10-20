const cds = require('@sap/cds');

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

  provisioning.impl(require('./provisioning'));
  modelProvider.impl(require('./modelservice'));

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
