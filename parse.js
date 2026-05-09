const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./lint-results.json", "utf16le").replace(/^\uFEFF/, ""));
const errors = data.filter(f => f.errorCount > 0).map(f => ({
  file: f.filePath,
  msgs: f.messages.filter(m => m.severity === 2).map(m => `L${m.line}: ${m.ruleId} - ${m.message}`)
}));
console.log(JSON.stringify(errors, null, 2));
