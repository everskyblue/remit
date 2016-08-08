#remit
remit an easy way to manage routes with javascript supports optencion of parameters, with the latest version released can validate a form and simulate methods such as GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## Download/Installation

**Download Source:**

[production](https://raw.githubusercontent.com/nikeMadrid/remit/v1.3.4/src/remit.min.js)
[development](https://raw.githubusercontent.com/nikeMadrid/remit/v1.3.4/src/remit.js)

**install with npm**

for install you should use the following command

`npm install remit-route`

---

##routes

configured to display the error page that is displayed by default and an example of how to use a route

```javascript
var app = new remit({
	/*showPageNotFount: true,
    showAccessError: true,*/
    viewPath: '/default_dir_view/'
})

var route = new app.Route({
	registerMiddleware: {
		'user': function(req, res, next) {
			if (req.params.id == 1){
				return next(res)
			}
			res.redirect('/')
		}
	}
})

route.get('/', function(req, res) {
    alert('home')
})
```

to obtain the parameters

```javascript
route.get('/user/{id}', function(req, res, id){
	alert(id) // or req.params.id 
})
```

among the options of this url:

- **/ user/{name}**
- **/ user/{id: number}**
- **/ user/{name: string}**
- **/ user/{name: upper}**
- **/ user/{name: lower}**
- **/ user/(?P&lt;id&gt;[\d+|\D+|otherOptions])**

if you want to submit a form by post method and validate the second parameter an object is passed

```javascript
route.get('/user/login', {
	validation: ['#idForm', {'name': 'required', 'pass': 'required'}],
	render: function(req, res) {
		console.log('via get');
   }
};
```
When running a view, the key is changed
```javascript
route.get('/user/login', {
	asyncValidation: ['#idForm', {'name': 'required', 'pass': 'required'}],
	render: function(req, res) {
		res.view('login.html');
   }
};
```
run the post method

```javascript
route.post('/user/login', function() {
	console.log('post')
})
```

or do so through the method options

```javascript
route.options('/user/login', {
	validation: ['#idForm', {'name': 'required', 'pass': 'required'}],
	render: function(req, res) {
		console.log('OPTIONS method')
   }
}
```

create groups

```javascript
route.group('/user', function(route) {
    route.get('/login', function() {
    	console.log('login')
    })
    
    route.get('/register', function() {
    	console.log('register')
    })
})
```

render and pass data to the view 

```javascript
route.get('/view', function(req, res) {
	res.view('index.html', {
	    welcome: 'welcome!'
	})
})
```

routes method

- **group**
- **get**
- **post**
- **put**
- **patch**
- **delete**
- **options**

***

#middleware

use the middleware that is registered, or pass as a function

```javascript
route.get('/verify/user/{id}', {
	middleware: 'user',
	render: function(req, res, id) {
		console.log(id);
   }
};
```

##validation

options available to validate

- **required**
- **min:min_value**
- **max:max_value**

```javascript
var validator = new app.validation('#idForm', {
	'inputName': 'required|min:6|max:20'
}).ifNotSubmit()
```

***

##local storage and session storage

using localData function to store data, by default uses the localStorage, you can specify that you want to use **session** specifying in the last parameter

```javascript
app.localData('key', 'value');
```
or  

```javascript
app.localData.set('key', 'value');
```


to add session

```javascript
app.localData('key', 'value', 'session');
```

the same to obtain or remove

```javascript
app.localData.delete('key' /*, null or 'session'*/);
```

get value

```javascript
app.localData.get('key' /*, null or 'session'*/);
```

##Cookie

add Cookie

```javascript
app.Cookie('key', 'value'/*, options {} */);
```

or

```javascript
app.Cookie.assign('key', 'value'/*, options {} */);
```

static methods
```javascript
app.Cookie.assign('key', 'value'/*, options {}  */);
app.Cookie.all(); // return an array
app.Cookie.delete('key');
app.Cookie.get ('key') // return a string
```

>when the browser is reloaded, methods post, put, patch and delete is executed once
