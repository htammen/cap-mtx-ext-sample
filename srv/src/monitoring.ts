const cds = require("@sap/cds");
const { v4: uuidv4 } = require('uuid')
// import * as cds from "@sap/cds";

/**
 * MemoryInfo class holds information to memory usage. 
 * Besindes the MemoryUsage data it tracks the time and the triggerAction 
 * that caused the creation of this entry
 */
class MemoryInfo {
  /** action that triggered logging the memeoryInfo */
  triggerAction: string
  triggerTime: Date
  /** The NodeJS MemoryUsage Info rss, heap, ... */
  memoryUsage: NodeJS.MemoryUsage

  constructor(triggerAction: string, memoryUsage: NodeJS.MemoryUsage) {
    this.triggerAction = triggerAction
    this.memoryUsage = memoryUsage
    this.triggerTime = new Date()
  }
}

/**
 * Monitoring class provides several helper goodies to 
 * monitor the apps of this project
 */
export class Monitoring {
  /** holds up to 50 MemoryInfo records */
  private memoryInfo: MemoryInfo[];
  private monitoringService: any;

  constructor() {
    this.memoryInfo = [] as MemoryInfo[];
  }

  async getMonitoringService(): Promise<any> {
    if (!this.monitoringService) {
      this.monitoringService = await cds.connect.to("MonitoringService");
    }
    return this.monitoringService;
  }

  /** 
   * adds a MemoryInfo object to the respective property 
   */
  public async addMemoryInfo(triggerAction: string, memoryUsage: NodeJS.MemoryUsage, timeInSeconds: number) {
    const monitoringService = await cds.connect.to("MonitoringService");
    const tx = monitoringService.tx();
    try {
      const { 'app1.db.monitoring.Memorys': Memories } = cds.entities
      const entries = [{
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
        triggerAction: triggerAction,
        elapsedTime: timeInSeconds
      }]
      const query = INSERT.into(Memories).entries(entries);

      await tx.run(query);
      tx.commit();
      // this.memoryInfo.push(new MemoryInfo(triggerAction, memoryUsage))
      // // don't save more than 50 records
      // if (this.memoryInfo.length > 50) this.memoryInfo.splice(0, 1);
    } catch (ex: any) {
      console.log(ex.message)
      tx.rollback(ex);
    }
  }

  public async getMemoryInfo(triggerAction?: string) {
    const monitoringService = await cds.connect.to("MonitoringService");
    try {
      // if (triggerAction) {
      //   return this.memoryInfo.filter(entry => entry.triggerAction === triggerAction)
      // } else {
      //   return this.memoryInfo
      // }
      const { 'app1.db.monitoring.Memorys': Memories } = cds.entities
      const query = SELECT.from(Memories).orderBy('createdAt');

      return await monitoringService.run(query);
    } catch (ex: any) {
      console.log(ex.message)
    }
  }

  public getMemoryInfoAsJSON(triggerAction?: string) {
    return JSON.stringify(this.getMemoryInfo(triggerAction), null, 2);
  }

}
