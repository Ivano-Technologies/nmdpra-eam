"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMvpPdf = void 0;
const generatePdf_1 = require("../pdf/generatePdf");
const renderMvpReport_1 = require("./renderMvpReport");
const buildMvpPdf = async (data) => {
    const html = (0, renderMvpReport_1.renderMvpReportHtml)(data);
    return (0, generatePdf_1.generatePdfFromHtml)(html);
};
exports.buildMvpPdf = buildMvpPdf;
