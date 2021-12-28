import { getData4M, getDataQuarter } from "../services/index.js";
async function getAPI4M(req, res) {
  const data = await getData4M(req.params.macongty);
  res.status(200).json(data);
}
async function getAPIQuarter(req, res) {
  const data = await getDataQuarter(req.params.macongty);
  res.status(200).json(data);
}
export { getAPI4M, getAPIQuarter };
