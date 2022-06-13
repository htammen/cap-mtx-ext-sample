"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var cds = require("@sap/cds");
var cf_nodejs_logging_support_1 = require("cf-nodejs-logging-support");
var cfcommands = require("./cfcommands");
// const cds = require("@sap/cds");
// const debug = require("debug")("srv:catalog-service");
// const log = require("cf-nodejs-logging-support");
// const cfcommands = require("./cfcommands");
// require("./error_helper");
// const cfcommand = require("./cfcommands");
// log.setLoggingLevel("info");
// log.registerCustomFields(["country", "amount"]);
exports["default"] = (function (srv) {
    var Sales = srv.entities.Sales;
    srv.after("READ", Sales, function (each) {
        if (each.amount > 500) {
            each.criticality = 3;
            if (each.comments === null)
                each.comments = "";
            else
                each.comments += " ";
            each.comments += "Exceptional!";
            cf_nodejs_logging_support_1["default"].info(each.comments, { country: each.country, amount: each.amount });
        }
        else if (each.amount < 150) {
            each.criticality = 1;
        }
        else {
            each.criticality = 2;
        }
    });
    srv.on("boost", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var ID, tx, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ID = req.params[0];
                    tx = cds.tx(req);
                    return [4 /*yield*/, tx
                            .update(Sales)["with"]({ amount: { "+=": 250 }, comments: "Boosted!" })
                            .where({ ID: { "=": ID } })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, {}];
                case 2:
                    err_1 = _a.sent();
                    console.error(err_1);
                    return [2 /*return*/, {}];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    srv.on("topSales", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var tx, results, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    tx = cds.tx(req);
                    return [4 /*yield*/, tx.run("CALL \"APP1_DB_SP_TopSales\"(?,?)", [
                            req.data.amount,
                        ])];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results];
                case 2:
                    err_2 = _a.sent();
                    console.error(err_2);
                    return [2 /*return*/, {}];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    srv.on("userInfo", function (req) {
        var results = {};
        results.user = req.user.id;
        if (req.user.hasOwnProperty("locale")) {
            results.locale = req.user.locale;
        }
        results.scopes = {};
        results.scopes.identified = req.user.is("identified-user");
        results.scopes.authenticated = req.user.is("authenticated-user");
        results.scopes.Viewer = req.user.is("Viewer");
        results.scopes.Admin = req.user.is("Admin");
        results.tenant = req.user.tenant;
        results.scopes.ExtendCDS = req.user.is("ExtendCDS");
        results.scopes.ExtendCDSdelete = req.user.is("ExtendCDSdelete");
        return results;
    });
    srv.on("activateExtension", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var service, results, aSnippets, extensions, _i, aSnippets_1, oSnippet, modelService, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cf_nodejs_logging_support_1["default"].info("Calling activateExtension action");
                    service = "CatalogService";
                    results = {};
                    aSnippets = req.data.aSnippets;
                    extensions = [];
                    for (_i = 0, aSnippets_1 = aSnippets; _i < aSnippets_1.length; _i++) {
                        oSnippet = aSnippets_1[_i];
                        extensions.push([oSnippet.sFilename, oSnippet.sCode]);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, cds.connect.to("ModelService")];
                case 2:
                    modelService = _a.sent();
                    //@ts-ignore
                    return [4 /*yield*/, modelService.activate(req.user.tenant, extensions)];
                case 3:
                    //@ts-ignore
                    _a.sent();
                    // the following emit worked in Günther's app so that a restart war not necessary
                    // but it doesn't work here
                    // TODO: find another solutions
                    //@ts-ignore
                    return [4 /*yield*/, cds.emit("served", cds.services)];
                case 4:
                    // the following emit worked in Günther's app so that a restart war not necessary
                    // but it doesn't work here
                    // TODO: find another solutions
                    //@ts-ignore
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    cf_nodejs_logging_support_1["default"].error("couldn't activate extension for ".concat(req.user.tenant));
                    return [3 /*break*/, 6];
                case 6:
                    results.tenant = req.user.tenant;
                    results.extension = JSON.stringify(extensions);
                    cf_nodejs_logging_support_1["default"].info("Finished activateExtension action");
                    return [2 /*return*/, results];
            }
        });
    }); });
    srv.on("deactivateExtension", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var files, modelService, apiResult, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cf_nodejs_logging_support_1["default"].info("Calling deactivateExtension action");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    files = req.data.files;
                    return [4 /*yield*/, cds.connect.to("ModelService")];
                case 2:
                    modelService = _a.sent();
                    return [4 /*yield*/, modelService.deactivate(req.user.tenant, files)];
                case 3:
                    apiResult = _a.sent();
                    // the following emit worked in Günther's app so that a restart war not necessary
                    // but it doesn't work here
                    // TODO: find another solutions
                    //@ts-ignore
                    return [4 /*yield*/, cds.emit("served", cds.services)];
                case 4:
                    // the following emit worked in Günther's app so that a restart war not necessary
                    // but it doesn't work here
                    // TODO: find another solutions
                    //@ts-ignore
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_2 = _a.sent();
                    cf_nodejs_logging_support_1["default"].error(JSON.stringify(e_2));
                    return [2 /*return*/, "error while deactivating extension. See logs for details"];
                case 6:
                    cf_nodejs_logging_support_1["default"].info("Finished deactivateExtension action");
                    return [2 /*return*/, "deactivateExtension executed successfully"];
            }
        });
    }); });
    srv.on("resetTenant", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var modelService, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cf_nodejs_logging_support_1["default"].info("Calling resetTenant action");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, cds.connect.to("ModelService")];
                case 2:
                    modelService = _a.sent();
                    //@ts-ignore
                    return [4 /*yield*/, modelService.reset(req.user.tenant)];
                case 3:
                    //@ts-ignore
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    cf_nodejs_logging_support_1["default"].error(JSON.stringify(e_3));
                    return [2 /*return*/, "error while resetting Tenant. See logs for details"];
                case 5:
                    cf_nodejs_logging_support_1["default"].info("Finished resetTenant action");
                    return [2 /*return*/, "resetTenant executed successfully"];
            }
        });
    }); });
    srv.on("upgradeBaseModel", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        var modelService, apiResult, e_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cf_nodejs_logging_support_1["default"].info("Calling upgradeBaseModel action");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, cds.connect.to("ModelService")];
                case 2:
                    modelService = _a.sent();
                    return [4 /*yield*/, modelService.upgrade([req.user.tenant])];
                case 3:
                    apiResult = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_4 = _a.sent();
                    cf_nodejs_logging_support_1["default"].error(JSON.stringify(e_4));
                    return [2 /*return*/, "error while resetting Tenant. See logs for details"];
                case 5:
                    cf_nodejs_logging_support_1["default"].info("Finshed upgradeBaseModel action");
                    return [2 /*return*/, "upgradeBaseModel executed successfully"];
            }
        });
    }); });
    srv.on("restartApp", function (req) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cf_nodejs_logging_support_1["default"].info("Calling restartApp action");
                    return [4 /*yield*/, cfcommands.restartApp("app1-srv")];
                case 1:
                    _a.sent();
                    cf_nodejs_logging_support_1["default"].info("Finished restartApp action");
                    return [2 /*return*/];
            }
        });
    }); });
    srv.on("dummy", function (req) {
        cf_nodejs_logging_support_1["default"].info("Calling dummy action");
        cf_nodejs_logging_support_1["default"].info("Finished dummy action");
        return "dummy executed successfully";
    });
    // srv.on('upgradeBaseModel', async (req) => {
    //   console.log('Calling upgradeBaseModel function');
    //   // just a copy of resetTenant.
    //   const modelService = await cds.connect.to('ModelService');
    //   const tx = modelService.tx(req);
    //   try {
    //     const apiResult = await tx.reset(req.user.tenant);
    //     tx.commit();
    //     console.log(apiResult);
    //   } catch(e) {
    //     tx.rollback();
    //     console.log(JSON.stringify(e));
    //     return 'error while resetting Tenant. See logs for details';
    //   }
    //   return 'upgradeBaseModel executed successfully'
    // })
    // srv.on('activateExtension', async (req) => {
    //   const service = 'CatalogService';
    //   let results = {};
    //   let tenant = req.user.tenant;
    //   let edmx;
    //   try {
    //     edmx = await cds.mtx.getEdmx(tenant, service);
    //   } catch(e) {
    //     console.error(`couldn't read edmx for ${tenant}`);
    //     edmx = '';
    //   }
    //   results.tenant = tenant;
    //   results.edmx = edmx;
    //   return results;
    // });
});
