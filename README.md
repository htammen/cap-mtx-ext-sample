# app1 - Basic CAP App (multitenancy)
> Simple multitenancy Business Application

This project demonstrates the possibilities of CAP Extensibility in a multitenant environment (mtx).  
Each tenant can extend the db and service layers of a SaaS application. All or some extensions can also be deleted later.  
The extensions are not hard coded but can be added at runtime of the app.

**This project uses typescript and ts-node. I have not added them to the package.json dependencies.
So they need to be installed as global packages.  
`npm i -g typescript`  
`npm i -g ts-node`**

## Project structure

This project is a regular CAP MTA project. As such it consists of the following folders / modules

- app - for UI development
- db - for database development
- srv - for service layer development

## Build and Deploy the app

- Build  
    - `cd <project root folder>`   
    - `npm run build`
- Deploy
    - make sure you are logged in to Cloud Foundry and the target points to your 
      provider subaccount and the correct space. (check with `cf target`)
    - `npm run deploy`

## Configuring and running the app

Before the app can be used you have to configure it.

### Configuration 

#### Configuring destination

The srv app uses the cloud foundry api for creating the tenant routes, when restarting the app and ...  
The access to this api is implemented via the destination service **app1-dest**.  

To configure this destination goto the subaccount and space where your app is deployed. Under **instances** find the instance **app1-dest**. 
Click on the destination to get to the dashboard. Under **destinations** click on **app1-cfapi**. Edit this destination.

- Enter a user (e-mail) and password who has the privilege to run cf commands (probably your user).
- _Necessary Hack_
    - enter any character into the `Client Secret` (otherwise you can't save)
    - Press **Save**
    - **Edit** the destination once again
    - Delete the character from the field `Client Secret`
    - Press **Save** again.

### Running the app

#### Running on BTP

To run the app on BTP you just have to create a subaccount and create a subscription for the app **Basic CAP app (multitenancy) - app1**.

The tenant route for your subaccount tenant should have been created automatically during the subscription process. If it is not available please
create it in your provider subaccount manually.

##### Assign role collections to users

The usage of the app is restricted to users with the roles **Viewer**, resp. **Admin** for the normal usage.
To be able to extend the service and db layers you additionally need the roles **ExtendCDS** and **ExtendCDSDelete**.

These roles are exposed via the role collections 

- app1_Viewer
- app1_Administrator
- app1_Extension_Developer
- app1_Extension_Developer_Delete

Hence assign these role collections to your user or any user who should work with the application.

##### Debug on BTP

- `cf enable-ssh app1-srv` (only needed once)
- `cf ssh app1-srv`
- `ps aux`
- find pid for **node /home/vcap/app/node_modules/.bin/cds run**
- `kill -usr1 <pid>` (starts nodejs in debugging mode)
- `exit` (exit ssh)
- `cf ssh -N -L 9229:127.0.0.1:9229 app1-srv`
- open chrome browser
- `chrome://inspect`
- Click **Open dedicated DevTools for Node**

#### Running on local PC (debugging)

To be able to run the apps (ui and srv) on your local PC you first have to 

- deploy it to BTP, 
- configure the destination,
- create a subaccount, 
- subscribe to the app and
- assign the role collections to your user

All these tasks are described above.

Additionally you have to do the following tasks

##### Load app environment

###### Load app environment for srv app

- `cd <project root folder>
- `cf de app1-srv` (the `DefaultEnv` cf plugin must be installed)

###### Load app environment for ui app

- `cd <project root folder>/app` (cd's into the ui module)
- `cf de app1`

###### Adjust app environment for ui app

To be able to work with a tenant environment you have to edit the downloaded environment config.

- Open `default-env.json` in an editor
- At the end add the following lines (overwrite the existing `destinations` entry.
    - "TENANT_HOST": "<your subaccount subdomain>-dev-app1.cfapps.eu20.hana.ondemand.com",
    - "EXTERNAL_REVERSE_PROXY": true,
    - "destinations": "[ {\n  \"forwardAuthToken\" : true,\n  \"name\" : \"srv\",\n  \"timeout\" : 60000,\n  \"url\" : \"http://localhost:4004\"\n} ]"
- Replace <your subaccount subdomain> with the subdomain of the tenant-subaccount you want to work with.
- Save the file

##### Start the srv app

- `npm run debug` or `npm run start_with_server` (the latter is without degugging)

If you want to debug the app open a (chromium) browser and enter the url `chrome://inspect`. 
Then choose **Open dedicated DevTools for Node**. You are now in the debugger and set breakpoints.

##### Start the ui app

- `cd <project root folder>
- `npm run start_local_ui`
- Enter the following url in your browser `http://localhost:5000/index.html`


## Description UI layer 

The UI application has two menu items at the startpage

### Fiori

The fiori app is a fiori elements app that allows you to manage the data of the Sales entity. With this app you can check that
the app writes data into the right HDI container.

### HTML5

The HTML5 app is more interesting. The menu items **Catalog** ... **User Info** are more or less self explaining.

- **Create Extension**. Allows you to create extensions in your current tenant.
- **Deactivate Extensions**. Allows you to deactivate one or more extensions in your tenant.
- **Upgrade Base Model**. TBD (does not really do anything at the moment)
- **Reset all Tenant Extensions**. Resets all extenstions that exist in the tenant.
- **Restart Application**. Restarts the application on the server. This is currently necessary after extensions
have been activated (created) or deactivated. After the dialog "Finished" is displayed wait another few seconds berfore
working with the application. The restart has not finished but just the triggering of the restart.

## Business logic

The business logic is implemented in srv layer. It uses the cds-mtx module. This module provides extend functionality which allows 
tenant specific extensions of the CAP application. 

To enable an app to use extend functionality it is necessary to add some configuration data to the app. This is done in the cds.mtx 
section of the package.json file or any of the other CAP configuration locations.

The configuration allows to enable and restrict extensions for specified artefacts (properties, entities, services). Without any configuration
the app can't be extended.

```
    "mtx": {
      "api": {
        "provisioning": true,
        "metadata": true,
        "model": true
      },
      "element-prefix": [
        "Z_",
        "ZZ_"
      ],
      "namespace-blocklist": [
        "com.sap.",
        "sap.",
        "app1."
      ],
      "extension-allowlist": [
        {
          "for": [
            "app1.db.Sales"
          ]
        },
        {
          "for": [
            "CatalogService"
          ],
          "kind": "service"
        }
      ]
    }
```

**element-prefix**

The element-prefix section defines prefixes the extensions must start with to be recognized as extensions. Only those artifacts (properties, entities, services) 
starting with this prefix(es) are valid extensions and are accepted by the mtx module.

**namespace-blocklist**

This section defines namespaces that are not allowed to extend.

**extension-allowlist**

This section defines artefacts (entities, services) that are allowed to be extended. If a tenant tries to extend another than these artefacts the
extension will be rejected.

## Troubleshooting / Hints

### Metadata not updated after redeployment of app

Problem:

After you altered the service layer (app1-srv) and deployed your changes to CF you don't see the changes in your existing tenants.

Solution:

Open the **Subscription Management Dashboard** in your provider subaccount and **Update** the tenants.
I'm working on an automatic update.

### When working on local PC I get [ERROR] GET - /v1/service_offerings - Query: {"fieldQuery":"catalog_name eq 'hana'"} - Could not fetch access token Request failed with status code 401

Problem:

After you have redeployed your application to the server you get this error message when working on your local PC cause the environment of the app has changed.

Solution:

Run `cf de app1-srv` to download the neweset VCAP environment from the server.
