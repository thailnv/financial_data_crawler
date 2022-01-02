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

async function findDataFromOtherSite(code, name, from, year) {
  console.log(`Find ${name} from cafef year: ${year}`);
  let source = {
    kqkd: "IncSta",
    lctt: "CashFlow",
    cdkt: "BSheet",
  };

  const htmlResponse = await fetch(
    `https://s.cafef.vn/bao-cao-tai-chinh/${code}/${source[from]}/${
      year + 3
    }/0/0/0/bao-cao.chn`
  );

  let htmlString = await htmlResponse.text();
  let htmlArr = htmlToArray(htmlString);

  return findDataFromHtml(htmlArr, name);
}

function htmlToArray(htmlString) {
  const root = parse(htmlString);
  const htmlTags = Array.from(root.querySelectorAll(".b_r_c"));
  let arr = htmlTags.map((v) => v.innerHTML.toString().toLowerCase());
  return arr;
}

function findDataFromHtml(arr, name) {
  let index = arr.findIndex((v) => v.includes(name));
  if (index === -1) return 0;
  let value = arr[index + 1].replace(/,/g, "");
  value = parseFloat(value);
  return value;
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

async function getData4Mv2(macongty) {
  try {
    const token =
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSIsImtpZCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4iLCJhdWQiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4vcmVzb3VyY2VzIiwiZXhwIjoxODg5NjIyNTMwLCJuYmYiOjE1ODk2MjI1MzAsImNsaWVudF9pZCI6ImZpcmVhbnQudHJhZGVzdGF0aW9uIiwic2NvcGUiOlsiYWNhZGVteS1yZWFkIiwiYWNhZGVteS13cml0ZSIsImFjY291bnRzLXJlYWQiLCJhY2NvdW50cy13cml0ZSIsImJsb2ctcmVhZCIsImNvbXBhbmllcy1yZWFkIiwiZmluYW5jZS1yZWFkIiwiaW5kaXZpZHVhbHMtcmVhZCIsImludmVzdG9wZWRpYS1yZWFkIiwib3JkZXJzLXJlYWQiLCJvcmRlcnMtd3JpdGUiLCJwb3N0cy1yZWFkIiwicG9zdHMtd3JpdGUiLCJzZWFyY2giLCJzeW1ib2xzLXJlYWQiLCJ1c2VyLWRhdGEtcmVhZCIsInVzZXItZGF0YS13cml0ZSIsInVzZXJzLXJlYWQiXSwianRpIjoiMjYxYTZhYWQ2MTQ5Njk1ZmJiYzcwODM5MjM0Njc1NWQifQ.dA5-HVzWv-BRfEiAd24uNBiBxASO-PAyWeWESovZm_hj4aXMAZA1-bWNZeXt88dqogo18AwpDQ-h6gefLPdZSFrG5umC1dVWaeYvUnGm62g4XS29fj6p01dhKNNqrsu5KrhnhdnKYVv9VdmbmqDfWR8wDgglk5cJFqalzq6dJWJInFQEPmUs9BW_Zs8tQDn-i5r4tYq2U8vCdqptXoM7YgPllXaPVDeccC9QNu2Xlp9WUvoROzoQXg25lFub1IYkTrM66gJ6t9fJRZToewCt495WNEOQFa_rwLCZ1QwzvL0iYkONHS_jZ0BOhBCdW9dWSawD6iF1SIQaFROvMDH1rg";

    const cstcDataResponse = await fetch(
      "https://e.cafef.vn/fi.ashx?symbol=" + macongty
    );

    let data = {};

    data.cstc = await cstcDataResponse.json();

    let result = [];

    let count = 0;

    for (let v of data.cstc) {
      count++;
      result.push({
        year: v.Year,
        EPS: v.EPS,
        ROA: v.ROA,
        ROE: v.ROE,
        BV: v.BV,
      });
      if (count === 6) break;
    }

    let lastYear = result[0].year;

    console.log(lastYear);

    const cdktDataResponse = await fetch(
      `https://restv2.fireant.vn/symbols/${macongty}/full-financial-reports?type=1&year=${lastYear}&quarter=0&limit=9`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    const kqkdDataResponse = await fetch(
      `https://restv2.fireant.vn/symbols/${macongty}/full-financial-reports?type=2&year=${lastYear}&quarter=0&limit=9`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    const lctt1DataResponse = await fetch(
      `https://restv2.fireant.vn/symbols/${macongty}/full-financial-reports?type=3&year=${lastYear}&quarter=0&limit=9`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    const lctt2DataResponse = await fetch(
      `https://restv2.fireant.vn/symbols/${macongty}/full-financial-reports?type=4&year=${lastYear}&quarter=0&limit=9`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    data.cdkt = await cdktDataResponse.json();
    data.kqkd = await kqkdDataResponse.json();

    let lctt1 = await lctt1DataResponse.json();
    let lctt2 = await lctt2DataResponse.json();

    if (!lctt1 && lctt2) data.lctt = lctt2;
    if (lctt1 && !lctt2) data.lctt = lctt1;
    if (lctt1 && lctt2) {
      data.lctt = [];

      let lctt1Length = lctt1.length;
      let lctt2Length = lctt2.length;

      if (lctt1Length > lctt2Length)
        lctt1.forEach((v) => {
          let rs = { ...v };
          // console.log(rs);
          let addData = lctt2.filter((l2) => l2.name === v.name)[0];
          if (addData) rs.values = rs.values.concat(addData.values);
          data.lctt.push(rs);
        });

      if (lctt2Length >= lctt1Length)
        lctt2.forEach((v) => {
          let rs = { ...v };
          let addData = lctt1.filter((l1) => l1.name === v.name)[0];
          // console.log(rs, addData);
          if (addData) rs.values = rs.values.concat(addData.values);
          data.lctt.push(rs);
        });
    }

    let dataNeeded = [
      {
        title: "Vốn chủ sở hữu",
        name: ["I. Vốn chủ sở hữu"],
        source: "cdkt",
      },
      {
        title: "Nợ dài hạn",
        name: ["Nợ dài hạn", "Nợ phải trả dài hạn"],
        source: "cdkt",
      },
      {
        title: "Tổng cộng tài sản",
        name: ["TỔNG CỘNG TÀI SẢN"],
        source: "cdkt",
      },
      {
        title: "Doanh thu thuần",
        name: [
          "Doanh thu thuần",
          "Cộng doanh thu hoạt động",
          "Doanh thu thuần hoạt động kinh doanh bảo hiểm",
        ],
        source: "kqkd",
      },
      {
        title: "Lợi nhuận sau thuế thu nhập doanh nghiệp",
        name: [
          "Lợi nhuận sau thuế thu nhập doanh nghiệp",
          "LỢI NHUẬN KẾ TOÁN SAU THUẾ TNDN",
        ],
        source: "kqkd",
      },
      {
        title: "Lợi nhuận thuần từ hoạt động kinh doanh",
        name: [
          "Lợi nhuận thuần từ hoạt động kinh doanh",
          "Lợi nhuận thuần hoạt động kinh doanh bảo hiểm",
        ],
        otherSiteName: "lợi nhuận thuần hoạt động kinh doanh bảo hiểm",
        source: "kqkd",
      },
      {
        title: "Lưu chuyển tiền thuần từ hoạt động kinh doanh",
        name: ["Lưu chuyển tiền thuần từ hoạt động kinh doanh"],
        otherSiteName: "lưu chuyển tiền thuần từ hoạt động kinh doanh",
        source: "lctt",
      },
    ];

    let result2 = [];
    for (let r of result) {
      let rs = { ...r };

      for (let v of dataNeeded) {
        let selectedData = data[v.source].filter((d) => {
          return v.name.filter((n) => {
            let rs = d.name.includes(n);
            return rs;
          })[0];
        })[0];

        if (!selectedData) {
          rs[v.title] = null;
          continue;
        }

        let selectedValue = selectedData.values.filter((d) => {
          return d.year === rs.year;
        })[0];

        rs[v.title] = selectedValue ? selectedValue.value : null;

        if (!rs[v.title] && v.otherSiteName)
          rs[v.title] = await findDataFromOtherSite(
            macongty,
            v.otherSiteName,
            v.source,
            rs.year
          );
      }

      result2.push(rs);
    }

    return result2;
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
        eps: report.eps,
      });
      count++;
    }
    if (count === 9) break;
  }

  return result;
}

export { getData4M, getDataQuarter, getData4Mv2 };
