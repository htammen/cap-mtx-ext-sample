import * as cds from "@sap/cds";
import { Service, Request } from "@sap/cds/apis/services";
//@ts-ignore('Later')
import log from "cf-nodejs-logging-support";

// @ts-ignore('later')
// import * as error_helper from "./error_helper";
require("./error_helper");

export class MonitoringService extends cds.ApplicationService {
  private Memorys: any;

  async init() {
    // this.Sales = this.entities.Sales;
    this.Memorys = this.entities['app1.db.monitoring.Memorys'];
    this.Memorys = this.Memorys || this.entities['Memorys'];

    this.before("CREATE", this.Memorys, this.beforeCreateMemorys);
    this.on("CREATE", this.Memorys, this.onCreateMemorys);
    this.after("READ", this.Memorys, this.afterReadMemorys);
    this.on("deleteAllMonitoringData", this.onDeleteAllMonitoringData); 
    
    await super.init( );
  }


  beforeCreateMemorys(req: Request) {
    // console.log("beforeCreateMemorys called");
  }
  onCreateMemorys(req: Request, next: any) {
    // console.log("beforeCreateMemorys called");
    return next();
  }

  afterReadMemorys(data: any, req: Request) {
    // conovert memory values to MBs
    data.forEach((each:any) => {
      each.rss = each.rss / 1024 /1024;
      each.heapTotal = each.heapTotal / 1024 /1024;
      each.heapUsed = each.heapUsed / 1024 /1024;
      each.external = each.external / 1024 /1024;
      each.arrayBuffers = each.arrayBuffers / 1024 /1024;
    });
  }

  /**
   * Delete all memory monitoring data
   */
  async onDeleteAllMonitoringData(req: Request) {
    const {triggerAction} = req.data;
    if(triggerAction) {
      const query = DELETE.from(this.Memorys).where `triggerAction like ${triggerAction}`;
      const result = await this.run(query);
      return `${result} records of monitoring data for ${triggerAction} have been deleted`;
    } else {
      await DELETE.from(this.Memorys);
      return `All monitoring data has been deleted`;
    }
  }

}

