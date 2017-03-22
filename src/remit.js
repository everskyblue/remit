/**
 * remit
 * https://github.com/aizeni/remit
 * @author Nike Madrid
 * @version 1.5.1
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

(function(global) {
    var location = global.location;

    global.Remit = function (cnf) {
        var route,
            _remit = this,
            exec = {};

        var own = Object.prototype.hasOwnProperty;

        var config = {
            showPageNotFount: true,
            showAccessError: true,
            engine: null,
            activeRef: true,
            nameInputHidden: null,
            baseUrl: '',
            prefixHash: '#!/'
        };

        if (typeof cnf === 'object') {
            for (var p in cnf) {
                if (own.call(config, p)){
                    config[p] = cnf[p];
                }
            }
        }

        var globalRgx  = /{([0-9a-zA-Z_\+\-%\:]+)}/g,
            sUpper     = /{((.*?):upper)}/g,
            sLower     = /{((.*?):lower)}/g,
            sString    = /{((.*?):string)}/g,
            sNumber    = /{((.*?):number)}/g;

        var __LOCAL__ = {
            path: (location.pathname || '/'),
            hash: function () {
                return location.hash;
            },
            origin: location.origin,
            params: location.search,
            host: location.hostname,
            protocol: location.protocol,
            method: (function() {
                if (sessionStorage.getItem('_method')) {
                    return sessionStorage.getItem('_method');
                }
                return 'GET';
            }())
        };

        var rgx_file = /(\/(\w+)\.[html|php]+)/i;
        if ( rgx_file.test(__LOCAL__.path) ) {
            __LOCAL__.path = __LOCAL__.path.replace(
                __LOCAL__.path.match(rgx_file)[0].substr(1),
                ''
            );
        }

        var _url    = __LOCAL__.path,
            _method = __LOCAL__.method,
            _hash   = __LOCAL__.hash;

        this.evt = {
            validator: global.Function
        };

        function each(arr, func) {
            if(arr instanceof Array) {
                for (var prop in arr) {
                    if (func.call(null, arr[prop], prop)) {
                        break;
                    }
                }
            }
        }

        function pregQuote(str, rpl) {
            if(str.match(/\//g) !== null) {
                str = String(str).replace(new RegExp('[.\\\*$=!<>|\\' + (rpl || '') + ']', 'g'),'\\$&');
            }
            return str;
        }

        function regexUrl(url, obj) {
            var quote = pregQuote(url, '/');

            return (function () {
                var m = quote.match(globalRgx);
                if (m !== null) {
                    each(m, function (value) {
                        if (sString.test(value) && value.match(sString)) {
                            quote = quote.replace(value, "([a-zA-Z]+)");
                        } else if (sNumber.test(value) && value.match(sNumber)) {
                            quote = quote.replace(value, "([0-9]+)");
                        } else if (sLower.test(value) && value.match(sLower)) {
                            quote = quote.replace(value, "([a-z]+)");
                        } else if (sUpper.test(value) && value.match(sUpper)) {
                            quote = quote.replace(value, "([A-Z]+)");
                        } else {
                            quote = quote.replace(value, "([0-9a-zA-Z_\\+\\-%\\:]+)");
                        }
                    });
                }

                if(obj) {
                    obj.nameParams[new RegExp(quote + '\\/?')] = m;
                    obj.urls.push(quote);
                }

                return new RegExp(quote + '\\/?');
            }());
        }

        function findUrl(url, dd) {
            var m = null, f_url = _url;

            if (dd === true) {
                f_url = _url + _hash();
            }

            if ( (m = url.exec(f_url)) ) {
                if(url.lastIndex == m.index) {
                    if (m[0].length == m.input.length) {
                        delete m.index;
                        delete m.input;
                        return m;
                    }
                }
            }
            return false;
        }

        function exec_route(o, params) {
            if(typeof o === 'object') {
                if(o.render) o.render.apply(o, params);
            }else if(typeof o === 'function') {
                o.apply({}, params);
            }
        }

        function resolvePattern(t, o, base, ctx) {
            if (typeof o === 'object') {
                if (typeof o.pattern == 'undefined') {
                    throw 'not find pattern';
                }
                o.pattern = regexUrl(((base || '')+ (route.groupUrl || '') + (t === 'HASH' ? config.prefixHash : '') + o.pattern), ctx);

            }else if(typeof o === 'string') {
                o = regexUrl(((base || '') + (route.groupUrl || '') + (t === 'HASH' ? config.prefixHash : '')+ o), ctx);
            }
            return o;
        }

        this.Route = function () {
            this.todo = {};
            this.urls = [];
            this.nameParams = [];

            var self = route = this;
            var resolve = function(t, o, c) {
                if (!self.todo[t]) self.todo[t] = [];
                o = resolvePattern(t, o, config.baseUrl, self);
                self.todo[t].push([o, c]);
            };
            this.group = function (url, callback) {
                this.groupUrl = url;
                callback.call(this, this);
            };
            this.map = function(methods, o, c) {
                if (!(methods instanceof Array)){
                    throw 'required array';
                }

                resolve(methods.join('/'), o, c);
                return this;
            };
            this.get = function(o, c) {
                resolve('GET', o, c);
                return this;
            };

            this.post = function (o, c) {
                resolve('POST', o, c);
                return this;
            };

            this.put = function(o, c) {
                resolve('PUT', o, c);
                return this;
            };
            this.patch = function(o, c) {
                resolve('PATCH', o, c);
                return this;
            };
            this.delete = function(o,c){
                resolve('DELETE', o, c);
                return this;
            };
            this.options = function(o,c){
                resolve('OPTIONS', o, c);
                return this;
            };
            this.when = function (o, c) {
                resolve('HASH', o,c);
                return this;
            };
            this.use = function (name, url, callback){
                e_type('use', name);
                callback = typeof url == 'function' ? url : callback;
                url = typeof url == 'string' ? config.prefixHash + url : false;
                exec['use'][name].url.push(url);
                exec['use'][name].fn.push(callback);
                return this;
            };
            this.send = function (name, callback) {
                e_type('send', name);
                exec['send'][name].fn.push(callback);
                return this;
            };

            function e_type(type, name){
                if(!exec[type]) exec[type] = {};
                if(!exec[type][name]) {
                    exec[type][name] = {
                        type: [],
                        url: [],
                        fn: []
                    };
                }
            }
        };

        this.hash = function(evt){
            each(this.route_hash, function (arr) {
                var p = arr[0],
                    o = arr[1],
                    u = (p instanceof RegExp) ? p : p.pattern,
                    get = findUrl(u, true);

                if (get) {
                    var url = get.shift();
                    exec_route(o, get);
                }
            });
        };

        this.run = function(error) {
            route.groupUrl = '';

            this.route_hash = route.todo['HASH'] || [];

            delete route.todo['HASH'];

            var pass = false, url, mods;

            for (var mtd in route.todo) {
                each(route.todo[mtd], function (arr) {
                    var p = arr[0],
                        o = arr[1],
                        u = (p instanceof RegExp) ? p : p.pattern,
                        get = findUrl(u);

                    if(get) {
                        pass = true;
                        url = get.shift();
                        mods = mtd.split('/');
                        if (mods.indexOf(_method) >= 0){
                            if (exec.use && exec.use[p.name] ) {
                                var use_o = exec.use[p.name],
                                    u_url = use_o.url,
                                    u_fn = use_o.fn;

                                each(u_url, function(u, i){
                                    this.route_hash.push([resolvePattern(false, url + u), u_fn[i]]);
                                }.bind(this));
                            }

                            exec_route(o, get);
                        }
                    }
                }.bind(this))
            }

            if (this.route_hash){
                if(window.addEventListener) window.addEventListener('hashchange', this.hash.bind(this));
                if(window.attachEvent) window.attachEvent('hashchange', this.hash.bind(this));
                this.hash(null);
            }

            if (typeof error === 'function' && pass === false) {
                error();
            }
        };
    };

}(window));