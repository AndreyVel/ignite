/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var router = require('express').Router();
var passport = require('passport');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var db = require('../db');

// GET dropdown-menu template.
router.get('/select', function (req, res) {
    res.render('templates/select', {});
});

// GET dynamic tabs template.
router.get('/tab', function (req, res) {
    res.render('templates/tab', {});
});

// GET confirmation dialog.
router.get('/confirm', function (req, res) {
    res.render('templates/confirm', {});
});

// GET copy dialog.
router.get('/copy', function (req, res) {
    res.render('templates/copy', {});
});

/* GET login dialog. */
router.get('/login', function (req, res) {
    res.render('login');
});

/* GET reset password page. */
router.get('/reset', function (req, res) {
    res.render('reset');
});

/* GET reset password page. */
router.get('/resetModal', function (req, res) {
    res.render('resetModal');
});

/**
 * Register new account.
 */
router.post('/register', function (req, res) {
    db.Account.count(function (err, cnt) {
        if (err)
            return res.status(401).send(err.message);

        req.body.admin = cnt == 0;

        db.Account.register(new db.Account(req.body), req.body.password, function (err, account) {
            if (err)
                return res.status(401).send(err.message);

            if (!account)
                return res.status(500).send('Failed to create account.');

            new db.Space({name: 'Personal space', owner: account._id}).save();

            req.logIn(account, {}, function (err) {
                if (err)
                    return res.status(401).send(err.message);

                return res.redirect('/configuration/clusters');
            });
        });
    });
});

router.post('/restore', function(req, res) {
    var token = crypto.randomBytes(20).toString('hex');

    db.Account.findOne({ email: req.body.email }, function(err, user) {
        if (err)
            return res.status(401).send('No account with that email address exists!');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
            if (err)
                return res.status(401).send('Failed to send e-mail with reset link!');

            var transporter  = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: '!!! YOUR USERNAME !!!',
                    pass: '!!! YOUR PASSWORD !!!'
                }
            });

            var mailOptions = {
                from: 'passwordreset@YOUR.DOMAIN',
                to: user.email,
                subject: 'Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
                'Link will be valid for one hour.\n'
            };

            transporter.sendMail(mailOptions, function(err, info){
                if (err)
                    return res.status(401).send('Failed to send e-mail with reset link!');

                console.log('Message sent: ' + info.response);

                return res.status(500).send('An e-mail has been sent with further instructions.');
            });
        });
    });
});

router.post('/reset/:token', function(req, res) {
    db.Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (err)
            return res.status(500).send(err);

        user.setPassword(newPassword, function (err, updatedUser) {
            if (err)
                return res.status(500).send(err.message);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            updatedUser.save(function (err) {
                if (err)
                    return res.status(500).send(err.message);

                var transporter  = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: '!!! YOUR USERNAME !!!',
                        pass: '!!! YOUR PASSWORD !!!'
                    }
                });

                var mailOptions = {
                    from: 'passwordreset@YOUR.DOMAIN',
                    to: user.email,
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };

                transporter.sendMail(mailOptions, function(err, info){
                    if (err)
                        return res.status(401).send('Failed to send e-mail with reset link!');

                    console.log('Message sent: ' + info.response);

                    res.redirect('/login');
                });
            });
        });
    });
});

/**
 * Login in exist account.
 */
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user) {
        if (err)
            return res.status(401).send(err.message);

        if (!user)
            return res.status(401).send('Invalid email or password');

        req.logIn(user, {}, function (err) {
            if (err)
                return res.status(401).send(err.message);

            res.redirect('/configuration/clusters');
        });
    })(req, res, next);
});

/**
 * Logout.
 */
router.get('/logout', function (req, res) {
    req.logout();

    res.redirect('/');
});

/* GET home page. */
router.get('/', function (req, res) {
    if (req.isAuthenticated())
        res.redirect('/configuration/clusters');
    else
        res.render('index');
});

module.exports = router;
