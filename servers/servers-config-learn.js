var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var colors = require('colors');

var readFile = function(filePath) {
	if (!fs.existsSync(filePath)) {
		throw 'Not found ' + filePath;
	}
	return fs.readFileSync(filePath, 'utf8');
};

var getLessPath = function(cssPath) {
	return cssPath.replace(/\.css$/g, '.less');
};

var resolveLess = function(lessPath) {
	var dirname = path.dirname(lessPath);
	var fileList = readFile(lessPath).match(/\".*\"/g).map(function(v) {
		return path.join(dirname, v.slice(1, -1));
	});
	return fileList;
};

var getXmlPath = function(jsPath) {
	return jsPath + '.xml';
};

var resolveXml = function(xmlPath) {
	var fileList;
	var dirname = path.dirname(xmlPath);
	var xml = readFile(xmlPath);
	var parseString = require('xml2js').parseString;
    parseString(xml, function (err, result) {
        if (!result) {
            console.log(_path);
        } else if (result.list) {
            fileList = result.list.file;
        }
    });
    fileList = fileList.map(function(v) {
    	return path.join(dirname, v);
    });
    return fileList;
};

var getAllList = function(fileList) {
	for (var i = 0; i < fileList.length;) {
		if (path.extname(fileList[i]) == '.css' && !fs.existsSync(fileList[i])) { // 如果less列表包含的是css文件，并且没有找到该css，则去解析同名的less文件
			fileList.splice(i, 1, resolveLess(getLessPath(fileList[i])));
			fileList = _.flatten(fileList);
		} else if (path.extname(fileList[i]) == '.less') { // 如果less列表包含的就是less文件，则直接解析
			fileList.splice(i, 1, resolveLess(fileList[i]));
			fileList = _.flatten(fileList);
		} else {
			i++;
		}
	}
	return fileList;
};

var creatContent = function(fileList) {
	fileList = fileList.map(function(v) {
		return '\n/* file path: '+v+' */\n' + readFile(v);
	});
	return fileList.join('');
};

module.exports = [
	{
		state: 'on',
		serverName: ['a.com', 'b.com', 'c.com'],
		root: 'D:\/git-learn',
		rewrite: {
			// 'music2017': 'special-subject/music2017'
		},
		hooks: [
			function(req, res, _path) {
				console.info(_path);
				if (!fs.existsSync(_path)) {
					console.info('!not find');
					if (path.extname(_path) == '.css') {
						res.set('Content-Type', 'text/css');
						try {
							res.end(creatContent(getAllList(resolveLess(getLessPath(_path)))));
						} catch (e) {
							console.log(e.red);
							res.status(404).end('Error: ' + e);
						}
					}
					if (path.extname(_path) == '.js') {
						res.set('Content-Type', 'application/javascript');
						try {
							res.end(creatContent(getAllList(resolveXml(getXmlPath(_path)))));
						} catch (e) {
							res.status(404).end();
						}
					}
				}
				return 'stop';
			}
		]
	}
];
