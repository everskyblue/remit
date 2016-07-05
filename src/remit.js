/**
 * remit
 * https://github.com/nikeMadrid/remit
 * @author Nike Madrid
 * @version 1.0.0
 * @licence MIT
 */
 
!function(w, arr) {
	"use strict";

	var globalRgx = /{([0-9a-zA-Z_\+\-%\:]+)}/g,
		sUpper = /{((.*?):upper)}/g,
		sLower = /{((.*?):lower)}/g,
		sString = /{((.*?):string)}/g,
		sNumber = /{((.*?):number)}/g;


	var _SERVER = {
		path: location.pathname || '/',
        hash: location.hash,
        protocol: location.protocol,
        beforeUrl: location.origin || '/',
        params: location.search || ''
	};

	var xhr = null;

	var isFountUrl = false;

	var headers = {};

	var routeGroup = [];

	var routeActionsMethods = {
		pattern: [],
		method: [],
		callback: []
	};

	var routeExecuteAction = {
		url: [],
		method: [],
		callback: [],
		context: {}
	};

	if(window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
    }else{
       	try {
        	xhr = new ActiveXObject("Microsoft.XMLHTTP");
       	} catch(e) {
          	console.info('tu navegador no soporta xml ajax');
       	}
  	}

	function each(arr, f) {
		for(var n in arr){
			f(n, arr[n]);
		}
	}

	function preg_quote(str, rpl) {
		if(str.match(/\//g) !== null) {
       		str = String(str).replace(new RegExp('[.\\\\*$=!<>|\\' + (rpl || '') + ']', 'g'),'\\$&');
       	}
		return str;
	}

	function $_collector$x(p) {
		var group = "";
		if(routeGroup.length > 0){
			group = routeGroup;
		}

		var quote = preg_quote(group + p, "/");

		return function() {
			var m = quote.match(globalRgx);
			if(m !== null) {
				for(var i in m) {
					if(sString.test(m[i] && m[i].match(sString))) {
						quote = quote.replace(m[i], "([a-zA-Z]+)");
					}else if(sNumber.test(m[i] && m[i].match(sNumber))) {
						quote = quote.replace(m[i], "([0-9]+)");
					}else if(sLower.test(m[i] && m[i].match(sLower))) {
						quote = quote.replace(m[i], "([a-z]+)");
					}else if(sUpper.test(m[i] && m[i].match(sUpper))) {
						quote = quote.replace(m[i], "([A-Z]+)");
					}else {
						quote = quote.replace(m[i], "([0-9a-zA-Z_\\+\\-%\\:]+)");
					}
				}
			}

			return eval('/'+ quote +'\\/?/');
		};
	}

	/**
	 * Object session localStorage || sessionStorage
	 */
	w.session = {};

	/**
	 * @param name
	 * @param value
	 * @param type
     */

	w.session.set = function (name, value, type) {
		value = (typeof name == 'object') ? name :(function() {var dd = []; dd[name] = value; return dd; }());

		this.action(value, type || 'local', 'set');
	};

	/**
	 * @param name
	 * @param type
	 * @returns String
     */
	w.session.get = function (name, type) {
		return this.action(name, type || 'local', 'get');
	};

	/**
	 * @param name
	 * @param type
     */
	w.session.remove = function(name, type) {
		this.action(name, type || 'local', 'remove');
	};

	/**
	 * @param name
	 * @param type
	 * @return String
     */

	w.session.exists = function(name, type) {
		return this.action(name, type || 'local', 'exists');
	};

	w.session.action = function (value, typeStorage, action) {
		var executeAction;

		switch (typeStorage) {
			case 'local':
				executeAction = localStorage;
				break;
			case 'session':
				executeAction = sessionStorage;
				break;

		}

		var exists = function(k) {
			if(typeof value == 'string') {
				return executeAction[k] ? true : false;
			}
			return null;
		};

		if(action == 'exists') {

			return exists(value);

		}else if(action == 'get') {

			if(typeof value == 'string') {
				return executeAction[value] || null;
			}

			return null;

		}else if(action == 'set'){

			if(typeof value == 'object') {
				for (var name in value) {
					if(!exists(name)) {
						executeAction[action + 'Item'](name, value[name]);
					}
				}
			}

		}else{
			executeAction[action + 'Item'](value);
		}
	};

	/**
	* @param key String nombre de la cookie
	* @param value String valor de la cookie
	* @param options Object expecifica las demas opcion como age, expires, path
	*/

	w.cookie = function(key, value, options) {
		var path = '',
			domain = '',
			age = '',
			expires = '',
			secure = '';

		var exp = function(expiresCookie, type) {
			this.date = new Date();
			this.seconds = 60;
			this.minutes = 60;
			this.hours = 24;
			this.month = 12;

			this.oneYear = (60*60*24*12);
			this.cookieHour = (60*60);

			if(type == "age"){
				if(expiresCookie == "oneYear"){
					return this.oneYear;
				}else if(expiresCookie == "cookieHour"){
					return this.cookieHour;
				}else if(expiresCookie == "app"){
					return this.date.getMilliseconds();
				}else{
					return expiresCookie;
				}
			}else if(type == 'expires'){
				return expiresCookie;
			}

		};

		if(options){
			for(var name in options){
				switch(name){
					case "path":
						path = ';path=' + options[name];
						break;

					case "domain":
						domain = ';domain=' + options[name];
						break;

					case "age":
						age = ';max-age=' + exp(options[name], 'age');
						break;

					case "expires":
						var time = exp(options[name], 'expires');
						if(time){
							expires = ";expires=" + time;
						}
						break;

					case "secure":
						secure = ";secure=" + options[name];
						break;
				}
			}
		}

		var getConstructCookie = function() {
			return key + "=" + value + age + path + domain + expires + secure;
		};

		document.cookie = getConstructCookie();
	};

	/**
	 * @param key String|undefined
	 * @returns String|Array
	 */
	w.cookie.get = function(key) {
		var arrCookie = [],
			store,
			explode;

		if(!this.exists()){
			return '';
		}

		if (document.cookie.indexOf(';') != -1) {
			explode = document.cookie.replace(/\s+/g, '').split(';');

			explode.forEach(function (e, i, a) {
				store = e.split('=');
				arrCookie[store[0]] = store[1];
			});

		}else{
			explode = document.cookie.split('=');
			for ( var i = 0; i < explode.length; i++) {
				store = explode;
				arrCookie[store[0]] = store[1];
			}
		}


		return arrCookie[key] || arrCookie;
	};

	/**
	 * @param key String
	 * @returns {boolean}
	 */
	w.cookie.exists = function(key) {
		return (document.cookie[key] || document.cookie) ? true : false;
	};

	/**
	 * @param name String
	 */
	w.cookie.remove = function(name) {
		var date = new Date();
		date.setTime(date.getTime()-(24*60*60));
		document.cookie = name+"=; expires="+date.toUTCString();
	};


	w.Request = function() {

		var params = [],
			hash;

		/**
		 * @param key String
		 * @return Array|String
		 */
		this.getParams = function (key) {
			this.slice = server.params.slice(server.params.indexOf('?') + 1);
			if(parseInt(this.slice) != 0) {
				var arrParams = this.slice.split('&');
				for(var i = 0; i < arrParams.length; i++) {
					if(arrParams[i].indexOf('=') != -1) {
						hash = arrParams[i].split('=');
						params[hash[0]] = hash[1];
					}
				}
			}
			return key ? params[key] : params;
		};

		/**
		 * @return Object
		 */
		this.infoBrowser = function() {
			return {
				appName: navigator.appCodeName,
				browserName: navigator.appName,
				browserVersion: navigator.appVersion,
				activeCookie: navigator.cookieEnabled,
				lang: navigator.language,
				online: navigator.onLine,
				platform: navigator.platform,
				userAgent: navigator.userAgent,
				product: navigator.product,
				position: navigator.geolocation.getCurrentPosition,
				javaActive: navigator.javaEnabled()
			};
		};

		return this;
	};

	w.Response = function () {

		this.execRoute = function (url, obj, args) {
			if(typeof obj == 'function') {
				obj.apply(this, [this].concat(args));
			}else if(typeof  obj == 'object' && Object.getOwnPropertyNames(obj).indexOf('render') != -1) {
				obj.render.apply(this, [this].concat(args));
			}
		};

		return this;
	};

	w.Route = function() {

		this.group = function(url, func) {
			routeGroup = url;
			try {
				func.call(this);
			}catch(e){
				alert(e);
			}
		};

		this.url = function(pattern, obj) {
			routeActionsMethods.method.push("GET");
			routeActionsMethods.pattern.push($_collector$x(pattern));
			routeActionsMethods.callback.push(obj);
		};

		this.get = function(pattern, obj) {
			routeActionsMethods.method.push("GET");
			routeActionsMethods.pattern.push($_collector$x(pattern));
			routeActionsMethods.callback.push(obj);
		};

		return this;
	};

	w.dispatch = function(f) {
		each(routeActionsMethods.pattern, function(i, v){
			var url = v(),
				m 	= null;

			if((m = url.exec(decodeURI(_SERVER.path)))){
				if(url.lastIndex == m.index) {
                	++url.lastIndex;
               	}

				if(m[0].length === m.input.length){
					delete m.index;
					delete m.input;

					isFountUrl = true;

					routeExecuteAction.context = routeActionsMethods;

					routeExecuteAction.method = routeActionsMethods.method[i];
					routeExecuteAction.url = m.shift();
					routeExecuteAction.callback = routeActionsMethods.callback[i];
					routeExecuteAction.args = m;

					routeExecuteAction.matchesUrl = url;
				}
			}
		});

		if(typeof f == "function"){
			f.call(this, isFountUrl);
		}

		dispatch.callback();

		var is = isFountUrl ? 200 : 404;
	};

	w.dispatch.callback = function () {
		var call = routeExecuteAction.callback;
		if(call instanceof Array && call.length == 0) {
			return;
		}else{
			new Response().execRoute(routeExecuteAction.url, call, routeExecuteAction.args);
		}
	};

	w.loadFILE = function (selector, file, error) {

		if(!file) {
			file = selector;
			selector = 'body';
		}

		if(!file) {
			throw new Error("especifica el nombre del archivo");
		}

		xhr.onreadystatechange = function (e) {
			if(xhr.readyState == 4 || xhr.readyState == 'complete'){
				if(xhr.status < 202){
					document.querySelector(selector).innerHTML = xhr.responseText;
				}else{
					var e = new Error("error al encontrar el archivo");
					e.file = file;
					e.state = xhr.status;

					throw e;
				}
			}
		};

		xhr.open('GET', file);
		xhr.send();
	};

	return w || this;
}(this, [
	function() {}
]);
