/**
 * remit
 * https://github.com/nikeMadrid/remit
 * @author Nike Madrid
 * @version 1.2.3
 * @licence MIT
 */

 var remit,
     Cookie,
     validation,
     localData;

(function (global) {
    'use strict'

     var xhr = null;

     if(window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
     }else {
        try {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        } catch(e) {
            console.warn(e);
        }
     }

    /* polyfill */
    if(!Object.values) {
        Object.values = function(obj) {
            var vals = [];
            for( var key in obj ) {
                if ( obj.hasOwnProperty(key) ) {
                    vals.push(obj[key]);
                }
            }
            return vals;
        }
    }

    /**
     * polyfill
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
     */
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun/*, thisArg*/) {
            'use strict';

            if (this === void 0 || this === null) {
                throw new TypeError();
            }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== 'function') {
                throw new TypeError();
            }

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];
                    if (fun.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }

            return res;
        };
    }

     /* global regex */
     var globalRgx = /{([0-9a-zA-Z_\+\-%\:]+)}/g,
         sUpper = /{((.*?):upper)}/g,
         sLower = /{((.*?):lower)}/g,
         sString = /{((.*?):string)}/g,
         sNumber = /{((.*?):number)}/g;

     var _SERVER = {
         path: location.pathname || '/',
         hash: location.hash.replace(/\#\//g, '') || '/',
         protocol: location.protocol.replace(':', ''),
         beforeUrl: location.origin || '/',
         params: location.search || '',
         host: location.hostname
     };

     var context = [];

     var hasOwnProperty = Object.prototype.hasOwnProperty;

     /**
      * @type module
      * @description
      * define a "file" module where is create in a dir specificity
      */
     function module(m, o) {
         try {
             if (!module.register.file[m[0]]) {
                 module.register.file[m[0]] = {};
                 module.register.file[m[0]][m[1]] = o;
             }
         }catch(e){
             console.warn(e)
         }
     }

     module.extend = function(principal, ext) {
         if((typeof principal != 'object') && (Array instanceof principal) && (principal.length == 2)) {
             principal = module.import(principal[0, principal[1]]);
         }

         if ( "object" == typeof principal) {
             principal.__proto__ = Object.create(ext.prototype || ext);
         }
     }

     module.import = function (module, key) {
         if (this.register.file[module]) {
             var mod = this.register.file[module];
             if (mod[key]) {
                 return mod[key];
             }
             throw new TypeError("module not exists");
         }
         throw new TypeError("file of module not exits");
     }

     module.prototype = {
         constructor: module,
         register: {file: {}}
     }

     module.__proto__ = Object.create(module.prototype);

     /**
      * @param {String} str
      * @param {String} rpl
      * @return String
      */
     function pregQuote(str, rpl) {
         if(str.match(/\//g) !== null) {
             str = String(str).replace(new RegExp('[.\\\*$=!<>|\\' + (rpl || '') + ']', 'g'),'\\$&');
         }
         return str;
     }

     /**
      * @param {Array} arr
      * @param {Function} func
      */
     function each(arr, func) {
         if(arr instanceof Array) {
             for (var prop in arr) {
                 func.call(null, prop, arr[prop]);
             }
         }
     }

     /**
      * @return Array
      */
     function infoHTTP() {
         var m;
         var filename  = '';
         var rgxIndex = /\/(.*?)\.[html|php]*/i;
         if(rgxIndex.test(_SERVER.path) && (m = _SERVER.path.match(rgxIndex)) ) {
             filename = m[0].substr(1);
             _SERVER.path = _SERVER.path.replace(filename, '');
         }
         _SERVER.filename = (filename != '') ? filename.substr(1) : filename;

         return _SERVER;
     }

     function errorAccessMethod(method, url) {
         return '<!DOCTYPE html>'+
         '<html><head>'+
             '<title>error: access method not allowed</title>'+
             '<style>'+
                 '* {margin: 0;padding: 0;box-sizing: border-box;}'+
                 'html, body {background-color: #F1F1F1;}'+
                 'header {background: #32d4ff;color: white;line-height: 60px;padding: 0 20px;font-size: 25px;'+
                 'text-transform: capitalize; box-shadow: 0 2px 2px rgba(185, 185, 185, 0.66);}'+
                 'main > div {width: 1000px;margin: auto;margin-top: 3em;padding: 3em 10px;line-height: 30px;border: 10px solid #ffa2a2;background: white;color: #454545;}'+
             '</style>'+
         '</head><body>'+
             '<header>error: access method not allowed</header>'+
             '<main><div>'+
                     '<p>url: '+ url +'</p><p>method permitted: '+method+'</p><p>type error: method not allowed</p>'+
             '</div></main></body></html>';
     }

     function pageNotFount(urls) {
         return '<!DOCTYPE html>'+
         '<html><head>'+
             '<title>error: 404 page not fount</title>'+
             '<style>'+
                 '* {margin: 0;padding: 0;box-sizing: border-box;}'+
                 'html, body {background-color: #F1F1F1;}'+
                 'header {background: #32d4ff;color: white;line-height: 60px;padding: 0 20px;font-size: 25px;'+
                 'text-transform: capitalize; box-shadow: 0 2px 2px rgba(185, 185, 185, 0.66);}'+
                 'main > div {width: 1000px;margin: auto;margin-top: 3em;padding: 3em 10px;line-height: 30px;border: 10px solid #ffa2a2;background: white;color: #454545;} .urls { color: #000; padding-left: 30px;font-family: monospace;}'+
             '</style>'+
         '</head><body>'+
             '<header>Error: 404 Page Not Fount</header>'+
             '<main><div>'+
                     '<p>code: 404</p><p>type error: page not fount</p><div style="display:flex;">urls:<p class="urls"> ^'+ urls.join('<br>^').replace(/[\\]|\/\?/g, function(v) { return '' }) + '</p></div></div></main></body></html>';
     }

    /**
	 * @param {Function|Objec}} obj
	 * @param {Array} args
	 */
	function renderer(obj, args) {
		var propertyExists = Object.prototype.hasOwnProperty;
		if(propertyExists.call(obj, 'render')) {
			if(propertyExists.call(obj, 'middleware')) { }
			obj.render.apply(this, args);
		}else {
			obj.apply(this, args);
		}
	}

     /**
      * define modules
      *
      * @type regexurlname
      * @private
      * @description
      * regexurlname
      */
     function captureRgx(url, obj) {
         var regex_group = /\(\?\P\<(.*)?\>(.*)?\)/g,
             matches;
         if (regex_group.test(url) && (matches = /\(\?\P\<(.*)?\>(.*)?\)/g.exec(url))) {
             var expression = matches.shift();
             var name = matches.shift();
             var rgx = matches.shift();

             obj.capture = {
                 expression: String(expression).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                 name: name,
                 typeCapture: rgx
             };

             url = url.replace(expression, '([\\'+ rgx +'])');
         }

         var quote = pregQuote(url, '/');

         var express = function() {
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

             obj.urls.push(quote);

             return eval('/'+ quote +'\\/?/');
         }();

         return express;
     };

    /**
	 * @type validation
	 * @public
	 * @description
	 * validation form
	 */
	module(['/lib/validator/validation.js', 'validation'], function(input, validator) {

		 var self = this;

		 /* message errors */
		 var msg = {
		     'max': 'max value {max} large {user_max}',
		     'min': 'min value {min} large {user_max}',
		     'required': 'input is required'
		 };

		 /* validation required in max and min value */
		 var values = {
		     max: [],
		     min: []
		 };

		 var node = document.createElement('p');
		 node.setAttribute('class', 'error');

		 /**
		  * @param {String} key
		  * @param {String} tr
		  * @param {String} tr2
		  * @return {String}
		  */
		 var showMsg = function(key, tr, tr2) {
		    if(Object.prototype.hasOwnProperty.call(msg, key)) {
		        return msg[key].replace(/\{[max|min]*\}/g, tr).replace('{user_max}', tr2);
		    }
		    return '';
		 }

	     this.errors = [];

         this.contextForm = typeof input == 'object' ? input : document.querySelector(input);

         if (!this.contextForm) {
            throw 'context in null';
         }

		 /**
	      * @param {String} key
	      * @param {Boolean} bool
	      */
	     this.setError = function(key, bool) {
	         this.errors[key] = bool;
	     }

	    /**
	     * @param {Object} validator
	     */
	     this.prepare = function(validator) {
	         var inputs = Object.keys(validator);
	         for (var name in inputs) {
	             this.invoke(inputs[name], validator[inputs[name]]);
	         }
	     }

	     /**
	      * invoke methods for rules
	      * @param {String} name
	      * @param {Array} rules
	      */
         this.invoke = function(name, rules) {
             var f = rules.split('|').map(function(item) {
                 if(/\d+/g.test(item)) {

                     var type = item.match(/\D+/g)[0].replace(/\:/g, '');
                     var rule_value = item.match(/\d+/g)[0];
                     var func = self[type];
                     if (type == 'min') {
                         values.min[name] = rule_value;
                     }else if (type == 'max') {
                         values.max[name] = rule_value;
                     }

                    if(typeof func == 'function') {
                        func.call(self, document.querySelector('input[name="'+name+'"]'), rule_value);
                    }

                }else {
                    var func = self[item];
                    if (typeof func == 'function') {
                        func.call(self, document.querySelector('input[name="'+name+'"]'));
                    }
                }

            });
         }

	     /**
	      * @param {HTMLElement} input
	      */
	     this.required = function(input) {
	         if (typeof input == 'object') {
	             this.isSubmit(input);
	         }
	     }

	     /**
	      * @param {HTMLElement} input
	      * @param {Number} rule_value
	      */
	     this.max = function(input, rule_value) {
	         if (input) {
	             input.addEventListener('change', function(e) {
	                 var target = e.target;
					 var error = function (c) {
							 c.setError(target.name, true);
							 node.textContent = showMsg('max', rule_value, target.value.length);
							 input.parentNode.insertBefore(node, input);
					 }

	                 for (var name in values.max) {
	                     if ( target.name == name ) {
							 if (Object.getOwnPropertyNames(values.min).length > 0) {
								 if( target.value.length > rule_value ) {
									 error(self);
		                         }else {
		                             if (target.value.length >= values.min[name]) {
		                                 self.setError(name, false);
		                             }
		                         }
							 }else {
								 if( target.value.length > rule_value ) {
									 error(self);
								}else {
									 if (target.value.length <= rule_value) {
										 self.setError(name, false);
									 }
								}
							}
	                    }
	                }
	            });
	        }
	    }

	     /**
	      * @param {HTMLElement} input
	      * @param {Number} rule_value
	      */
	     this.min = function(input, rule_value) {
	         if (input) {
	             input.addEventListener('change', function(e) {
	                 var target = e.target;
					 var error = function (c) {
							 c.setError(target.name, true);
							 node.textContent = showMsg('min', rule_value, target.value.length);
							 input.parentNode.insertBefore(node, input);
					 }

					 for (var name in values.min) {
						if (target.name == name) {
							if ( Object.getOwnPropertyNames(values.max).length > 0 ) {
								if( target.value.length < rule_value ) {
									error(self);
								}else {
									if ((target.value.length >= rule_value) && (target.value.length <= values.max[name])) {
										self.setError(name, false);
									}
								}
							}else {

								if( target.value.length < rule_value ) {
									error(self);
								}else {
									if (target.value.length >= rule_value) {
										self.setError(name, false);
									}
								}
							}
						}
	                 }
	             });
	         }
	     }

	     /**
	      * @param {HTMLElement} input for default in null
	      * @return validation
	      */
	     this.isSubmit = function(input) {
             input = input || null;
	         this.contextForm.addEventListener('submit', function(e) {
	             if (input !== null && input.value.length == '') {
                        self.setError('required_' + input.name, true);
                        node.textContent = showMsg('required');
                        input.parentNode.insertBefore(node, input);
	             }else if (input !== null && input.value.length !== '') {
					 self.setError('required_' + input.name, false);
				 }

	             var filterErrors = Object.values(self.errors).filter(function(item) {
	                 return item == true;
	             });

	             if (filterErrors.length > 0) {
	                 e.preventDefault();
	             }

	         });
	         return this;
	     }

	     /**
	      * @return {Array}
	      */
	     this.getErrors = function() {
	         return this.errors;
	     }

		 this.prepare(validator);

		 return this;
	});

     var validator = validation = module.import('/lib/validator/validation.js', 'validation');

     /**
      * @type cookie
      * @private
      */
     module(['/lib/winStorage/cookie.js', 'cookie'], function (name, value, options) {
          Cookie.key = name;
          Cookie.value = value;
          Cookie.options = options;
          Cookie.injectCookie();
          return this;
     });

     var cookie = Cookie = module.import('/lib/winStorage/cookie.js', 'cookie');

     /**
      * @param {String} name
      * @param {String} value
      * @param {Object} options
      */
     cookie.assign = function(name, value, options) {
         Cookie(name, value, options);
     }

     /**
      * @param {String} name
      * @return {String}
      */
     cookie.first = function(name) {
          return Cookie.all()[name] || '';
     }

     /**
      * @param {String} name
      * @param {String} path
     */
     cookie.remove = function(name, path){
         var date = new Date(),
             path = path ? 'path='+path+';' : '';
         date.setTime(date.getTime()-date.getTime());
         document.cookie = name+'=;'+path+'expires='+date.toUTCString();
     }

     /**
      * @return {Array}
      */
     cookie.all = function() {
         var cookies = document.cookie;
         var arrCookie = [],
             store,
             arr = (cookies.indexOf(';') != -1) ? cookies.replace(/\s+/g, '').split(';') : cookies.split('=');

         if(cookies) {
          arr.forEach(function (e, i, a) {
                 store = (e.indexOf('=') != - 1) ? e.split('=') : arr
                 arrCookie[store[0]] = store[1];
             });
         }

         return arrCookie;
    }

     /**
      * @param {String} type
      * @return {number}
      */
     cookie.buildAgeCookie = function(type) {
         var is = type,
             timeExpires = 0;
         if(typeof is == 'number') {
             timeExpires = type;
         }else if(is == 'oneYear') {
             timeExpires = 60*60*24*365;
         }else if (is == 'oneHour') {
             timeExpires = 60*60;
         }

         return timeExpires;
    }

     /**
      * create cookie
      */
     cookie.injectCookie = function() {
         var construct = Cookie.key+'='+Cookie.value,
             options = Cookie.options,
             defaultsOptions = {
                 path: '/',
                 domain: '',
                 age: '',
                 expires: '',
                 secure: false
             };

         for (var name in options) {
             if (Object.prototype.hasOwnProperty.call(defaultsOptions, name)) {
                 switch (name) {
                     case 'path':
                         construct += ';path='+options[name];
                         break;
                     case 'domain':
                         construct += ';domain='+options[name];
                         break;
                     case 'age':
                         construct += ';max-age='+Cookie.buildAgeCookie(options[name]);
                         break;
                     case 'expires':
                         construct += ';expires='+options[name];;
                         break;
                     case 'secure':
                         construct += ';secure='+options[name];
                         break;
                 }
             }
         }

         if(!Cookie.first(Cookie.key)) {
             document.cookie = construct;
         }
     }

     /**
      * @type class LSSStorage
      * @param {String} name
      * @param {String} value
      * @param {String} type
      */
     localData = function localData(name, value, type) {
         value = (typeof name == 'object') ? name :(function() {var dd = []; return dd[name] = value, dd; }());
         localData.action(value, type || 'local', 'set');
     }

     /**
      * @param {String} name
      * @param {String} value
      * @param {String} type
      */
     localData.set = function (name, value, type) {
         localData(key, value, type);
     }

     /**
      * @param {String} name
      * @param {String} type
      * @return {String}
      */
     localData.get = function(name, type) {
         return localData.action(name, type || 'local', 'get');
     }

     /**
      * @param {String} name
      * @param {String} type
      */
     localData.remove = function(name, type) {
         localData.action(name, type || 'local', 'remove');
     }

     /**
      * @param {String} name
      * @param {String} type
      * @return {Boolean}
      */
     localData.exists = function(name, type) {
         return localData.action(name, type || 'local', 'exists');
     }

     /**
      * @param {String|Object} name
      * @param {String} typeStorage
      * @param {String} action
      * @return {String|Boolean|null}
      */
     localData.action = function(value, typeStorage, action) {
         var executeAction;

		 var exists = function(k) {
			 if(typeof value == 'string') {
				 return executeAction[k] ? true : false;
			 }
			 return null;
		 };

		 switch (typeStorage) {
			 case 'local':
				 executeAction = localStorage;
				 break;
			 case 'session':
				 executeAction = sessionStorage;
				 break;

		 }

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
     }

     /**
      * @type class Request
      */
     function Request() {
         var http = infoHTTP();
         this.request = {} || [];

         /**
          * @return {Boolean}
          */
         this.isMobile = function() {
             return (['android', 'ipad', 'iphone'].indexOf(this.systemName) != -1);
         }

         /**
          * @return {Boolean}
          */
         this.isIphone = function() {
             return (['iphone'].indexOf(this.systemName) != -1);
         }

         /**
          * @return {Boolean}
          */
         this.isIpad = function() {
             return (['ipad'].indexOf(this.systemName) != -1);
         }

         /**
          * @return {Boolean}
          */
         this.isAndroid = function() {
             return (['android'].indexOf(this.systemName) != -1);
         }

         /**
          * @return {Boolean}
          */
         this.isPC = function() {
             return (this.isMobile() == false);
         }

         /**
          * @return {Array}
          */
         this.getBrowser = function() {
             var explode = [],
                 navi = window.navigator.userAgent.match(/(([\\(](.*?)?[\\)]))/g);
             if (navi instanceof Array && navi.length > 0) {
                 explode = navi[0].replace(/\((.*)?\)/g, '$1').split(';');
             }
             return explode;
         }

         /**
          * @param {String} fount url
          * @param {String} method
          * @param {Object|String} callback
          * @param {Array} args
          */
         this.env = function(fount, method, callback, args) {
             this.request = [fount, method, callback, args];
         }

         /**
          * @param {String} key
          * @return {Array|String}
          */
         this.getParams = function(key) {
             var params = [], hash;
             this.slice = http.params.slice(http.params.indexOf('?') + 1);
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
         }

         /**
          * @return {String}
          */
         this.getOrigin = function() {
             return http.beforeUrl;
         }

         /**
          * @return {String}
          */
         this.getProtocol = function() {
             return http.protocol;
         }

         /**
          * @return {Boolean}
          */
         this.isHTTPS = function() {
             return http.getProtocol() == 'https';
         }

         /**
          * @return {Boolean}
          */
         this.isHTTP = function() {
             return http.getProtocol() == 'http';
         }

         this.system = this.getBrowser();

         if(this.system.length == 3) {
             this.systemName = this.system[1].match(/\D+/g)[0].replace(/\s/g, '').toLowerCase();
             this.systemVersion = this.system[1].match(/\d+/g).join('.');
         }else if (this.system.length == 2) {
             this.systemName = this.system[0].toLowerCase();
         }else{
             this.systemName = this.system[0].match(/\D+/g)[0].replace(/\s/g, '').toLowerCase();
             this.systemVersion = this.system[0].match(/\d+/g).join('.');
         }

         return this;
     }

     /**
      * @param m
      * @return {Boolean}
      */
     Request.isGet = function(m) {
         return ['GET', 'OPTIONS'].indexOf(m) != -1;
     }

     /**
      * @param m
      * @return {Boolean}
      */
     Request.isAllNotGet = function(m) {
         return ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].indexOf(m) != -1;
     }

     /**
      * @type class Response
      */
     function Response() {
         var http = infoHTTP();
         this.propagation = false;

         /**
          * @param {String} url
          * @return Response
          */
         this.redirect = function(url) {
             if (http.path !== url) {
                 window.location = url;
             }
             return this;
         }

         /**
          * @return void
          */
         this.back = function() {
            window.history.back();
         }

         /**
          * @return void
          */
         this.send = function (req, route) {
             if (req.request.length > 0) {
                 var u = req.request[0];
                 var m = req.request[1];
                 var f = req.request[2];
                 var a = req.request[3];
                 route.event.validatable();
                 renderer(f, [req, this].concat(a));
                 if (Request.isAllNotGet(m)) {
                     window.onbeforeunload = function(e) {
                         Cookie.remove('req_met', ( window.srcStorage || u));
                     }
                 }
                 this.propagation = true;
                 delete window.srcStorage;
             }else {
                 if (this.propagation == false && Cookie.first('req_met')) {
                     Cookie.remove('req_met', ( window.srcStorage || u | http.path));
                 }
             }
         }

         /**
          * @return String
          */
         this.resCookie = function (name) {
             return Cookie.first(name);
         }

         return this;
     }

     /**
      * @type class Router
      * @param {String} method
      * @param {String} url
      * @param {Object|Function} func
      */
     function Router(method, url, func) {
         this.urls = [];
         this.capture = {};

         this.setMethod(method);
         this.setUrl(url);
         this.setFunc(func);

         return this;
     }

     /**
      * @param {Boolean} is
      * @return Boolean
      * @description
      * Verify if there the cookie and a method where to send the form
      */
     function compruebeEmulatorAccessRequestMethod(is) {
         if((Cookie.first("req_met") == '' || Cookie.first("req_met") == 'false')  && is == false) {
             return true;
         }
         return false;
     }

     /**
      * @return Boolean
      * @description
      * Verify if there the cookie and run another method other than get
      */
     function emulatorAccessMethod() {
         if ( (Cookie.first('req_met') != '' && Cookie.first('req_met') != 'false') ) {
             return true;
         }
         return false;
     }

     /**
      * @param {validation|Object} validator
      * @param {HTMLElement} selector
      * @param {String} u
      * @description
      * validates the form to run the following request adding a cookie first
      */
     function eventForm(validator, selector, u) {
         if (selector == null) { console.warn('context in null'); return; }
         var g = (validator instanceof Array) ? new validation(validator[0], validator[1]) : validator;
         g.isSubmit();
         selector.addEventListener('submit', function(ev) {
             var isErrors = Object.values(g.errors).filter(function(item){ return item == true; });

             Object.defineProperty(window, 'srcStorage', {
                  enumerable: false,
                  writable: false,
                  configurable: true,
                  value: selector.getAttribute('action') || u
             });

             if (isErrors.length == 0) {
                 Cookie.remove('req_met', window.srcStorage);
                 Cookie('req_met', Date.now(), {
                     path: window.srcStorage
                 });
             }else {
                 Cookie('req_met', false, {
    				path: window.srcStorage
    			 });
             }

             //ev.preventDefault()
         });
     }

     /**
      * @param {Array} context Router
      */
     function dispatch(context) {
         if(typeof context == "object") {
             var self = this;
             var count = 0;
             var many = [];
             var request = new Request();
             var response = new Response();
             var notFount = true;
             var urls = [];

             context.forEach(function(v, index,a) {
                 urls.push(v.urls[0]);
                 if (Object.keys(v.capture).length>0) {
                     urls[index] = v.urls[0].replace(
                         '([\\'+v.capture.typeCapture+'])',
                         v.capture.expression
                     ).replace(v.capture.typeCapture,'&#92;'+v.capture.typeCapture)+'/$  [name="'+ v.capture.name +'"]';
                 }

                 if ( (self.m = dispatch.matches(v.getUrl())) ) {
                     var fount = self.m.shift();
                     var args = self.m;
                     var callback = v.getFunc();
                     var method = v.getMethod();
                     var selector = self.selector = document.querySelector(callback.form);
                     var validatable = self.validatable = callback.validation;
                     notFount = false;
                     self.collection = v.capture;

                     if (Request.isGet(method)) {
                         many.push(method);
                         self.event.validatable = selector && selector.getAttribute('action') || fount ? eventForm.bind(self, validatable, selector, fount) : Function;
                         if (!emulatorAccessMethod() || method == 'OPTIONS') {
                             request.env(fount, method, callback, args);
                         }
                     }else if (Request.isAllNotGet(method))  {
                         var isManyUrls = many.indexOf('GET') != -1 ? true : false;
                         try {
                             var clear = setInterval(function() {
                                 if (compruebeEmulatorAccessRequestMethod(isManyUrls)) {
                                     if (count == 0) {
                                         count = 1;
                                         document.querySelector('html').innerHTML =  errorAccessMethod(method, fount);
                                         throw new Error("Error: access method not allowed");
                                     }
                                 }

                                 if (emulatorAccessMethod()) {
                                     request.env(fount, method, callback, args);
                                     clearInterval(clear);
                                 }
                             }, 10);
                         } catch(e) {
                             console.error(e);
                         }
                     }

                 }
             });
             setTimeout(response.send.bind(response, request, self), 10);
             if (notFount) {
                 document.querySelector('html').innerHTML = pageNotFount(urls);
             }
         }
     }

     /**
      * @param {String} url
      * @return Array|Boolean
      */
     dispatch.matches = function(url) {
         var m = null;
         if ( (m = url.exec(infoHTTP().path)) ) {
             if(url.lastIndex == m.index) {
                 if (m[0].length == m.input.length) {
                     delete m.index;
                     delete m.input;

                     return m;
                 }
                 ++url.lastIndex;
             }
         }
         return false;
     }

     /**
      * @override
      * @param {String} url
      */
     Router.prototype.setUrl = function(url) {
         this.url = url;
     }

     /**
      * @param {String} m
      */
     Router.prototype.setMethod = function(m) {
         this.method = m;
     }

     /**
      * @param {Object|Function} c
      */
     Router.prototype.setFunc = function(c) {
         this.func = c;
     }

     /**
      * @return this
      */
     Router.prototype.matchUrl = function() {
         this.setUrl(captureRgx(this.getUrl(), this));
         return this;
     }

     /**
      * @return String
      */
     Router.prototype.getUrl = function() {
         return this.url;
     }

     /**
      * @return String
      */
     Router.prototype.getMethod = function() {
         return this.method;
     }

     /**
      * @return Object|Function
      */
     Router.prototype.getFunc = function() {
         return this.func;
     }

     /**
      * @type class Route
      */
     function Route() { return this; };

     /**
      * @param {String} url
      * @param {Function} func
      */
     Route.prototype.group = function(url, func) {
         this.groupUrl = url;
         func.call(this, this);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.get = function(p, o) {
         this.controller("GET", p, o);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.post = function(p, o) {
         this.controller("POST", p, o);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.put = function(p, o) {
         this.controller("PUT", p, o);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.patch = function(p, o) {
         this.controller("PATCH", p, o);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.delete = function(p, o) {
         this.controller("DELETE", p, o);
     }

     /**
      * @param {String} p
      * @param {Object|Function} o
      */
     Route.prototype.options = function(p, o) {
         this.controller("OPTIONS", p, o);
     }

     /**
      * @param {String} m
      * @param {String} url
      * @param {Object|Function} o
      */
     Route.prototype.controller = function(m, url, o) {
         context.push( new Router(m, this.groupUrl || '' + url, o).matchUrl() );
     }

     /**
      * @type class remit
      */
     remit = function() {
         this.event = {
             validatable: Function
         };
         this.collection = {};
         var self = this;

         module.extend(this, Route);

         this.run = function() {
             return dispatch.bind(this)(context);
         }

         this.loadFile = function (selector, file, callback) {
             var rgx_file = /(.*?)\.([html|php|json|xml|txt]+)/i;
             if (typeof file == 'function') {
                 callback = file;
             }
             if (rgx_file.test(selector)) {
                 file = selector;
                 selector = null;
             }
             if (selector) {
                 selector = (typeof selector == 'object') ? selector : (selector.indexOf('#') != -1 || selector.indexOf('.') != -1 ? document.querySelector(selector) : null);
                 if ( selector == null ) {
                     throw 'element in null';
                 }
             }
             xhr.open('GET', file);
             xhr.onreadystatechange = function (e) {
                 if (xhr.readyState == 4) {
                     return (callback && callback.call(xhr, xhr.responseText) || (selector && (selector.innerHTML = xhr.responseText, selector)), void 1 );
                 }
             }
             xhr.send();
         }

         return this;
     }

     module(['/lib/http/response.js', 'response'], Response);
     module(['/lib/http/response.js', 'response'], Response);
     module(['/lib/routing/route.js', 'route'], Route);
     module(['/lib/routing/router.js', 'router'], Router);
     module(['/lib/routing/dispatch.js', 'dispatch'], dispatch);
     module(['/lib/winStorage/localData.js', 'localData'], localData);
     module(['/lib/remit.js', 'remit'], remit);

     return remit;

 }(typeof window == "object" ? window : {}))
