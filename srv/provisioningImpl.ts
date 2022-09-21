import { Service } from "@sap/cds/apis/services";
import * as xsenv from "@sap/xsenv";

export = (service: Service) => {

  service.on('dependencies', (req, next) => {
    // debugger;
    const dependencies = [];
    //@ts-ignore
    const services = xsenv.readServices();
    const arrServices = Object.values(services);

    for (const service of arrServices) {
      //@ts-ignore
      const xsappname = service.credentials.uaa ? service.credentials.uaa.xsappname : service.credentials.xsappname;
      if (xsappname) {
        dependencies.push({ 'xsappname': xsappname });
      }
    }
  })
};
