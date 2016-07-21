/**
 * remit
 * https://github.com/nikeMadrid/remit
 * @author Nike Madrid
 * @version 1.3.4
 * @licence MIT
 */


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

var xhr = null;

(function (global) {
    'use strict';

    global.remit = function () {

        if (global.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        }else {
            try {
                xhr = new new ActiveXObject("Microsoft.XMLHTTP");
            }catch (e) {
                console.warn(e);
            }
        }

        /* global regex */
        var globalRgx  = /{([0-9a-zA-Z_\+\-%\:]+)}/g,
            sUpper     = /{((.*?):upper)}/g,
            sLower     = /{((.*?):lower)}/g,
            sString    = /{((.*?):string)}/g,
            sNumber    = /{((.*?):number)}/g;

        var _SERVER = {
            path: location.pathname || '/',
            hash: location.hash.replace(/\#\//g, '') || '/',
            protocol: location.protocol.replace(':', ''),
            beforeUrl: location.origin || '/',
            params: location.search || '',
            host: location.hostname
        };

        var self = this;

        var context = [];

        var hasOwnProperty = Object.prototype.hasOwnProperty;

        this.event = {
            validatable: Function
        };

        this.collection = {};

        /**
         * template
         */

        var count = 0;
        var PRINTED = new RegExp('(\{[\\\\{{)]([json|raw|escape]+)*[\|]?(.*?)[(\\\\}}]\})', 'g');
        var CONCATOBJECT = new RegExp('([.*?]\.(.+))', 'gi');
        var MAINTAIN = new RegExp('(\{\%[^\{\%)]([include|yield|block|extends]+)(.*?)[\%\}]\})', 'g');

        /**
         * @param url
         * @param callbackSuccess
         * @returns {*}
         */
        function templateRequest(url, callbackSuccess) {
            var t = new Promise(function(resolve, reject) {
                var client = new XMLHttpRequest();
                client.open('GET', url);
                client.send();
                client.onload = function () {
                    if (this.status == 200) {
                        resolve(this.response);
                    } else {
                        reject(this.statusText);
                    }
                };
                client.onerror = function () {
                    reject(this.statusText);
                };
            }).then(callbackSuccess);

            return t;
        }

        this.detached = function (str, assign) {
            this.treplace = [];
            this.tsection = {
                type: [],
                name: []
            };

            this.data = assign;
            this.compileData = this.resolver(str);
        };

        this.detached.compile = function (str, data) {
            return new this(str, data);
        };

        this.detached.view = function (filename, context, data) {
            var pos;

            if (typeof data == "undefined"){
                data = context;
                context = null;
            }

            templateRequest(filename, function (v) {
                var engine = self.detached.compile(v, data);

                if (!context) {
                    var outlet = document.querySelector('.outlet');
                    var ctx = outlet;
                    if (!outlet) {
                        ctx = document.createElement('div');
                        ctx.setAttribute('class', 'outlet');
                        document.body.appendChild(ctx);
                        ctx = document.querySelector('.outlet');
                    }
                    engine.context = ctx;
                }else {
                    engine.context = context;
                }

                var obtain = engine.tsection.name;
                var types = engine.tsection.type;

                types.forEach(function (type, index, arr) {
                    if (type == 'include') {

                        engine.includeContent(obtain[index], engine.compileData, index);

                        delete engine.tsection.name[index];
                        delete engine.tsection.type[index];

                    }else if (type == 'extends' && arr.indexOf('include') == -1) {

                        engine.extend(engine.compileData);

                        delete engine.tsection.name[index];
                        delete engine.tsection.type[index];
                    }
                });
            })
        };

        this.detached.prototype = {

            resolver: function (r) {
                if ( PRINTED.test(r) ) {
                    r = this.rdata(r);
                }
                if( MAINTAIN.test(r) ) {
                    r = this.maintainContent(r)
                }

                return r;
            },

            extend: function (content) {
                var pos;
                var self = this;
                if ( (pos = this.tsection.type.indexOf('extends')) != -1) {
                    var replace = this.treplace[pos];

                    templateRequest(this.tsection.name[pos], function (ext) {
                        var rplc = [];
                        var getBlock = content.split(/{%\s*(block\s*(.*))\s*%}/mg);
                        var yieldN = ext.match(/{%\s*yield\s*(.*)\s*%}/mg);

                        getBlock.forEach(function (b, i, a) {
                            if ( !(/(block+\s*(.*))\s*/g.test(b)) ) {
                                rplc.push(a[(1 + i)].replace(/{%\s*endblock\s*%}|\n+/g, ''))
                            }
                        });

                        rplc.shift();

                        for (var i in rplc) {
                            ext = ext.replace(yieldN[i], rplc[i]);
                        }

                        self.context.innerHTML = self.resolver(ext);
                    });
                }
            },

            includeContent: function (filename, content, i) {
                var self = this;
                templateRequest(filename, function (include) {
                    include = self.resolver(include);
                    content = content.replace(self.treplace[i], include);

                    self.extend(content);
                })
            },

            maintainContent: function (r) {
                return r.replace(MAINTAIN, function (m) {
                    var opt     = /(\{\%[^\{\%)]([include|yield|block|extends]+)(.*?)[\%\}]\})/g.exec(m);
                    var type    = opt[2].replace(/\s+/g, ''); // type yield|block|extends|include
                    var name    = opt[3].replace(/\s+/g, ''); // name type
                    this.tsection.type.push(type);
                    this.tsection.name.push(name);
                    this.treplace.push(m);
                    return m;
                }.bind(this));
            },

            rdata: function (str) {
                return str.replace(PRINTED, function (m) {
                    var t           = '';
                    var formatType  = /(json|raw|escape)+/g.exec(m) || [];
                    var tvar 	    = m.replace(/\s+/g, '')
                        .replace((formatType[0] || '' ) + '|', '')
                        .replace(/\{\{(.*)?\}\}/g, '$1');

                    var returnsV = function (tvar) {
                        switch (formatType[0]) {
                            case 'json':
                                t = this.json(tvar);
                                break;

                            case 'raw':
                                t = tvar.toString();
                                break;

                            case 'escape':
                                t = this.escapeHTML(tvar);
                                break;
                        }

                        return t || tvar;
                    };

                    if ( formatType && !(CONCATOBJECT.test(tvar)) ) {
                        if (!this.data[tvar]) {
                            throw new TypeError('scope var not exists ' + tvar)
                        }

                        return returnsV.call(this, this.data[tvar]);
                    }else {
                        var divided = tvar.split('.');
                        var cp = this.data;
                        for (var n in divided) {
                            if (cp[divided[n]]) {
                                cp = cp[divided[n]];
                            } else {
                                throw new TypeError('property '+ divided[n] +' not exists');
                            }
                        }

                        return (typeof cp == 'function' ? returnsV.call(this, cp.call(this.data)) : returnsV.call(this, cp));
                    }
                }.bind(this));
            },

            json: function (j) {
                return JSON.stringify(j);
            },

            escapeHTML: function (h) {
                var n = h;
                n = n.replace(/&/g, '&amp;');
                n = n.replace(/</g, '&lt;');
                n = n.replace(/>/g, '&gt;');
                n = n.replace(/"/g, '&quot;');
                return n;
            }

        };

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
         * @return Object
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
         * @param {Function|Object} obj
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
         *
         * @param url
         * @param obj
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

            return (function () {
                var m = quote.match(globalRgx);
                if (m !== null) {
                    for (var i in m) {
                        if (sString.test(m[i] && m[i].match(sString))) {
                            quote = quote.replace(m[i], "([a-zA-Z]+)");
                        } else if (sNumber.test(m[i] && m[i].match(sNumber))) {
                            quote = quote.replace(m[i], "([0-9]+)");
                        } else if (sLower.test(m[i] && m[i].match(sLower))) {
                            quote = quote.replace(m[i], "([a-z]+)");
                        } else if (sUpper.test(m[i] && m[i].match(sUpper))) {
                            quote = quote.replace(m[i], "([A-Z]+)");
                        } else {
                            quote = quote.replace(m[i], "([0-9a-zA-Z_\\+\\-%\\:]+)");
                        }
                    }
                }

                obj.urls.push(quote);

                return eval('/' + quote + '\\/?/');
            }());
        }

        /**
         * @param form
         * @param validator
         * @returns {*}
         */
        this.validation = function (form, validator) {
            'use strict';

            if ( typeof this.iterate == 'undefined' ) {
                return new this.validation(form, validator)
            }

            /* message errors */
            this.msg = {
                'max': 'max value {max}',
                'min': 'min value {min}',
                'required': 'input is required'
            };

            /* validation required in max and min value */
            this.values = {
                max: [],
                min: []
            };



            this.errors = [];

            this.form = document.querySelector(form);

            this.keysNameInput = Object.keys(validator);

            this.typeValidator = Object.values(validator);

            this.iterate();

            return this;
        };

        this.validation.prototype = {

            iterate: function () {
                for (var i in this.typeValidator) {
                    this.splitRules(this.keysNameInput[i], this.typeValidator[i])
                }
            },

            setErrors: function (key, val) {
                this.errors[key] = val;
            },

            splitRules: function (nameInput, rules) {
                var f = rules.split('|').map(function(item) {
                    if(/\d+/g.test(item)) {

                        var type = item.match(/\D+/g)[0].replace(/\:/g, '');
                        var rule_value = item.match(/\d+/g)[0];
                        var func = this[type];

                        if (type == 'min') {
                            this.values.min[nameInput] = parseInt(rule_value);
                        }else if (type == 'max') {
                            this.values.max[nameInput] = parseInt(rule_value);
                        }

                        this.setErrors(nameInput, true);
                        var input = document.querySelector('input[name="'+nameInput+'"]');
                        this.rules.call(this, input, this.compareValue, parseInt(rule_value));

                    }else {
                        var func = this[item];
                        if (typeof func == 'function') {
                            if(item == 'required') {
                                this.setErrors('required_'+nameInput, true);
                            }

                            var input = document.querySelector('input[name="'+nameInput+'"]');
                            this.rules.call(this, input, func);
                        }
                    }

                }.bind(this));
            },

            rules: function (inputHTML, func, rule_value) {
                setInterval(func.bind(this, inputHTML, rule_value), 450);
            },

            compareValue: function (inputHTML) {
                var max = this.values.max[inputHTML.name];
                var min = this.values.min[inputHTML.name];
                if ( (!max && min &&  inputHTML.value.length >= min) || (!min && max && inputHTML.value.length <= max) || (min && max && inputHTML.value.length >= min && inputHTML.value.length <= max) ) {
                    this.setErrors(inputHTML.name, false);
                }else{
                    this.setErrors(inputHTML.name, true);
                }
            },

            required: function (inputHTML) {
                var name = inputHTML.name;
                if (inputHTML.value.length != 0) {
                    this.setErrors('required_'+ name, false);
                }else {
                    this.setErrors('required_'+ name, true);
                }
            },

            ifNotSubmit: function () {
                var self = this;

                var showMsg = function(key, tr) {
                    if(Object.prototype.hasOwnProperty.call(self.msg, key)) {
                        return self.msg[key].replace(/\{[max|min]*\}/g, tr);
                    }
                    return '';
                };

                this.form.addEventListener('submit', function (e) {

                    var filterErrors = Object.keys(self.errors).filter(function (item) {

                        if (self.errors[item]) {
                            var node = document.createElement('div');
                            node.setAttribute('class', 'errors');
                            var i = document.querySelector('input[name="'+item.replace('required_', '')+'"]');
                            if (item.indexOf('required') == -1) {

                                var min = self.values.min[item];
                                var max = self.values.max[item];

                                if (min) {
                                    node.innerHTML = '<p class="error error-min-value" style="margin-bottom: 5px;">'+ showMsg('min', min) +'</p>';
                                }

                                if (max) {
                                    node.innerHTML += '<p class="error error-max-value" style="margin-bottom: 5px;">'+ showMsg('max', max) +'</p>';
                                }

                            }else {
                                if (self.errors[item]) {
                                    node.innerHTML = '<p class="error error-required-value" style="margin-bottom: 5px;">'+ showMsg('required') +'</p>';
                                }
                            }

                            setTimeout(function () {
                                var element = document.querySelector('.errors');

                                if (typeof element.parentNode != null) {
                                    element.parentNode.removeChild(element);
                                }

                            }, 2050);


                            i.parentNode.insertBefore(node, i);
                        }

                        return self.errors[item] == true;
                    });

                    if (filterErrors.length > 0) {
                        e.preventDefault();
                    }
                });
            }

        };

        /**
         * @param name
         * @param value
         * @param options
         * @returns {global.remit}
         */
        this.Cookie = function Cookie (name, value, options) {
            Cookie.key = name;
            Cookie.value = value;
            Cookie.options = options;
            Cookie.injectCookie();
            return this;
        };

        /**
         * @param {String} name
         * @param {String} value
         * @param {Object} options
         */
        this.Cookie.assign = function(name, value, options) {
            this(name, value, options);
        };

        /**
         * @param {String} name
         * @return {String}
         */
        this.Cookie.first = function(name) {
            return this.all()[name] || '';
        };

        /**
         * @param {String} name
         * @param {String} path
         */
        this.Cookie.remove = function(name, path){
            var date = new Date(),
                path = path ? 'path='+path+';' : '';
            date.setTime(date.getTime()-date.getTime());
            document.cookie = name+'=;'+path+'expires='+date.toUTCString();
        };

        /**
         * @return {Array}
         */
        this.Cookie.all = function() {
            var cookies = document.cookie;
            var arrCookie = [],
                store,
                arr = (cookies.indexOf(';') != -1) ? cookies.replace(/\s+/g, '').split(';') : cookies.split('=');

            if(cookies) {
                arr.forEach(function (e, i, a) {
                    store = (e.indexOf('=') != - 1) ? e.split('=') : arr;
                    arrCookie[store[0]] = store[1];
                });
            }

            return arrCookie;
        };

        /**
         * @param {String} type
         * @return {number}
         */
        this.Cookie.buildAgeCookie = function(type) {
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
        };

        /**
         * create cookie
         */
        this.Cookie.injectCookie = function() {
            var construct = this.key+'='+this.value,
                options = this.options,
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
                            construct += ';max-age='+this.buildAgeCookie(options[name]);
                            break;
                        case 'expires':
                            construct += ';expires='+options[name];
                            break;
                        case 'secure':
                            construct += ';secure='+options[name];
                            break;
                    }
                }
            }

            if(!this.first(this.key)) {
                document.cookie = construct;
            }
        };

        /**
         * @param {String} name
         * @param {String} value
         * @param {String} type
         */
        this.localData = function localData(name, value, type) {
            value = (typeof name == 'object') ? name :(function() {var dd = []; return dd[name] = value, dd; }());
            localData.action(value, type || 'local', 'set');
        };

        /**
         * @param {String} name
         * @param {String} value
         * @param {String} type
         */
        this.localData.set = function (name, value, type) {
            this(name, value, type);
        };

        /**
         * @param {String} name
         * @param {String} type
         * @return {String}
         */
        this.localData.get = function(name, type) {
            return this.action(name, type || 'local', 'get');
        };

        /**
         * @param {String} name
         * @param {String} type
         */
        this.localData.remove = function(name, type) {
            this.action(name, type || 'local', 'remove');
        };

        /**
         * @param {String} name
         * @param {String} type
         * @return {*|String|Boolean|null}}
         */
        this.localData.exists = function(name, type) {
            return this.action(name, type || 'local', 'exists');
        };

        /**
         * @param {String|Object} name
         * @param {String} typeStorage
         * @param {String} action
         * @return {*}
         */
        this.localData.action = function(value, typeStorage, action) {
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
        };

        /**
         * @returns {global.remit}
         * @constructor
         */
        this.Request = function () {
            var http = infoHTTP();
            this.request = {} || [];

            /**
             * @return {Boolean}
             */
            this.isMobile = function() {
                return (['android', 'ipad', 'iphone'].indexOf(this.systemName) != -1);
            };

            /**
             * @return {Boolean}
             */
            this.isIphone = function() {
                return (['iphone'].indexOf(this.systemName) != -1);
            };

            /**
             * @return {Boolean}
             */
            this.isIpad = function() {
                return (['ipad'].indexOf(this.systemName) != -1);
            };

            /**
             * @return {Boolean}
             */
            this.isAndroid = function() {
                return (['android'].indexOf(this.systemName) != -1);
            };

            /**
             * @return {Boolean}
             */
            this.isPC = function() {
                return (this.isMobile() == false);
            };

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
            };

            /**
             * @param {String} fount url
             * @param {String} method
             * @param {Object|String} callback
             * @param {Array} args
             */
            this.env = function(fount, method, callback, args) {
                this.request = [fount, method, callback, args];
            };

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
            };

            /**
             * @return {String}
             */
            this.getOrigin = function() {
                return http.beforeUrl;
            };

            /**
             * @return {String}
             */
            this.getProtocol = function() {
                return http.protocol;
            };

            /**
             * @return {Boolean}
             */
            this.isHTTPS = function() {
                return http.getProtocol() == 'https';
            };

            /**
             * @return {Boolean}
             */
            this.isHTTP = function() {
                return http.getProtocol() == 'http';
            };

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
        };

        /**
         * @param m
         * @return {Boolean}
         */
        this.Request.isGet = function(m) {
            return ['GET', 'OPTIONS'].indexOf(m) != -1;
        };

        /**
         * @param m
         * @return {Boolean}
         */
        this.Request.isAllNotGet = function(m) {
            return ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].indexOf(m) != -1;
        };

        /**
         * @returns {Request}
         * @constructor
         */
        this.Response = function () {
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
            };

            /**
             * @return void
             */
            this.back = function() {
                window.history.back();
            };

            /**
             * @param req
             * @param route
             */
            this.send = function (req, route) {
                if (req.request.length > 0) {
                    var u = req.request[0];
                    var m = req.request[1];
                    var f = req.request[2];
                    var a = req.request[3];
                    route.event.validatable();
                    renderer(f, [req, this].concat(a));
                    if (self.Request.isAllNotGet(m)) {
                        window.onbeforeunload = function(e) {
                            self.Cookie.remove('req_met', ( window.srcStorage || u));
                        }
                    }
                    this.propagation = true;
                    delete window.srcStorage;
                }else {
                    if (this.propagation == false && self.Cookie.first('req_met')) {
                        self.Cookie.remove('req_met', ( window.srcStorage || u || http.path));
                    }
                }
            };

            /**
             * @param {String} filename
             * @param {HTMLElement} context
             * @param {Object} data
             */
            this.view = function (filename, context, data) {
                self.detached.view(filename, context, data);
            };

            /**
             * @param {String} str
             * @param {Object} data
             * @return detached
             */
            this.viewCompileData = function (str, data) {
                return self.detached.compile(str, data);
            };

            /**
             * @return String
             */
            this.resCookie = function (name) {
                return self.Cookie.first(name);
            };

            return this;
        };

        /**
         * @param {String} method
         * @param {String} url
         * @param {Function|Object} func
         * @returns {global.remit}
         * @constructor
         */
        this.Router = function (method, url, func) {
            this.urls = [];
            this.capture = {};

            this.setMethod(method);
            this.setUrl(url);
            this.setFunc(func);

            return this;
        };

        /**
         * @override
         * @param {String} url
         */
        this.Router.prototype.setUrl = function(url) {
            this.url = url;
        };

        /**
         * @param {String} m
         */
        this.Router.prototype.setMethod = function(m) {
            this.method = m;
        };

        /**
         * @param {Object|Function} c
         */
        this.Router.prototype.setFunc = function(c) {
            this.func = c;
        };

        /**
         * @return this
         */
        this.Router.prototype.matchUrl = function() {
            this.setUrl(captureRgx(this.getUrl(), this));
            return this;
        };

        /**
         * @return String
         */
        this.Router.prototype.getUrl = function() {
            return this.url;
        };

        /**
         * @return String
         */
        this.Router.prototype.getMethod = function() {
            return this.method;
        };

        /**
         * @return Object|Function
         */
        this.Router.prototype.getFunc = function() {
            return this.func;
        };

        /**
         * @returns {global.remit}
         * @constructor
         */
        this.Route = function () { return this; };

        /**
         * @param {String} url
         * @param {Function} func
         */
        this.Route.prototype.group = function(url, func) {
            this.groupUrl = url;
            func.call(this, this);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.get = function(p, o) {
            this.controller("GET", p, o);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.post = function(p, o) {
            this.controller("POST", p, o);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.put = function(p, o) {
            this.controller("PUT", p, o);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.patch = function(p, o) {
            this.controller("PATCH", p, o);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.delete = function(p, o) {
            this.controller("DELETE", p, o);
        };

        /**
         * @param {String} p
         * @param {Object|Function} o
         */
        this.Route.prototype.options = function(p, o) {
            this.controller("OPTIONS", p, o);
        };

        /**
         * @param {String} m
         * @param {String} url
         * @param {Object|Function} o
         */
        this.Route.prototype.controller = function(m, url, o) {
            context.push( new self.Router(m, (this.groupUrl || '') + url, o).matchUrl() );
        };

        /**
         * @param {Boolean} is
         * @return Boolean
         * @description
         * Verify if there the cookie and a method where to send the form
         */
        function compruebeEmulatorAccessRequestMethod(is) {
            return !!((self.Cookie.first("req_met") == '' || self.Cookie.first("req_met") == 'false') && is == false);

        }

        /**
         * @return Boolean
         * @description
         * Verify if there the cookie and run another method other than get
         */
        function emulatorAccessMethod() {
            return !!(self.Cookie.first('req_met') != '' && self.Cookie.first('req_met') != 'false');

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
            var g = (validator instanceof Array) ? new self.validation(validator[0], validator[1]) : validator;
            g.ifNotSubmit();
            selector.addEventListener('submit', function(ev) {
                var isErrors = Object.values(g.errors).filter(function(item){ return item == true; });

                Object.defineProperty(window, 'srcStorage', {
                    enumerable: false,
                    writable: false,
                    configurable: true,
                    value: selector.getAttribute('action') || u
                });

                if (isErrors.length == 0) {
                    self.Cookie.remove('req_met', window.srcStorage);
                    self.Cookie('req_met', Date.now(), {
                        path: window.srcStorage
                    });
                }else {
                    self.Cookie('req_met', false, {
                        path: window.srcStorage
                    });
                }
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
                var request = new self.Request();
                var response = new self.Response();
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

                        if (self.Request.isGet(method)) {
                            many.push(method);
                            self.event.validatable = selector && selector.getAttribute('action') || fount ? eventForm.bind(self, validatable, selector, fount) : Function;
                            if (!emulatorAccessMethod() || method == 'OPTIONS') {
                                request.env(fount, method, callback, args);
                            }
                        }else if (self.Request.isAllNotGet(method))  {
                            var isManyUrls = many.indexOf('GET') != -1;
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
        };

        this.run = function() {
            return dispatch.bind(this)(context);
        };

        /**
         * @param {String} selector element html
         * @param {String} file
         * @param {Function} callback
         */
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
            };
            xhr.send();
        };

        return this;
    };

    return global;

}(window || {}));