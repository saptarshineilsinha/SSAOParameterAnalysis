/**
 * Created by SaptarshiNeil on 8/29/15.
 */
var Excel = require("exceljs");
var fs = require('fs');

var files = fs.readdirSync('PerceptualImageDiff/saobias3SAO');
readFiles('saobias3SAO/pixelDifference', 'saobias3SAO');


function readFile(filePath, files, i, workbook, resultPath) {
    fs.readFile('PerceptualImageDiff/' + filePath + '/' + files[i], 'utf8', function (err, contents) {
        if (contents.length !== 0) {
            var pixels = [];
            var pixel = contents.toString().match(/\d+/)[0];
            pixels.push(pixel);
            var sheet = workbook.addWorksheet("My Sheet");
            var worksheet = workbook.getWorksheet("My Sheet");
            worksheet.columns = [
                { header: "Algorithm", key: "id", width: 30 },
                { header: "Difference in Pixels", key: "name", width: 32 }
            ];
            if (err) {
                throw err;
            }
            console.log(files[i], pixel);
            worksheet.addRow({id: files[i], name: pixel});

            workbook.csv.writeFile('PerceptualImageDiff/' + resultPath + '/FinalResult.csv')
                .then(function () {
                    console.log("row written...");
                });
        }
    });
}
function readFiles(filePath, resultPath) {
    var files = fs.readdirSync('PerceptualImageDiff/' + filePath + '/');
    var workbook = new Excel.Workbook();
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    for (var i in files) {
        if (files[i].toString().endsWith('.txt')) {
            readFile(filePath, files, i, workbook, resultPath);
        }
    }
}

