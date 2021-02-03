const express = require("express");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const request = require("request");
const path = require("path");
const fs = require("fs-extra");
const config = require("./config/config");

const {
  host,
  port
} = config.server;

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

  let filePath = path.join(__dirname, "public", `${req.path}-${width}`);
  let ext = req.path.split(".").pop();

  if (!ext) {
    return res.sendStats(500);
  }

  if (await fs.exists(filePath)) {
    return (await fs.createReadStream(filePath)).pipe(res);
  }

  width = parseInt(width);

  let file = sharp()
    .resize(width, null, { withoutEnlargement: true })
    .toFormat(ext, { quality });
  
  file.toBuffer(async (_, buffer) => {
    let folder = path.join(path.dirname(filePath));
    mkdirp(folder).then(() => {
      fs.writeFile(filePath, buffer);
    });
  });

  fetch(req).on("response", (obj) => {
    if (obj.statusCode == 200) {
      return obj.pipe(file).pipe(res);
    }
    res.sendStatus(404);
  });
});

app.listen(port, () => {
  console.log("");
  console.log("resizer@1.0.0");
  console.log("");
  console.log("host  " + host);
  console.log("port  " + port);
  console.log("");
  console.log("Server started!");
  console.log("Press ctrl-c to stop");
  console.log("");
});
