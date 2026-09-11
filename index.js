const express = require("express");
const app = express();
const path = require("path");

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public"))); // public 폴더 안 html/css/js 파일 접근 가능

// 예: index.html = public/index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
});

