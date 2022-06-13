import { Service } from "@sap/cds/apis/services";

export = (service: Service) => {

    service.on('reset', async (context, next) => {
        try {
          // we need this "hack" to transfer the user context (JWT) to the mtx backend.
          // Otherwise we get a not authorized error.
          // @ts-ignore('later')
          context._.req = cds.context._.req
          await next();
        } catch (error: any) {
          console.log(error.message);
            // HttpHelper.handleError(context, error);
        }
    });

    service.on('upgrade', async (context, next) => {
        try {
          // we need this "hack" to transfer the user context (JWT) to the mtx backend.
          // Otherwise we get a not authorized error.
          // @ts-ignore('later')
          context._.req = cds.context._.req
          await next();
        } catch (error: any) {
          console.log(error.message);
            // HttpHelper.handleError(context, error);
        }
    });

    service.on('deactivate', async (context, next) => {
        try {
          // we need this "hack" to transfer the user context (JWT) to the mtx backend.
          // Otherwise we get a not authorized error.
          // @ts-ignore('later')
          context._.req = cds.context._.req
          context.data.extension_files = context.data.extension;
          await next();
        } catch (error: any) {
          console.log(error.message);
            // HttpHelper.handleError(context, error);
        }
    });

    service.on('activate', async (context, next) => {
        try {
          // we need this "hack" to transfer the user context (JWT) to the mtx backend.
          // Otherwise we get a not authorized error.
          // @ts-ignore('later')
          context._.req = cds.context._.req
          await next();
        } catch (error: any) {
          console.log(error.message);
            // HttpHelper.handleError(context, error);
        }
    });

};
