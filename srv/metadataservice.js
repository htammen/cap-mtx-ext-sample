"use strict";
//ts-ignore: 
const Tenant = require('@sap/cds-mtx/lib/tenant/index');
module.exports = (service) => {
    service.on('READ', 'csn', async (context, next) => {
        // we need this "hack" to transfer the user context (JWT) to the mtx backend.
        // Otherwise we get a not authorized error.
        // @ts-ignore('later')
        // context._.res = cds.context._.res;
        // // @ts-ignore('later')
        // context._.req = cds.context._.req;
        // const { tenantId } = context.data;
        // const timestamps = await Tenant.getTimestamps(tenantId);
        // let eTag = HttpHelper.getETag(timestamps);
        // eTag = eTag.substr(1,eTag.length-2)
        // eTag = `"${eTag}"`
        // context._.req.headers['if-none-match'] = eTag
        // await next();
        const tenantId = cds.context.req.user.tenant;
        return await Tenant.getModel(tenantId, 'csn');
    });
};
//# sourceMappingURL=metadataservice.js.map