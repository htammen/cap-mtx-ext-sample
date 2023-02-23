using {app_mtx.db as db} from '../db/data-model';
using {app_mtx.db.monitoring as dbm} from '../db/monitoring-model';

using {CV_SALES, CV_SESSION_INFO} from '../db/data-model';

service CatalogService @(path : '/catalog')
@(requires: 'authenticated-user')
{
    type activateExtType { tenant: String; extension: String };
    type codeSnippetType { sFilename: String(60); sCode: LargeString };
    action activateExtension(aSnippets: many codeSnippetType) returns activateExtType;
    action deactivateExtension(files: many String(60)) returns String;
    action upgradeBaseModel() returns String;
    action upgradeBaseModelAPI(tenantid: String) returns String;
    action resetTenant() returns String;
    function readTenantMetadata() returns String;
    function clearMetadataCache() returns String;
    action dummy() returns String;
    function restartApp(appName: String(60)) returns String;
    function insertZCustom2() returns String;

    entity Sales
      @(restrict: [{ grant: ['READ'],
                     to: 'Viewer'
                   },
                   { grant: ['WRITE'],
                     to: 'Admin' 
                   }
                  ])
      as select * from db.Sales
      actions {
        @(restrict: [{ to: 'Admin' }])
        action boost();
      }
    ;

    @readonly
    entity VSales
      @(restrict: [{ to: 'Viewer' }])
      as select * from CV_SALES
    ;

    @readonly
    entity SessionInfo
      @(restrict: [{ to: 'Viewer' }])
      as select * from CV_SESSION_INFO
    ;

    function topSales
      @(restrict: [{ to: 'Viewer' }])
      (amount: Integer)
      returns many Sales;


    type userScopes { identified: Boolean; authenticated: Boolean; Viewer: Boolean; Admin: Boolean; ExtendCDS: Boolean; ExtendCDSdelete: Boolean;};
    type userType { user: String; locale: String; tenant: String; scopes: userScopes; authorization: String};
    function userInfo() returns userType;

};
