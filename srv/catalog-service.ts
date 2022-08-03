import * as cds from "@sap/cds";
import { Service, Request } from "@sap/cds/apis/services";
//@ts-ignore('Later')
import log from "cf-nodejs-logging-support";
import * as cfcommands from "./cfcommands";
import * as mtxapis from "./mtxapis";
import { Monitoring } from "./src/monitoring";

// @ts-ignore('later')
// import * as error_helper from "./error_helper";
require("./error_helper");

export class CatalogService extends cds.ApplicationService {
  private Sales: any;
  private monitoring: Monitoring = new Monitoring();

  async init() {
    this.Sales = this.entities.Sales;
    this.after("READ", this.Sales, this.afterReadSales);
    this.on("boost", this.onBoost);
    this.on("topSales", this.onTopSales);
    this.on("userInfo", this.onUserInfo);
    this.on("activateExtension", this.onActivateExtension);
    this.on("deactivateExtension", this.onDeactivateExtension);
    this.on("resetTenant", this.onResetTenant);
    this.on("upgradeBaseModel", this.onUpgradeBaseModel);
    this.on("upgradeBaseModelAPI", this.onUpgradeBaseModelAPI);
    this.on("restartApp", this.onRestartApp);
    this.on("clearMetadataCache", this.onClearMetadataCache);
    // this.on("getMonitoringData", this.onGetMonitoringData);
    this.on("dummy", this.onDummy);
    
    await super.init( );
  }


  afterReadSales(each: any) {
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
  }

  async onBoost(req: Request) {
    try {
      const ID = req.params[0];
      const tx = cds.tx(req);
      await tx
        .update(this.Sales)
        .with({ amount: { "+=": 250 }, comments: "Boosted!" })
        .where({ ID: { "=": ID } });
      return {};
    } catch (err: any) {
      log.error(`error boosting`, err);
      return {}
    }
  }

  async onTopSales(req: Request) {
    try {
      const tx = cds.tx(req);
      // @ts-ignore('later')
      const results = await tx.run(`CALL "APP1_DB_SP_TopSales"(?,?)`, [
        req.data.amount,
      ]);
      return results;
    } catch (err: any) {
      log.error(`error topSales`, err);
      return {};
    }
  }

  onUserInfo(req: Request) {
    //@ts-ignore
    // this.monitoring.addMemoryInfo("onUserInfo before", process.memoryUsage());
    const results: any = {};
    results.user = req.user.id;
    if (req.user.hasOwnProperty("locale")) {
      results.locale = req.user.locale;
    }
    //@ts-ignore('later')
    // results.locale = req._.headers.authorization;

    results.scopes = {};
    results.scopes.identified = req.user.is("identified-user");
    results.scopes.authenticated = req.user.is("authenticated-user");
    results.scopes.Viewer = req.user.is("Viewer");
    results.scopes.Admin = req.user.is("Admin");
    results.tenant = req.user.tenant;
    results.scopes.ExtendCDS = req.user.is("ExtendCDS");
    results.scopes.ExtendCDSdelete = req.user.is("ExtendCDSdelete");
    //@ts-ignore('later')
    results.authorization = req._.headers.authorization;
    // this.monitoring.addMemoryInfo("onUserInfo after", process.memoryUsage());
    return results;
  }

  logMemory() {
      const memory = process.memoryUsage()
      log.info(`This process used ${memory.rss / 1024 / 1024} MB memory in total`)
      log.info(`This process used ${memory.heapTotal / 1024 / 1024} MB total heap`)
      log.info(`This process used ${memory.heapUsed / 1024 / 1024} MB used heap`)
  }

  async onActivateExtension(req: Request) {
    const startTime = new Date().getTime();
    await this.monitoring.addMemoryInfo("onActivateExtensionBefore", process.memoryUsage(), 0);
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
      // @ts-ignore('later')
      // await global.cds.emit("served");
      // metadata problem fixed with @sap/cds:5.9.8. see https://answers.sap.com/questions/13662134/clear-odata-metadata-cache.html
      // req._.odataReq._service._getMetadataCache()._cachedMetadata.clear()
    } catch (err: any) {
      log.error(`couldn't activate extension for ${req.user.tenant}.`, err);
      throw new Error(`error while activating extensions.\n${JSON.stringify(err.toJSON(), null, 2)}`);
    }

    results.tenant = req.user.tenant;
    results.extension = JSON.stringify(extensions, null, 2);

