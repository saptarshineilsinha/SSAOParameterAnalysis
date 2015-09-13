var http = require('http');
var Excel = require("exceljs");
var fs = require('fs');


var querystring = require('querystring');
var exec = require('child_process').exec,
    child;

http.createServer(function (request, response) {
    request.content = '';
    request.addListener("data", function (data) {
        request.content += data;
    });

    request.addListener("end", function () {
        if (request.content.trim()) {
            request.content = querystring.parse(request.content);
            var data = request.content['data'];
            var frame = request.content['frame'].toString();
            var values = frame.split('_');
            var dir = 'PerceptualImageDiff/' + values[0];
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            var dir1 = 'PerceptualImageDiff/' + values[0] + '/pixelDifference';
            if (!fs.existsSync(dir1)) {
                fs.mkdirSync(dir1);
            }
            var dir2 = 'PerceptualImageDiff/' + values[0] + '/ssaoResult';
            if (!fs.existsSync(dir2)) {
                fs.mkdirSync(dir2);
            }
            data = data.replace(/^data:image\/\w+;base64,/, "");
            var buffer = new Buffer(data, 'base64');
            fs.writeFile('PerceptualImageDiff/' + values[0] + '/ssaoResult/screen-' + (frame) + '.png',
                buffer.toString('binary'), 'binary');
            child = exec('cd E:\\FinalProject\\xml3d-blender-exporter-master\\PerceptualImageDiff && perceptualdiff.exe groundTruthSponzaBlur1.png ' + values[0] + '/ssaoResult/screen-' + (frame) + '.png > ' + values[0] + '/pixelDifference/screen-' + (frame) + '.txt',
                function (error, stdout, stderr) {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                        readFiles(values[0] + '/pixelDifference', values[0]);
                    }
                });


        }
    });
    response.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With'
    });
    response.end();
}).listen(8080, "localhost");

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



