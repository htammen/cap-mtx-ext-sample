import { Service } from "@sap/cds/apis/services";

import * as cds from "@sap/cds";
import * as cfenv from "cfenv";
import * as xsenv from "@sap/xsenv";
import log from "cf-nodejs-logging-support";

/**
 * registry definition needed here.
 */
interface IRegistry {
  registry: {
    appName: string
  }
}

const appEnv = cfenv.getAppEnv();

class ProvisioningHelper {

  private core = require('@sap-cloud-sdk/core');
  private services: any

  public getServices(): IRegistry {
    if (!this.services) {
      xsenv.loadEnv();
      this.services = xsenv.getServices({
        registry: { tag: 'SaaS' }
      }) as unknown as IRegistry;
    }
    return this.services
  }

  public async getCFInfo(appname: string) {
    try {
      // get app GUID
      let res1 = await this.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
        method: 'GET',
        url: '/v3/apps?organization_guids=' + appEnv.app.organization_id + '&space_guids=' + appEnv.app.space_id + '&names=' + appname
      });
      // get domain GUID
      let res2 = await this.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
        method: 'GET',
        url: '/v3/domains?names=' + /\.(.*)/gm.exec(appEnv.app.application_uris[0])![1]
      });
      let results = {
        'app_id': res1.data.resources[0].guid,
        'domain_id': res2.data.resources[0].guid
      };
      return results;
    } catch (err: any) {
      console.log(err.stack);
      return err.message;
    }
  };

  public async createRoute(tenantHost: string, appname: string) {
    const that = this
    this.getCFInfo(appname).then(
      async function(CFInfo) {
        try {
          // create route
          let res1 = await that.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
            method: 'POST',
            url: '/v3/routes',
            data: {
              'host': tenantHost,
              'relationships': {
                'space': {
                  'data': {
                    'guid': appEnv.app.space_id
                  }
                },
                'domain': {
                  'data': {
                    'guid': CFInfo.domain_id
                  }
                }
              }
            },
          });
          // map route to app
          let res2 = await that.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
            method: 'POST',
            url: '/v3/routes/' + res1.data.guid + '/destinations',
            data: {
              'destinations': [{
                'app': {
                  'guid': CFInfo.app_id
                }
              }]
            },
          });
          console.log('Route created for ' + tenantHost);
          return res2.data;
        } catch (err: any) {
          console.log(err.stack);
          return err.message;
        }
      },
      function(err) {
        console.log(err.stack);
        return err.message;
      });
  };

  public async deleteRoute(tenantHost: string, appname: string) {
    const that = this
    this.getCFInfo(appname).then(
      async function(CFInfo) {
        try {
          // get route id
          let res1 = await that.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
            method: 'GET',
            url: '/v3/apps/' + CFInfo.app_id + '/routes?hosts=' + tenantHost
          });
          if (res1.data.pagination.total_results === 1) {
            try {
              // delete route
              let res2 = await that.core.executeHttpRequest({ destinationName: 'app1-cfapi' }, {
                method: 'DELETE',
                url: '/v3/routes/' + res1.data.resources[0].guid
              });
              console.log('Route deleted for ' + tenantHost);
              return res2.data;
            } catch (err: any) {
              console.log(err.stack);
              return err.message;
            }
          } else {
            let errmsg = { 'error': 'Route not found' };
            console.log(errmsg);
            return errmsg;
          }
        } catch (err: any) {
          console.log(err.stack);
          return err.message;
        }
      },
      function(err) {
        console.log(err.stack);
        return err.message;
      });
  };

}

const provisioningHelper = new ProvisioningHelper()

export = (service: Service) => {

  service.on('UPDATE', 'tenant', async (req, next) => {
    let tenantHost = req.data.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + provisioningHelper.getServices().registry.appName.toLowerCase().replace(/_/g, '-');
    let tenantURL = 'https:\/\/' + tenantHost + /\.(.*)/gm.exec(appEnv.app.application_uris[0])![0];
    console.log('Subscribe: ', req.data.subscribedSubdomain, req.data.subscribedTenantId, tenantHost);
    await next();
    provisioningHelper.createRoute(tenantHost, provisioningHelper.getServices().registry.appName).then(
      function(res2) {
        console.log('Subscribe: - Create Route: ', req.data.subscribedTenantId, tenantHost, tenantURL);
        return tenantURL;
      },
      function(err) {
        log.debug(err.stack);
        return '';
      });
    return tenantURL;
  });

  service.on('DELETE', 'tenant', async (req, next) => {
    let tenantHost = req.data.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + provisioningHelper.getServices().registry.appName.toLowerCase().replace(/_/g, '-');
    console.log('Unsubscribe: ', req.data.subscribedSubdomain, req.data.subscribedTenantId, tenantHost);
    await next();
    provisioningHelper.deleteRoute(tenantHost, provisioningHelper.getServices().registry.appName).then(
      async function(res2) {
        console.log('Unsubscribe: - Delete Route: ', req.data.subscribedTenantId);
        return req.data.subscribedTenantId;
      },
      function(err) {
        log.debug(err.stack);
        return '';
      });
    return req.data.subscribedTenantId;
  });

  service.on('upgradeTenant', async (req, next) => {
    await next();
    // @ts-ignore('later')
    const { instanceData, deploymentOptions } = cds.context.req.body;
    console.log('UpgradeTenant: ', req.data.subscribedTenantId, req.data.subscribedSubdomain, instanceData, deploymentOptions);
  });

}
