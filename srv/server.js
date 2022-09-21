const cds = require('@sap/cds');
const { Provisioning } = require('./provisioning');
const log = require( 'cf-nodejs-logging-support' );

cds.on('served', app => {
  debugger;
  const { 'cds.xt.DeploymentService': ds } = cds.services
  // ds.on('subscribe', Provisioning.onSubscribe);
  // ds.on('unsubscribe', Provisioning.onUnsubscribe);

  const provisioningSrv = cds.services["cds.xt.SaasProvisioningService"];
  if(provisioningSrv) {
    provisioningSrv.impl(require('./provisioning'));
  } else {
     log.error('could not get cds.services["cds.xt.SaasProvisioningService"]');
  }


    // cds.mtx.in(app).then(async () => {
    //     const provisioning = await cds.connect.to('ProvisioningService');
    //     provisioning.impl(require('./provisioning'));
    //     const model = await cds.connect.to('ModelService');
    //     model.impl(require('./modelservice'));
    // });
});
// cds.on('served', ()=>{
//   const { 'cds.xt.ModelProviderService': mps } = cds.services
//   const { 'cds.xt.DeploymentService': ds } = cds.services
//   ds.before ('upgrade', (req) => { ... })
//   ds.after ('subscribe', (_,req) => { ... })
//   mps.after ('getCsn', (csn) => { ... })
// })
module.exports = cds.server;
