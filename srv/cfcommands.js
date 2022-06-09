const cds = require("@sap/cds");
const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const xsenv = require("@sap/xsenv");
xsenv.loadEnv();

const core = require("@sap-cloud-sdk/core");


async function restartApp(appName) {
  try {
    // get route id
    let res1 = await core.executeHttpRequest(
      { destinationName: "app1-cfapi" },
      {
        method: "GET",
        url: `/v3/apps?names=${appName}`,
      }
    );
    if (res1.data.resources.length > 0) {
      try {
        const appGuid = res1.data.resources[0].guid;
        // delete route
        let res2 = await core.executeHttpRequest(
          { destinationName: "app1-cfapi" },
          {
            method: "POST",
            url: `/v3/apps/${appGuid}/actions/restart`,
          }
        );
        console.log("App restarted: " + appName);
        return res2.data;
      } catch (err) {
        console.log(err.stack);
        return err.message;
      }
    } else {
      let errmsg = { error: `App ${appName} not found` };
      console.log(errmsg);
      return errmsg;
    }
  } catch (err) {
    console.log(err.stack);
    return err.message;
  }
}

module.exports = {
  restartApp,
};
