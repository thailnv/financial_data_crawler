import fetch from "node-fetch";
import { parse } from "node-html-parser";
function mapping(template, data, year, name, mArr) {
  let selectedData = data.filter((v) => v.year === year)[0];
  if (!selectedData) {
    mArr.indexOf(year) === -1 && mArr.push(year);
    return "error";
  }
  let selectedCode = template.filter((v) => v.Name === name)[0];
  let keys = Object.keys(selectedData);
  let selectedKey = keys.filter(
    (v) => v.toLowerCase() === selectedCode.Code.toLowerCase()
  );
  return selectedData[selectedKey];
}
function findDataFromHtml(arr, name) {
  let index = arr.findIndex((v) => v.includes(name));
  if (index === -1) return 0;
  let value = arr[index + 1].replace(/,/g, "");
  value = parseFloat(value);
  return value;
}
function htmlToArray(htmlString) {
  const root = parse(htmlString);
  const htmlTags = Array.from(root.querySelectorAll(".b_r_c"));
  let arr = htmlTags.map((v) => v.innerHTML.toString().toLowerCase());
  return arr;
}
async function getData4M(macongty) {
  try {
    console.log(macongty);
    const cstcDataResponse = await fetch(
      "https://e.cafef.vn/fi.ashx?symbol=" + macongty
    );

    const kqhdkdTemplateResponse = await fetch(
      `https://cdn.fialda.com//FinancialStatementTemplates/IncomeStatement_General_MappingTemplate.json?version=1.0.7.0`
    );

    const kqhdkdDataResponse = await fetch(
      `https://fwtapi2.fialda.com/api/services/app/StockInfo/GetFS_IncomeStatement_General?symbol=${macongty}&isQuarterReport=false`
    );

    const cdktTemplateResponse = await fetch(
      "https://cdn.fialda.com//FinancialStatementTemplates/BalanceSheet_General_MappingTemplate.json?version=1.0.7.0"
    );
    const cdktDataResponse = await fetch(
      `https://fwtapi2.fialda.com/api/services/app/StockInfo/GetFS_BalanceSheet_General?symbol=${macongty}&isQuarterReport=false`
    );

    const lcttTemplateResponse = await fetch(
      "https://cdn.fialda.com//FinancialStatementTemplates/Cashflow_General_MappingTemplate.json?version=1.0.7.0"
    );

    const lcttDataResponse = await fetch(
      `https://fwtapi1.fialda.com/api/services/app/StockInfo/GetFS_Cashflow_General?symbol=${macongty}&isQuarterReport=false`
    );

    let data = {};
    let template = {};

    data.cstc = await cstcDataResponse.json();

    data.kqhdkd = await kqhdkdDataResponse.json();
    template.kqhdkd = await kqhdkdTemplateResponse.json();

    data.cdkt = await cdktDataResponse.json();
    template.cdkt = await cdktTemplateResponse.json();

    data.lctt = await lcttDataResponse.json();
    template.lctt = await lcttTemplateResponse.json();

    //const result = data.result.map((v) => { return { year: v.year, quarter: v.quarter, eps: v.eps } });
    // if (result[0].eps === null) {
    //   return [];
    // }

    let dataNeeded = [
      {
        name: "Doanh thu thuần",
        otherName: "doanh thu thuần về bán hàng và cung cấp dịch vụ",
        source: "kqhdkd",
        otherSource: "kqhdkdHtml",
      },
      {
        name: "Lợi nhuận sau thuế thu nhập doanh nghiệp",
        otherName: "lợi nhuận sau thuế thu nhập doanh nghiệp",
        source: "kqhdkd",
        otherSource: "kqhdkdHtml",
      },
      {
        name: "Vốn chủ sở hữu",
        otherName: "vốn chủ sở hữu",
        source: "cdkt",
        otherSource: "cdktHtml",
      },
      {
        name: "Nợ dài hạn",
        otherName: "nợ dài hạn",
        source: "cdkt",
        otherSource: "cdktHtml",
      },
      {
        name: "TỔNG CỘNG TÀI SẢN",
        otherName: "tổng cộng tài sản",
        source: "cdkt",
        otherSource: "cdktHtml",
      },
      {
        name: "Lợi nhuận thuần từ hoạt động kinh doanh",
        otherName: "lợi nhuận thuần từ hoạt động kinh doanh",
        source: "kqhdkd",
        otherSource: "kqhdkdHtml",
      },
      {
        name: "Lưu chuyển tiền thuần từ hoạt động kinh doanh",
        otherName: "lưu chuyển tiền thuần từ hoạt động kinh doanh",
        source: "lctt",
        otherSource: "lcttHtml",
      },
    ];

    let missingYearList = [];

    let result = data.cstc.filter((v) => v.Year >= 2015);
    result = result.map((v) => {
      let rs = {
        year: v.Year,
        EPS: v.EPS,
        ROA: v.ROA,
        ROE: v.ROE,
        BV: v.BV,
      };
      rs = dataNeeded.reduce((r, d) => {
        let tmp = {
          ...r,
          [d.name.toLowerCase()]: mapping(
            template[d.source],
            data[d.source].result,
            r.year,
            d.name,
            missingYearList
          ),
        };
        return tmp;
      }, rs);
      return rs;
    });

    if (!missingYearList.length) return result;

    console.log(missingYearList);

    const cdktHtmlResponse = await fetch(
      `https://s.cafef.vn/bao-cao-tai-chinh/${macongty}/BSheet/2018/0/0/0/bao-cao-tai-chinh-cong-ty-co-phan-tap-doan-hoa-phat.chn`
    );

    const kqhdkdHtmlResponse = await fetch(
      `https://s.cafef.vn/bao-cao-tai-chinh/${macongty}/IncSta/2018/0/0/0/bao-cao-tai-chinh-cong-ty-co-phan-tap-doan-hoa-phat.chn`
    );

    const lcttHtmlResponse = await fetch(
      `https://s.cafef.vn/bao-cao-tai-chinh/${macongty}/CashFlow/2018/0/0/0/luu-chuyen-tien-te-truc-tiep-cong-ty-co-phan-tap-doan-hoa-phat.chn`
    );

    let cdktHtmlString = await cdktHtmlResponse.text();
    data.cdktHtml = htmlToArray(cdktHtmlString);

    let kqhdkdHtmlString = await kqhdkdHtmlResponse.text();
    data.kqhdkdHtml = htmlToArray(kqhdkdHtmlString);

    let lcttHtmlString = await lcttHtmlResponse.text();
    data.lcttHtml = htmlToArray(lcttHtmlString);

    result = result.map((v) => {
      let rs = { ...v };
      if (missingYearList.indexOf(v.year) !== -1) {
        rs = dataNeeded.reduce((r, v) => {
          return {
            ...r,
            [v.name.toLowerCase()]: findDataFromHtml(
              data[v.otherSource],
              v.otherName
            ),
          };
        }, rs);
      }
      return rs;
    });

    return result;
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function getDataQuarter(macongty) {
  const response = await fetch(
    `https://api5.fialda.com/api/services/app/TechnicalAnalysis/GetFinancialHighlights?symbol=${macongty}`
  );

  let data = await response.json();
  let result = [];

  let count = 0;

  for (let i = data.result.length; i >= 0; i--) {
    let report = { ...data.result[i] };
    if (report.quarter < 5 && report.quarter > 0) {
      result.push({
        year: report.year,
        quarter: report.quarter,
        sale: report.netSale,
      });
      count++;
    }
    if (count === 9) break;
  }

  return result;
}

export { getData4M, getDataQuarter };