    log.info("Finished activateExtension action");
    const endTime = new Date().getTime();
    const diff = (endTime - startTime) / 1000.0;
    await this.monitoring.addMemoryInfo("onActivateExtensionAfter", process.memoryUsage(), diff);
    return results;
  }

  async onDeactivateExtension(req: any) {
    const startTime = new Date().getTime();
    await this.monitoring.addMemoryInfo("onDeactivateExtensionBefore", process.memoryUsage(), 0);
    log.info("Calling deactivateExtension action");
    try {
      const { files } = req.data;

      // action deactivate (tenant: String(200), extension: JSON_ARRAY);
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      const apiResult = await modelService.deactivate(req.user.tenant, files);
      // the following emit worked in Günther's app so that a restart war not necessary
      // but it doesn't work here
      // @ts-ignore('later')
      // await global.cds.emit("served");
      // metadata problem fixed with @sap/cds:5.9.8. see https://answers.sap.com/questions/13662134/clear-odata-metadata-cache.html
      // req._.odataReq._service._getMetadataCache()._cachedMetadata.clear()
    } catch (err: any) {
      log.error(`error deactivating extensions`, err);
      throw new Error(`error while deactivating extension.\n${JSON.stringify(err.toJSON(), null, 2)}`);
    }
    log.info("Finished deactivateExtension action");
    const endTime = new Date().getTime();
    const diff = (endTime - startTime) / 1000.0;
    await this.monitoring.addMemoryInfo("onDeactivateExtensionAfter", process.memoryUsage(), diff);
    return "deactivateExtension executed successfully";
  }

  async onResetTenant(req: Request) {
    log.info("Calling resetTenant action");
    try {
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      await modelService.reset(req.user.tenant);
    } catch (err: any) {
      log.error(`error resetting extensions`, err);
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finished resetTenant action");
    return "resetTenant executed successfully";
  }

  async onUpgradeBaseModel(req: Request) {
    log.info("Calling upgradeBaseModel action");
    // just a copy of resetTenant.
    // action upgrade (tenants: Array of String(200), base: JSON, autoUndeploy: Boolean, advancedOptions: ADVANCED_OPTIONS) returns UPGRADE_RESULT;
    try {
      const modelService = await cds.connect.to("ModelService");
      // @ts-ignore('later')
      const apiResult = await modelService.upgrade([req.user.tenant]);
    } catch (err: any) {
      log.error(`error while upgradingBaseModel`, err);
      return "error while resetting Tenant. See logs for details";
    }
    log.info("Finshed upgradeBaseModel action");
    return "upgradeBaseModel executed successfully";
  }

  async onUpgradeBaseModelAPI(req: Request) {
    log.info("Calling upgradeBaseModelAPI action");
    const { tenantid } = req.data;
    const tenant = tenantid || req.user.tenant || '';
    //@ts-ignore('later')
    const jobID = await mtxapis.upgradeBaseModel(req._.headers.authorization, req.req.headers.origin, [tenant]);
    //@ts-ignore('later')
    const sJobResult = await mtxapis.waitForJob(jobID, req.req.headers.origin, req._.headers.authorization);
    // the following emit worked in Günther's app so that a restart war not necessary
    // but it doesn't work here
    // TODO: find another solutions
    // @ts-ignore('later')
    // await global.cds.emit("served");
    req._.odataReq._service._getMetadataCache()._cachedMetadata.clear()
    log.info(`Finshed upgradeBaseModelAPI action with status ${sJobResult.status}`);
    return JSON.stringify(sJobResult, null, 2);
    // return `upgradeBaseModelAPI executed successfully with status ${sJobResult.status}`;
  }

  async onRestartApp(req: Request) {
    log.info("Calling restartApp action");
    await cfcommands.restartApp("app1-srv");
    log.info("Finished restartApp action");
  }

  onClearMetadataCache(req: Request) {
    //@ts-ignore('later')
    req._.odataReq._service._getMetadataCache()._cachedMetadata.clear()
    return `OData metadata cache has been cleared`;
  };

  async onGetMonitoringData(req: Request) {
    let result: any
    const type: string = req.data.type;
    switch(type) {
      case 'memory': 
        result = await this.monitoring.getMemoryInfo()
        break;
    }
    return result;
  }

  onDummy(req: Request) {
    log.info("Calling dummy action");
    log.info("Finished dummy action");
    return "dummy executed successfully";
  }

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
}

