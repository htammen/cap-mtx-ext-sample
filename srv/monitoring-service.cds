using {app1.db.monitoring as dbm} from '../db/monitoring-model';

service MonitoringService @(path : '/monitoring')
@(requires: 'authenticated-user')
{
  entity Memorys as select from dbm.Memorys {*};
  function deleteAllMonitoringData(triggerAction: String) returns String;
};
