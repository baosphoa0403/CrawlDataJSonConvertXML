const X2JS = require('x2js');
const fs = require('fs');
const vkbeautify = require('vkbeautify');
function convertJsonXML() {
    fs.readFile('data.json', (err, data) => {
        if (err) throw err;
        let listData = JSON.parse(data);
        var x2js = new X2JS();
        var document = x2js.js2xml({ root: listData });
        var dep = vkbeautify.xml(document, 4);
        console.log(dep);
        // console.log(listData);
        fs.writeFileSync('data.xml', dep);
    });
}
convertJsonXML();