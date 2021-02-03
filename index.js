const express = require("express");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const request = require("request");
const fs = require("fs-extra");
const config = require("./config/config");

const app = express();
const quality = 98;

function fetch(req) {
  return request.get(config.target + req.path);
}

app.get("/favicon.*", (req, res) => {
  res.sendStatus(204);
});

app.get("*", async (req, res) => {
  let {
    width
  } = req.query;

  if (!width) {
    return fetch(req).pipe(res);
  }

  let path = `${__dirname}/public${req.path}-${width}`;
  let ext = req.path.split(".").pop();

  if (!ext) {
    return res.sendStats(500);
  }

  if (await fs.exists(path)) {
    return (await fs.createReadStream(path)).pipe(res);
  }

  width = parseInt(width);

  let file = sharp()
    .resize(width, null, { withoutEnlargement: true })
    .toFormat(ext, { quality });
  
  file.toBuffer(async (_, buffer) => {
    console.log(path);
    mkdirp(`${__dirname}/public`).then(() => {
      fs.writeFile(path, buffer);
    });
  });

  fetch(req).on("response", (obj) => {
    if (obj.statusCode == 200) {
      return obj.pipe(file).pipe(res);
    }
    res.sendStatus(404);
  });
});

app.listen(config.port);
