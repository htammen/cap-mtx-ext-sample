import * as cds from "@sap/cds";
// import * as cfenv from "cfenv";
import * as xsenv from "@sap/xsenv";
// const appEnv = cfenv.getAppEnv();
xsenv.loadEnv();

import * as core from "@sap-cloud-sdk/core";


export async function restartApp(appName: any) {
  try {
    // get route id
    const res1 = await core.executeHttpRequest(
      { destinationName: "app-mtx-cfapi" },
      {
        method: "GET",
        url: `/v3/apps?names=${appName}`,
      }
    );
    if (res1.data.resources.length > 0) {
      try {
        const appGuid = res1.data.resources[0].guid;
        // delete route
        const res2 = await core.executeHttpRequest(
          { destinationName: "app-mtx-cfapi" },
          {
            method: "POST",
            url: `/v3/apps/${appGuid}/actions/restart`,
          }
        );
        console.log("App restarted: " + appName);
        return res2.data;
      } catch (err: any) {
        console.log(err.stack);
        return err.message;
      }
    } else {
      const errmsg = { error: `App ${appName} not found` };
      console.log(errmsg);
      return errmsg;
    }
  } catch (err: any) {
    console.log(err.stack);
    return err.message;
  }
}

