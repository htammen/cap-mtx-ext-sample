#!/usr/bin/env zx

// import 'zx/globals'

const defEnvFile = 'default-env.json'
const tmpDir = './tmp_def_env'
const backendSrvApp = 'app-mtx-srv'

debugger;

$.verbose = false

echo`This application retrieves the service-manager from CFs ${backendSrvApp} applications environment
and saves it to default-env.json.
It creates a temporary directory ${tmpDir} that is deleted after the script executed. If it is still there
something went wrong and you can delete it.
You must be logged in to the CF org and space where the nxe-backend application is deployed. You can check
it by running 'cf a'.

This script additionally requires the DefaultEnv plugin to be installed.
This is available in the CF-Community plugin repo 
Add the repo to your repos: cf add-plugin-repo https://plugins.cloudfoundry.org
Install plugin: cf install-plugin DefaultEnv

options:
  --force
      does not answer if you are ready to go on. Please make sure that you are logged in to CF and SMCTL.
  --sm
      Output only service-manager environment variable
  --outputToStdout
      If this option is set the application does not write to default-env.json but outputs the results only to stdout
`

let bContinue = 'y'
if (!argv.force) {
  bContinue = await question('Are you ready (y/n) ')
}
if (bContinue === 'y') {

  // if parameter outputToConsole is passed we only output the collected data to stdout.
  // Otherwise we write it to default-env.json.
  const onlyOutputToStdout = argv.outputToStdout // process.argv[3] ? process.argv[3] == '--outputToStdout' : false
  const onlySM = argv.sm //process.argv[3] ? process.argv[3] == '--sm' : false

  // change to temporary directory.
  await fs.ensureDir(tmpDir)
  cd(tmpDir)
  await $`pwd`
  // write the environment of nxe-backend application to default-env.json in temp. directory.
  await $`cf de ${backendSrvApp}`
  // pull the service-manager entry from default-env.json
  const srvManagerOutput = await $`jq '.VCAP_SERVICES | ."service-manager"' < default-env.json` // > srvManager.json`
  const srvManager = JSON.parse(srvManagerOutput.stdout)

  let default_env_json

  if (!onlyOutputToStdout) {
    await $`FILE=../${defEnvFile}
if [ ! -f "$FILE" ]; then
    touch $FILE
    echo '{ "VCAP_SERVICES": {}}' >> $FILE
fi`
    // get default-env.json content from current directory
    default_env_json = await fs.readJson(`../${defEnvFile}`)

    // replace the service-manager credentials in default_env_json.
    default_env_json.VCAP_SERVICES['service-manager'] = srvManager
  }

  //------------------ G E T    D B  - I N S T A N C E S ---------------------------- 
  // This reads all tenant db instances / hdi container registered via service-manager, offers them in a list to select one
  // retrivess the credentials for the selected instance and writes those to the default-env.json 'hana' entry
  try {
    let hana
    let tenantId
    // if onlySM is not set we also read the db instances from the sercice-manager
    if (!onlySM) {
      const srvListOutput = await $`smctl list-instances -o json`
      const srvList = JSON.parse(srvListOutput.stdout)

      const dbServices = srvList.items.filter(item => {
        return item.labels.tenant_id
      })

      const dbServicesReduced = dbServices.map(s => { return { "org": s.context.organization_name, "space": s.context.space_name, "tenantId": s.labels.tenant_id[0] } })
      let dbServiceList = dbServicesReduced.map((s, idx) => { return `${idx}: ${s.org}, ${s.space}, ${s.tenantId}\n` })
      dbServiceList = ['IDX, Org, Space, Tenant\n'].concat(...dbServiceList)
      echo`${dbServiceList}`

      const dbToUse = await question('Which tenant database do you want to connect to (Enter a number)? ')
      echo`You selected ${dbToUse}`

      tenantId = dbServices[dbToUse].labels.tenant_id[0]

      const bindingListOutput = await $`smctl list-bindings -o json`
      const bindingList = JSON.parse(bindingListOutput.stdout)

      const oBinding = bindingList.items.find(b => b.service_instance_name === dbServices[dbToUse].name)
      const aBinding = [oBinding]

      hana = await createHANA(oBinding)

      if (!onlyOutputToStdout) {
        // echo`Here are the credentials of the db.\nThey are automatically added to your default-env.json file.\n${JSON.stringify(oBinding.credentials, null, 2)}`
      }

      if (!onlyOutputToStdout) {
        // default_env_json.VCAP_SERVICES['hana']['credentials'] = oBinding.credentials
        default_env_json.VCAP_SERVICES['hana'] = hana
      }
      //------------------ G E T    D B  - I N S T A N C E S ---------------------------- 
    }

    if (!onlyOutputToStdout) {
      // write the default-env.json file to disk
      fs.writeJsonSync(`../${defEnvFile}`, default_env_json)
    }


    //------------------------- U P D A T E    . C D S R C . J S O N -----------------------
    if(!onlySM && !onlyOutputToStdout) {
      await updateCDSRC(tenantId, onlyOutputToStdout)
    }
    //------------------------- U P D A T E    . C D S R C . J S O N -----------------------


    // remove temporary directory
    cd('..')
    await $`rm -rf ${tmpDir}`
    // echo `${JSON.stringify(default_env_json, null, 2)}`

    if (!onlyOutputToStdout) {
      // display the default-env.json to verify modified time
      echo`${chalk.greenBright('Please check if the modified time of the default-env.json file has changed')}`
      $.verbose=true
      await $`ls -la --full-time ${defEnvFile}`
      $.verbose=false
    }

    if (onlyOutputToStdout) {
      echo`${chalk.green('----------------------------------------------------------------------------------------------------------------')}`
      echo`${chalk.green('---------------------- O U T P U T -----------------------------------------------------------------------------')}`
      echo`${chalk.green('----------------------------------------------------------------------------------------------------------------')}`      // we write the collected data to stdout
      echo`"service-manager":
      ${JSON.stringify(srvManager, null, 2)}
      `
      echo`"hana":
      ${JSON.stringify(hana, null, 2)}
      `
      echo`chosen tenantId: ${tenantId}`
      echo`${chalk.green('----------------------------------------------------------------------------------------------------------------')}`
    }

  } catch (ex) {
    console.log(JSON.stringify(ex, null, 2))
    console.log(chalk.red(`Are you logged in to SMCTL?`))
  }
}

