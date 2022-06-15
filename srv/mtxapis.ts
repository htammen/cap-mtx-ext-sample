import * as cds from "@sap/cds";
import * as cfenv from "cfenv";
import * as xsenv from "@sap/xsenv";
import log from "cf-nodejs-logging-support";
import axios from 'axios';

const appEnv = cfenv.getAppEnv();
xsenv.loadEnv();

import * as core from "@sap-cloud-sdk/core";

type AsyncUpgradeResponse = {
  jobID: string;
}
type GetJobStatusResponse = {
  error: any;
  status: string;
  result: any
}

async function delay(ms: number) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function upgradeBaseModel(auth: string, url: string, tenants?: string[]): Promise<string> {
  if (!tenants || tenants.length === 0 || tenants[0].trim() === '') {
    tenants = ['all']
  }
  const env = appEnv;
  try {
    // call POST mtx/v1/model/asyncUpgrade
    const mtxUrl = url + '/mtx/mtx/v1/model/asyncUpgrade';
    const { data } = await axios.post<AsyncUpgradeResponse>(mtxUrl,
      {
        "tenants": tenants,
        "autoundeploy": false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: auth
        }
      }
    );

    log.info('asynchronous upgrade of models executed');
    log.info(`jobid: ${data.jobID}`);
    return data.jobID;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      log.error('error', err);
      return err.message;
    } else {
      log.error('unexpected error', err);
      return 'An unexpected error occurred';
    }
  }
}

export async function waitForJob(jobID: string, url: string, auth: string): Promise<GetJobStatusResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const doGetJobStatus = async (jobID: string): Promise<any> => {
        const mtxUrl = url + '/mtx/mtx/v1/model/status/' + jobID;
        const { data } = await axios.get<GetJobStatusResponse>(mtxUrl,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: auth
            }
          }
        )
        return data;
      }

      let jobResult: GetJobStatusResponse = { status: "started", error: null, result: null };
      do {
        await delay(2000);
        jobResult = await doGetJobStatus(jobID);
      } while (!["FINISHED", "FAILED"].includes(jobResult.status))

      log.info('asynchronous upgrade of models executed and finished with ' + jobResult);
      resolve(jobResult);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        log.error('error', err);
        reject(err.message);
      } else {
        log.error('unexpected error', err);
        reject('An unexpected error occurred');
      }
    }
  });
}
