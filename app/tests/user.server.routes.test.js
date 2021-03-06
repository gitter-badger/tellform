'use strict';

var should = require('should'),
	_ = require('lodash'),
	app = require('../../server'),
	request = require('supertest'),
	Session = require('supertest-session'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	config = require('../../config/config'),
	tmpUser = mongoose.model(config.tempUserCollection),
	url = require('url');

/**
 * Globals
 */
var credentials, _User;
var _tmpUser, activateToken;
var username, userSession;

username = 'testActiveAccount1.be1e58fb@mailosaur.in';

/**
 * Form routes tests
 */
describe('User CRUD tests', function() {
	this.timeout(30000);

	beforeEach(function() {
		// Create user credentials
		credentials = {
			username: 'test7@test.com',
			password: 'password'
		};

		//Create a new user
		_User = {
			firstName: 'Full',
			lastName: 'Name',
			email: credentials.username,
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		};
        
        //Initialize Session
        userSession = Session(app);        
	});

	describe(' > Create, Verify and Activate a User > ', function() {
		//this.timeout(15000);

		it('should be able to create a temporary (non-activated) User', function(done) {
			userSession.post('/auth/signup')
				.send(_User)
				.expect(200)
				.end(function(FormSaveErr, FormSaveRes) {
					// Handle error
					should.not.exist(FormSaveErr);
                    
                    tmpUser.findOne({username: _User.username}, function (err, user) {
                        should.not.exist(err);
                        should.exist(user);
                        _tmpUser = user;

                        _User.username.should.equal(user.username);
                        _User.firstName.should.equal(user.firstName);
                        _User.lastName.should.equal(user.lastName);
                        activateToken = user.GENERATED_VERIFYING_URL;
                        console.log('activateToken: '+activateToken);
                        
                        userSession.get('/auth/verify/'+activateToken)
                            .expect(200)
                            .end(function(VerifyErr, VerifyRes) {
                                // Handle error
                                if (VerifyErr) return done(VerifyErr);
                                (VerifyRes.text).should.equal('User successfully verified');
                                
                                userSession.post('/auth/signin')
                                    .send(credentials)
                                    .expect('Content-Type', /json/)
                                    .expect(200)
                                    .end(function(signinErr, signinRes) {
                                        // Handle signin error
                                        if (signinErr) return done(signinErr);

                                        var user = signinRes.body;
                                        (user.username).should.equal(credentials.username);

                                        userSession.get('/auth/signout')
                                            .expect(200)
                                            .end(function(signoutErr, signoutRes) {

                                                // Handle signout error
                                                if (signoutErr) return done(signoutErr);

                                                (signoutRes.text).should.equal('You have successfully logged out.');

                                                done();
                                            });
                                    });
                            });
                    });
				});
		});

	});

	it(' > should be able to reset a User\'s password');

	it(' > should be able to delete a User account without any problems');

	afterEach(function(done) {
		User.remove().exec(function () {
			tmpUser.remove().exec(function(){
                userSession.destroy();
                done();
			});
		});
	});
});
