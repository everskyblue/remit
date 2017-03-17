/**
 * remit
 * https://github.com/nikeMadrid/remit
 * @author Nike Madrid
 * @version 1.4.6
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
            _remit = this;
    
        var own = Object.prototype.hasOwnProperty;

        var config = {
            showPageNotFount: true,
            showAccessError: true,
            engine: null,
            activeRef: true,
            nameInputHidden: null,
            baseUrl: ''
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
            hash: location.hash,
            origin: location.origin,
            params: location.search,
            host: location.hostname,
            protocol: location.protocol,
            method: (function() {
                if (sessionStorage.getItem('_method')) {
                    return sessionStorage.getItem('_method');
                }
                return 'GET';
            }());
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
            validator: Function
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
                        obj.nameParams.push(value.replace(/\{|\}/g, ''));
                        if (sString.test(value && value.match(sString))) {
                            quote = quote.replace(value, "([a-zA-Z]+)");
                        } else if (sNumber.test(value && value.match(sNumber))) {
                            quote = quote.replace(value, "([0-9]+)");
                        } else if (sLower.test(value && value.match(sLower))) {
                            quote = quote.replace(value, "([a-z]+)");
                        } else if (sUpper.test(value && value.match(sUpper))) {
                            quote = quote.replace(value, "([A-Z]+)");
                        } else {
                            quote = quote.replace(value, "([0-9a-zA-Z_\\+\\-%\\:]+)");
                        }
                    });
                }

                obj.urls.push(quote);

                return new RegExp(quote + '\\/?');
            }());
        }
        
        function findUrl(url) {
            var m = null;
            if ( (m = url.exec(_url)) ) {
                if(url.lastIndex == m.index) {
                    ++url.lastIndex;
                    if (m[0].length == m.input.length) {
                        delete m.index;
                        delete m.input;
                        return m;
                    }
                }
            }
            return false;
        }
     
     
        this.Route = function () {
            this.todo = {};
            this.urls = [];
            this.nameParams = [];

            var self = route = this;
            var resolve = function(t, o, c) {
                if (!self.todo[t]) {
                    self.todo[t] = [];
                }

                if (typeof o === 'object') {
                    if (typeof o.pattern == 'undefined') {
                        throw 'not find pattern';
                    }
                    o.pattern = regexUrl((config.baseUrl + o.pattern), self);
                }else if(typeof o === 'string') {
                    o = regexUrl((config.baseUrl + o), self);
                }
                self.todo[t].push([o, c]);
            };
            this.map = function(methods, o, c) {
                if (!(methods instanceof Array)){
                    throw 'required array';
                }
                resolve(methods, o, c);
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
            this.when = function (o, c) {
                resolve('HASH', o,c);
                return this;
            };
            this.use = function (name, callback){
                //
            };
            this.send = function () {
                //
            };
    	};
    	
    	this.run = function(error) {
          var obt = route.todo[_method];
          each(obt, function (arr) {
              var p = arr[0],
                  o = arr[1],
                  u = (p instanceof RegExp) ? p : p.pattern,
                  get = findUrl(u);
              
              if (get) {
                  
              }
          });
       };
     };
	
}(window));