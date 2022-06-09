const cds = require("@sap/cds");
const debug = require("debug")("srv:catalog-service");
const log = require("cf-nodejs-logging-support");
const cfcommands = require("./cfcommands");
require("./error_helper");
const cfcommand = require("./cfcommands");
log.setLoggingLevel("info");
log.registerCustomFields(["country", "amount"]);

module.exports = cds.service.impl(async function () {
  const { Sales } = this.entities;

  this.after("READ", Sales, (each) => {
    if (each.amount > 500) {
      each.criticality = 3;
      if (each.comments === null) each.comments = "";
      else each.comments += " ";
      each.comments += "Exceptional!";
      debug(each.comments, { country: each.country, amount: each.amount });
      log.info(each.comments, { country: each.country, amount: each.amount });
    } else if (each.amount < 150) {
      each.criticality = 1;
    } else {
      each.criticality = 2;
    }
  });

  this.on("boost", async (req) => {
    try {
      const ID = req.params[0];
      const tx = cds.tx(req);
      await tx
        .update(Sales)
        .with({ amount: { "+=": 250 }, comments: "Boosted!" })
        .where({ ID: { "=": ID } });
      debug("Boosted ID:", ID);
      return {};
    } catch (err) {
      console.error(err);
      return {};
    }
  });

  this.on("topSales", async (req) => {
    try {
      const tx = cds.tx(req);
      const results = await tx.run(`CALL "APP1_DB_SP_TopSales"(?,?)`, [
        req.data.amount,
      ]);
      return results;
    } catch (err) {
      console.error(err);
      return {};
    }
  });

  this.on("userInfo", async (req) => {
    let results = {};
    results.user = req.user.id;
    if (req.user.hasOwnProperty("locale")) {
      results.locale = req.user.locale;
    }
    results.scopes = {};
    results.scopes.identified = req.user.is("identified-user");
    results.scopes.authenticated = req.user.is("authenticated-user");
    results.scopes.Viewer = req.user.is("Viewer");
    results.scopes.Admin = req.user.is("Admin");
    results.tenant = req.user.tenant;
    results.scopes.ExtendCDS = req.user.is("ExtendCDS");
    results.scopes.ExtendCDSdelete = req.user.is("ExtendCDSdelete");
    return results;
  });

  this.on("activateExtension", async (req) => {
    log.info("Calling activateExtension action");
    const service = "CatalogService";
    let results = {};

    const { aSnippets } = req.data;

    let extensions = [];
    for (let oSnippet of aSnippets) {
      extensions.push([oSnippet.sFilename, oSnippet.sCode]);
    }
    try {
      const modelService = await cds.connect.to("ModelService");
      await modelService.activate(req.user.tenant, extensions);
    } catch (e) {
      log.error(`couldn't activate extension for ${tenant}`);
      edmx = "";
    }

    results.tenant = req.user.tenant;
    results.extension = JSON.stringify(extensions);

    log.info("Finished activateExtension action");
    return results;
  });

  this.on("deactivateExtension", async (req) => {
    log.info("Calling deactivateExtension action");
    try {
      const { files } = req.data;

      // action deactivate (tenant: String(200), extension: JSON_ARRAY);
      const modelService = await cds.connect.to("ModelService");
      const apiResult = await modelService.deactivate(req.user.tenant, files);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while deactivating extension. See logs for details";
    }
    log.info("Finished deactivateExtension action");
    return "deactivateExtension executed successfully";
  });

  this.on("resetTenant", async (req) => {
    log.info("Calling resetTenant action");
    try {
      const modelService = await cds.connect.to("ModelService");
      await modelService.reset(req.user.tenant);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finished resetTenant action");
    return "resetTenant executed successfully";
  });

  this.on("upgradeBaseModel", async (req) => {
    log.info("Calling upgradeBaseModel action");
    // just a copy of resetTenant.
    // action upgrade (tenants: Array of String(200), base: JSON, autoUndeploy: Boolean, advancedOptions: ADVANCED_OPTIONS) returns UPGRADE_RESULT;
    try {
      const modelService = await cds.connect.to("ModelService");
      const apiResult = await modelService.upgrade([req.user.tenant]);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finshed upgradeBaseModel action");
    return "upgradeBaseModel executed successfully";
  });

  this.on("restartApp", async (req) => {
    log.info("Calling restartApp action");
    await cfcommands.restartApp('app1-srv');
    log.info("Finished restartApp action");
  });

  this.on("dummy", (req) => {
    log.info("Calling dummy action");
    log.info("Finished dummy action");
    return "dummy executed successfully";
  });

  // this.on('upgradeBaseModel', async (req) => {
  //   console.log('Calling upgradeBaseModel function');
  //   // just a copy of resetTenant.
  //   const modelService = await cds.connect.to('ModelService');
  //   const tx = modelService.tx(req);
  //   try {
  //     const apiResult = await tx.reset(req.user.tenant);
  //     tx.commit();
  //     console.log(apiResult);
  //   } catch(e) {
  //     tx.rollback();
  //     console.log(JSON.stringify(e));
  //     return 'error while resetting Tenant. See logs for details';
  //   }
  //   return 'upgradeBaseModel executed successfully'
  // })

  // this.on('activateExtension', async (req) => {
  //   const service = 'CatalogService';
  //   let results = {};

  //   let tenant = req.user.tenant;
  //   let edmx;
  //   try {
  //     edmx = await cds.mtx.getEdmx(tenant, service);
  //   } catch(e) {
  //     console.error(`couldn't read edmx for ${tenant}`);
  //     edmx = '';
  //   }

  //   results.tenant = tenant;
  //   results.edmx = edmx;

  //   return results;
  // });
});
