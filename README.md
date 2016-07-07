#remit
remit an easy way to manage routes with javascript supports optencion of parameters, with the latest version released can validate a form and simulate methods such as GET, POST, PUT, PATCH, DELETE, OPTIONS

***
##routes
an example of how to use a route
```javascript
var route = new remit()
route.get('/', function(req, res) {
    alert('home')
})
```

to obtain the parameters

```javascript
route.get('/user/{id}', function(req, res, id){
	alert(id)
})
```

among the options of this url:

- **/ user/{name: string}**
- **/ user/{id: number}**
- **/ user/{name: upper}**
- **/ user/{name: lower}**
- **/ user/{name}**
- **/ user/(?P&lt;id&gt;[\d+|\D+|otherOptions])**

if you want to submit a form by post method and validate the second parameter an object is passed

```javascript
route.get('/user/login', {
	form: '#idForm',
	validation: ['#idForm', {'name': 'required', 'pass': 'required'}],
    // or new validation('#idForm', {'name': 'required', 'pass': 'required'})
	render: function(req, res) {
		console.log('via get');
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
	form: '#idForm',
	validation: ['#idForm', {'name': 'required', 'pass': 'required'}],
    // or new validation('#idForm', {'name': 'required', 'pass': 'required'})
	render: function(req, res) {
		console.log('via get')
   }
}
```

routes method

- **get**
- **post**
- **put**
- **patch**
- **delete**
- **options**

***

##validation

options available to validate

- **required**
- **min:min_value**
- **max:max_value**

```javascript
var validator = new validation('#idForm', {
	'inputName': 'required|min:6|max:20'
}).isSubmit()
```

***

##local storage and session storage

using localData function to store data, by default uses the localStorage, you can specify that you want to use **session** specifying in the last parameter

```javascript
localData('key', 'value');
```
or  

```javascript
localData.set('key', 'value');
```


to add session

```javascript
localData('key', 'value', 'session');
```

the same to obtain or remove

```javascript
localData.delete('key' /*, null or 'session'*/);
```

get value

```javascript
localData.get('key' /*, null or 'session'*/);
```

##Cookie

add Cookie

```javascript
Cookie('key', 'value'/*, options {} */);
```

or

```javascript
Cookie.assign('key', 'value'/*, options {} */);
```

static methods
```javascript
Cookie.assign('key', 'value'/*, options {}  */);
Cookie.all(); // return an array
Cookie.delete('key');
Cookie.get ('key') // return a string
```

>when the browser is reloaded, methods post, put, patch and delete is executed once
