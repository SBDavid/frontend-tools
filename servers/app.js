var servers = require('./servers-config.js');
var path = require('path');
var fs = require('fs');
var colors = require('colors');

var express = require('express');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('*', function(req, res) {
	var hostName = req.hostname;
	var baseUrl = decodeURIComponent(req.baseUrl); // 请求中的中文会被encode
	console.log('request:'.green, hostName + baseUrl);
	var matchServer = false;
	servers.forEach(function(v) {
		if (v.state == 'on' && v.serverName.indexOf(hostName) != -1) {
			matchServer = true;
			for (var key in v.rewrite) { // 通过正则的方式实现rewrite
				baseUrl = baseUrl.replace(new RegExp(key), v.rewrite[key]);
			}
			var p = v.root + baseUrl;

			if (v.hooks) {
				v.hooks.forEach(function(_v, i) {
					if (typeof _v == 'function') {
						_v(req, res, path.join(v.root, baseUrl));
					}
				});
			}

			if (!fs.existsSync(p)) { // 404 报错
				console.log('404:'.red, p.yellow);
				res.status(404).end('404: Not Found');
				return;
			}

			if (fs.statSync(p).isDirectory()) { // 渲染目录页面
				var list = fs.readdirSync(p);
				list = list.map(function(_v) {
					if (fs.statSync(path.join(p,_v)).isDirectory()) {
						return _v + '/';
					} else {
						return _v;
					}
				});
				res.render('directory.ejs', {
					fileList: list,
					host: hostName,
					path: baseUrl
				});
			} else { // 将文件内容返回
				res.sendFile(path.join(v.root, baseUrl));
			}
		}
	});
	if (!matchServer) {
		res.status(404).send('没有配置该域名或该主机未启动');
	}
});
app.listen(80, '127.0.0.1');
console.log('p-server 启动成功！');
module.exports = app;
