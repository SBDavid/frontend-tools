var config = {
	docPath: 'main'
};
var colors = require('colors');
  
colors.setTheme({  
    silly: 'rainbow',  
    input: 'grey',  
    verbose: 'cyan',  
    prompt: 'red',  
    info: 'green',  
    data: 'blue',  
    help: 'cyan',  
    warn: 'yellow',  
    debug: 'magenta',  
    error: 'red'  
});  

var path = require('path');
var fs = require('fs');

var marked = require('./js/marked.min.js');
var hljs = require('highlight.js');
var ejs = require('ejs');

var program = require('commander');


marked.setOptions({
	highlight: function (code) {
		return hljs.highlightAuto(code).value;
	}
});

var setDomId = function(content, level) {
	level = level || 3;
	var matched = content.replace(/^(<h\d{1}).*>(.*)(<\/h\d{1}>)/g, '$1 id="$2">$2$3');
	return matched;
};
var getIndexs = function(section, level, filter) {
	level = level || 3; // 默认抽取到三级标题
	level = level > 6 ? 6 : level; // 最大到6级标题
	level = level < 1 ? 1 : level; // 最小到1级标题
	filter = filter || function(item) {
		return true;
	};
	var matched = section.match(/.*\r?\n(\=+)|#+\s+(.*)/gm);
	if (matched) {
		return matched.map(function(item) {
			if (/#+/.test(item)) {
				var level = item.match(/#+/)[0].length;
				var title = item.replace(/#+\s+/, '');
				return {
					level: level,
					title: title
				};
			} else {
				return {
					level: 1,
					title: item.split(/\n/)[0]
				};
			}
		}).filter(function(item) {
			return item.level <= level;
		}).filter(filter);
	} else {
		return [];
	}
};
var build = function(_path, content) {
	console.log('build:'.green , _path.red);
	var template = fs.readFileSync(path.join(__dirname, 'template/bootstrap.html'), 'utf8');
	var contentData = {
		pageTitle: path.basename(_path, '.md'),
		navTree: getNavTree(path.join(__dirname, config.docPath))[config.docPath],
		mainContent: setDomId(marked(content)),
		indexs: getIndexs(content)
	};
	// 获取md文件路径
	_path = _path.replace(/\.md/g, '');
	var html = ejs.render(template, contentData);
	// 去空格tab
	html = html.replace(/\s{2,}\t/g, '');
	fs.writeFileSync(_path + '.html', html);
};

var navTree = {};
var getNavTree = function(docPath) {
	fs.readdirSync(docPath).forEach(function(v) {
		var _path = path.join(docPath, v);
		var stat = fs.statSync(_path);

		var relativePath = path.relative(__dirname, _path);
		var relativePathArr = relativePath.split(path.sep);
		var arrLenth = relativePathArr.length;

		var curLevel = navTree;
		for (var i = 0; i < arrLenth - 1; i++) {
			if (!curLevel[relativePathArr[i]]) {
				curLevel[relativePathArr[i]] = {};
			}
			curLevel = curLevel[relativePathArr[i]];
		}
		if (stat.isDirectory()) {
			curLevel[relativePathArr[arrLenth - 1]] = {};
			getNavTree(_path);
		} else {
			if (path.extname(_path) === '.html') {
				curLevel[relativePathArr[arrLenth - 1]] = '/' + path.relative(__dirname, _path);
			}
		}
	});
	return navTree;
};


var rebuild = function(docPath) {
	console.log(docPath);
	var exists = fs.existsSync(docPath);
	fs.readdirSync(docPath).forEach(function(v) {
		var _path = path.join(docPath, v);
		var stat = fs.statSync(_path);
		if (stat.isDirectory()) {
			rebuild(_path);
		} else {
			if (path.extname(_path) === '.md') {
				build(_path, fs.readFileSync(_path, 'utf8'));
			}
		}
	});
};

var watch = require('watch');
		

module.exports = {
	rebuild: function() {
		rebuild(path.join(__dirname, config.docPath));
	},
	build: function(_path) {
		if (path.extname(_path) === '.md') {
			_path = path.join(__dirname, _path);
			build(_path, fs.readFileSync(_path, 'utf8'));
		} else {
			rebuild(path.join(__dirname, _path));
		}
		
	},
	// path.join(__dirname, config.docPath)
	watch: function() {
		watch.watchTree('./main', {
			filter: function(p) {
				return path.extname(p) !== '.html';
			},
			interval: 100
		}, function(f, curr, prev) {
			if (typeof f == 'object') {

			} else {
				var
					_path = path.join(__dirname, f)
				;
				build(_path, fs.readFileSync(_path, 'utf8'));
			}	
		});
	}
};

