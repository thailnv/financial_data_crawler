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
        title: "V???n ch??? s??? h???u",
        name: ["I. V???n ch??? s??? h???u"],
        source: "cdkt",
      },
      {
        title: "N??? d??i h???n",
        name: ["N??? d??i h???n", "N??? ph???i tr??? d??i h???n"],
        source: "cdkt",
      },
      {
        title: "T???ng c???ng t??i s???n",
        name: ["T???NG C???NG T??I S???N"],
        source: "cdkt",
      },
      {
        title: "Doanh thu thu???n",
        name: [
          "Doanh thu thu???n",
          "C???ng doanh thu ho???t ?????ng",
          "Doanh thu thu???n ho???t ?????ng kinh doanh b???o hi???m",
        ],
        source: "kqkd",
      },
      {
        title: "L???i nhu???n sau thu??? thu nh???p doanh nghi???p",
        name: [
          "L???i nhu???n sau thu??? thu nh???p doanh nghi???p",
          "L???I NHU???N K??? TO??N SAU THU??? TNDN",
        ],
        source: "kqkd",
      },
      {
        title: "L???i nhu???n thu???n t??? ho???t ?????ng kinh doanh",
        name: [
          "L???i nhu???n thu???n t??? ho???t ?????ng kinh doanh",
          "L???i nhu???n thu???n ho???t ?????ng kinh doanh b???o hi???m",
          "K???T QU??? HO???T ?????NG",
        ],
        otherSiteName: "l???i nhu???n thu???n ho???t ?????ng kinh doanh b???o hi???m",
        source: "kqkd",
      },
      {
        title: "L??u chuy???n ti???n thu???n t??? ho???t ?????ng kinh doanh",
        name: ["L??u chuy???n ti???n thu???n t??? ho???t ?????ng kinh doanh"],
        otherSiteName: "l??u chuy???n ti???n thu???n t??? ho???t ?????ng kinh doanh",
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

async function getCDKT(macongty) {
  try {
    const token =
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSIsImtpZCI6IkdYdExONzViZlZQakdvNERWdjV4QkRITHpnSSJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4iLCJhdWQiOiJodHRwczovL2FjY291bnRzLmZpcmVhbnQudm4vcmVzb3VyY2VzIiwiZXhwIjoxODg5NjIyNTMwLCJuYmYiOjE1ODk2MjI1MzAsImNsaWVudF9pZCI6ImZpcmVhbnQudHJhZGVzdGF0aW9uIiwic2NvcGUiOlsiYWNhZGVteS1yZWFkIiwiYWNhZGVteS13cml0ZSIsImFjY291bnRzLXJlYWQiLCJhY2NvdW50cy13cml0ZSIsImJsb2ctcmVhZCIsImNvbXBhbmllcy1yZWFkIiwiZmluYW5jZS1yZWFkIiwiaW5kaXZpZHVhbHMtcmVhZCIsImludmVzdG9wZWRpYS1yZWFkIiwib3JkZXJzLXJlYWQiLCJvcmRlcnMtd3JpdGUiLCJwb3N0cy1yZWFkIiwicG9zdHMtd3JpdGUiLCJzZWFyY2giLCJzeW1ib2xzLXJlYWQiLCJ1c2VyLWRhdGEtcmVhZCIsInVzZXItZGF0YS13cml0ZSIsInVzZXJzLXJlYWQiXSwianRpIjoiMjYxYTZhYWQ2MTQ5Njk1ZmJiYzcwODM5MjM0Njc1NWQifQ.dA5-HVzWv-BRfEiAd24uNBiBxASO-PAyWeWESovZm_hj4aXMAZA1-bWNZeXt88dqogo18AwpDQ-h6gefLPdZSFrG5umC1dVWaeYvUnGm62g4XS29fj6p01dhKNNqrsu5KrhnhdnKYVv9VdmbmqDfWR8wDgglk5cJFqalzq6dJWJInFQEPmUs9BW_Zs8tQDn-i5r4tYq2U8vCdqptXoM7YgPllXaPVDeccC9QNu2Xlp9WUvoROzoQXg25lFub1IYkTrM66gJ6t9fJRZToewCt495WNEOQFa_rwLCZ1QwzvL0iYkONHS_jZ0BOhBCdW9dWSawD6iF1SIQaFROvMDH1rg";

    const cdktDataResponse = await fetch(
      `https://restv2.fireant.vn/symbols/${macongty}/full-financial-reports?type=1&year=2020&quarter=0&limit=9`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      }
    );

    let data = {};

    let result = [];

    let dataNeeded = [
      {
        title: "Tien va cac khoang tuong duong tien",
        name: ["Ti???n"],
      },
      {
        title: "Cac khoan dau tu tai chinh ngan han",
        name: ["C??c kho???n ?????u t?? t??i ch??nh ng???n h???n"],
      },
      {
        title: "Cac khoan phai thu ngan han",
        name: ["C??c kho???n ph???i thu ng???n h???n", "C??c kho???n ph???i thu"],
      },
      {
        title: "Hang ton kho",
        name: ["H??ng t???n kho"],
      },
      {
        title: "Tai san ngan han khac",
        name: ["T??i s???n ng???n h???n kh??c"],
      },
      {
        title: "Cac khoang phai thu dai han",
        name: ["Kho???ng ph???i thu d??i h???n", "C??c kho???n ph???i thu d??i h???n"],
      },
      {
        title: "Tai san co dinh",
        name: ["T??i s???n c??? ?????nh"],
      },
      {
        title: "Bat dong san dau tu",
        name: ["B???t ?????ng s???n ?????u t??"],
      },
      {
        title: "Dau tu tai chinh dai han",
        name: [
          "?????u t?? t??i ch??nh d??i h???n",
          "C??c kho???n ?????u t?? t??i ch??nh d??i h???n",
          "C??c kho???n ?????u t??",
        ],
      },
      {
        title: "Tai san dai han khac",
        name: ["T???ng t??i s???n d??i h???n kh??c"],
      },
      {
        title: "Tai san do dang dai han",
        name: ["T??i s???n d??? dang d??i h???n", "Chi ph?? d??? dang"],
      },
    ];

    data.cdkt = await cdktDataResponse.json();

    let dataLength = data.cdkt[0].values.length;

    if (dataLength < 6) {
      console.log(data.cdkt[0][dataLength - 1].year);
    }

    let count = 0;

    for (let i = dataLength - 1; i >= 0; i--) {
      result.push({
        year: data.cdkt[0].values[i].year,
      });
      count++;
      if (count === 6) break;
    }

    console.log(result);

    let result2 = [];
    for (let r of result) {
      let rs = { ...r };

      for (let v of dataNeeded) {
        let allSelectedData = data.cdkt.filter((d) => {
          return v.name.filter((n) => {
            let rs = d.name.includes(n);
            return rs;
          })[0];
        });

        let selectedDataIndex = 0;
        let minNameLength = 9999;

        let selectedData = null;

        allSelectedData.forEach((s, i) => {
          if (s.name.length < minNameLength) {
            minNameLength = s.name.length;
            selectedDataIndex = i;
          }
        });

        selectedData = allSelectedData[selectedDataIndex];

        if (!selectedData) {
          rs[v.title] = 0;
          continue;
        }

        let selectedValue = selectedData.values.filter((d) => {
          return d.year === rs.year;
        })[0];

        rs[v.title] = selectedValue ? selectedValue.value : 0;

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

export { getCDKT, getDataQuarter, getData4Mv2 };
