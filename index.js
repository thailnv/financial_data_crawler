import express from "express";
import { getAPICDKT, getAPI4M, getAPIQuarter } from "./controllers/dataEPS.js";
const app = express();

app.listen(5000, function () {
  console.log("Server is ready");
});

app.get("/api/4m/:macongty", getAPI4M);
app.get("/api/quarter/:macongty", getAPIQuarter);
app.get("/api/cdkt/:macongty", getAPICDKT);
