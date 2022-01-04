import { getCDKT, getDataQuarter, getData4Mv2 } from "../services/index.js";
async function getAPI4M(req, res) {
  const data = await getData4Mv2(req.params.macongty);
  res.status(200).json(data);
}
async function getAPIQuarter(req, res) {
  const data = await getDataQuarter(req.params.macongty);
  res.status(200).json(data);
}
async function getAPICDKT(req, res) {
  const data = await getCDKT(req.params.macongty);
  res.status(200).json(data);
}
export { getAPI4M, getAPIQuarter, getAPICDKT };
