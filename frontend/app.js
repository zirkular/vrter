// import * as name from "./scene.js";

var log = {

  	debug: function(message) {
    	console.log("[holodeck - debug] " + message)
  	},

  	error: function(error) {
  	  	console.error("[holodeck - error] " + error);
  	}
};

var backend = {

	client: new DeepstreamClient('ws://localhost:6020/'),

  	configure: function() {
    	this.client.on('error', log.error.bind(this));
  	},

  	login: function(username, password, callback) {
    	log.debug("Trying login...");
    	this.client.login({username: username, password: password}, callback.bind(this));
	},
	
	logout: function() {
		this.client.close()
	}
};

var app = new Vue({
    el: '#app',
    data: {
        authenticated: false,
        errors: [],
        username: null,
        password: null,
	},

	destroyed: function() {
        backend.logout()
	},
	
    methods:{
        submitLogin: function (e) {
          	if (this.username && this.password) {
            	backend.login(this.username, this.password, this.loginCallback);
            	return true;
          	}
    
          	this.errors = [];
    
          	if (!this.username) {
            	this.errors.push('Username required.');
          	}
          	if (!this.password) {
            	this.errors.push('Password required.');
          	}         
        },
        loginCallback: function(success) {
          	this.errors = [];

          	if (success) {
            	log.debug("Logged in as [" + this.username + "]")
            	this.authenticated = true;
          	} else {
				this.errors.push("Credentials not found.")
				scene.debug("WHat")
          	}
        }
    }
});