import * as cds from "@sap/cds";
import { Service } from "@sap/cds/apis/services";
//@ts-ignore('Later')
import log from "cf-nodejs-logging-support";
import * as cfcommands from "./cfcommands";

// @ts-ignore('later')
// import * as error_helper from "./error_helper";
require("./error_helper");

export = (srv: Service) => {
  const { Sales } = srv.entities;

  srv.after("READ", Sales, (each: any) => {
    if (each.amount > 500) {
      each.criticality = 3;
      if (each.comments === null) each.comments = "";
      else each.comments += " ";
      each.comments += "Exceptional!";
      log.info(each.comments, { country: each.country, amount: each.amount });
    } else if (each.amount < 150) {
      each.criticality = 1;
    } else {
      each.criticality = 2;
    }
  });

  srv.on("boost", async (req: any) => {
    try {
      const ID = req.params[0];
      const tx = cds.tx(req);
      await tx
        .update(Sales)
        .with({ amount: { "+=": 250 }, comments: "Boosted!" })
        .where({ ID: { "=": ID } });
      return {};
    } catch (err: any) {
      console.error(err.toJSON());
      return {};
    }
  });

  srv.on("topSales", async (req: any) => {
    try {
      const tx = cds.tx(req);
      // @ts-ignore('later')
      const results = await tx.run(`CALL "APP1_DB_SP_TopSales"(?,?)`, [
        req.data.amount,
      ]);
      return results;
    } catch (err: any) {
      console.error(err.toJSON());
      return {};
    }
  });

  srv.on("userInfo", (req: any) => {
    const results: any = {};
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

  srv.on("activateExtension", async (req: any) => {
    log.info("Calling activateExtension action");
    const results: { tenant: string | undefined; extension: string } = {} as any;

    const { aSnippets } = req.data;

    const extensions: string[][] = [];
    for (const oSnippet of aSnippets) {
      extensions.push([oSnippet.sFilename, oSnippet.sCode]);
    }
    try {
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      await modelService.activate(req.user.tenant, extensions);
      // the following emit worked in Günther's app so that a restart war not necessary
      // but it doesn't work here
      // TODO: find another solutions
      // @ts-ignore('later')
      await cds.emit("served", cds.services);
    } catch (e) {
      log.error(`couldn't activate extension for ${req.user.tenant}`);
    }

    results.tenant = req.user.tenant;
    results.extension = JSON.stringify(extensions);

    log.info("Finished activateExtension action");
    return results;
  });

  srv.on("deactivateExtension", async (req : any) => {
    log.info("Calling deactivateExtension action");
    try {
      const { files } = req.data;

      // action deactivate (tenant: String(200), extension: JSON_ARRAY);
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      const apiResult = await modelService.deactivate(req.user.tenant, files);
      // the following emit worked in Günther's app so that a restart war not necessary
      // but it doesn't work here
      // TODO: find another solutions
      // @ts-ignore('later')
      await cds.emit("served", cds.services);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while deactivating extension. See logs for details";
    }
    log.info("Finished deactivateExtension action");
    return "deactivateExtension executed successfully";
  });

  srv.on("resetTenant", async (req: any) => {
    log.info("Calling resetTenant action");
    try {
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      await modelService.reset(req.user.tenant);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finished resetTenant action");
    return "resetTenant executed successfully";
  });

  srv.on("upgradeBaseModel", async (req: any) => {
    log.info("Calling upgradeBaseModel action");
    // just a copy of resetTenant.
    // action upgrade (tenants: Array of String(200), base: JSON, autoUndeploy: Boolean, advancedOptions: ADVANCED_OPTIONS) returns UPGRADE_RESULT;
    try {
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      const apiResult = await modelService.upgrade([req.user.tenant]);
    } catch (e) {
      log.error(JSON.stringify(e));
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finshed upgradeBaseModel action");
    return "upgradeBaseModel executed successfully";
  });

  srv.on("restartApp", async (req: any) => {
    log.info("Calling restartApp action");
    await cfcommands.restartApp("app1-srv");
    log.info("Finished restartApp action");
  });

  srv.on("dummy", (req: any) => {
    log.info("Calling dummy action");
    log.info("Finished dummy action");
    return "dummy executed successfully";
  });

  // srv.on('upgradeBaseModel', async (req) => {
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

  // srv.on('activateExtension', async (req) => {
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
};