async function createHANA(oBinding) {
  const devEnvHanaTemplate = '../default-env.json.template'
  const template = await fs.readJson(`${devEnvHanaTemplate}`)
  const hana = template.VCAP_SERVICES.hana[0]
  const orgName = oBinding.context.organization_name
  const spaceName = oBinding.context.space_name
  const endPoint = `https://api.cf.${oBinding.context.region.replace('cf-', '')}.hana.ondemand.com`
  const displayName = oBinding.context.instance_name
  const credentials = oBinding.credentials

  hana.credentials = credentials
  hana.instance_name = displayName
  hana.name = displayName
  hana.tags = hana.tags.map(x => {
    x = x.replace('<display-name>', displayName)
    x = x.replace('<cf-api-endpoint>', endPoint)
    x = x.replace('<cf-org>', orgName)
    x = x.replace('<cf-space>', spaceName)
    return x
  })
  return [hana]
}

/**
 * update .cdsrc.json, user bob with given tenantId 
 */
async function updateCDSRC(sTenantId, onlyOutputToStdout) {
  const cdsrcName = '../.cdsrc.json'
  const cdsrc = await fs.readJson(`${cdsrcName}`)
  const bob = cdsrc.requires.auth['[development]'].users?.bob
  if (!onlyOutputToStdout) {
    if (bob) {
      cdsrc.requires.auth['[development]'].users.bob.tenant = sTenantId
      fs.writeFileSync(cdsrcName, JSON.stringify(cdsrc, null, 4))
    }
  } else {
    // echo`chosen tenantId: ${sTenantId}`
  }
}
