const database = require("../database/database");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// const mailgun = require('nodemailer-mailgun-transport');
const sgMail = require('@sendgrid/mail');

const jwtSecret = process.env.JWT_SECRET;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const auth = {
    register: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                errors: {
                    status: 400,
                    title: "Email or Password missing",
                    detail: "Both email and password must be provided."
                }
            });
        }

        let db;
        try {
            db = await database.getDb();
            const existingUser = await db.collection.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    errors: {
                        status: 409,
                        title: "Email already exists",
                        detail: "A user with this email address already exists."
                    }
                });
            }

            const hash = await bcrypt.hash(password, 10);
            const verificationCode = crypto.randomBytes(20).toString('hex');

            const newUser = { email, password: hash, verificationCode, verified: false };
            await db.collection.insertOne(newUser);

            const verificationUrl = `http://localhost:3000/#/verify-email?code=${verificationCode}&email=${email}`;

            const msg = {
                to: email,
                from: 'anteo.ssr@gmail.com',
                subject: 'Email Verification by SSR editor from anteo(Anton & Teophil)',
                text: `Please verify your email by clicking the link: ${verificationUrl}`,
            };

            await sgMail.send(msg);
            return res.status(201).json({
                data: {
                    message: "User successfully registered. Please check your email for verification."
                }
            });

        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    title: "Database error",
                    detail: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },

    verifyEmail: async (req, res) => {
        const { code, email } = req.query;

        if (!code || !email) {
            return res.status(400).json({
                errors: {
                    status: 400,
                    title: "Invalid request",
                    detail: "Verification code and email must be provided."
                }
            });
        }

        let db;
        try {
            db = await database.getDb();
            const user = await db.collection.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    errors: {
                        status: 404,
                        title: "User not found",
                        detail: "No user found with this email address."
                    }
                });
            }

            if (user.verificationCode !== code) {
                return res.status(401).json({
                    errors: {
                        status: 401,
                        title: "Invalid verification code",
                        detail: "The verification code is invalid."
                    }
                });
            }

            await db.collection.updateOne({ email }, { $set: { verified: true, verificationCode: null } });

            return res.status(200).json({
                data: {
                    message: "Email successfully verified."
                }
            });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    title: "Database error",
                    detail: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                errors: {
                    status: 400,
                    title: "Email or password missing",
                    detail: "Email and password must be provided."
                }
            });
        }

        let db;
        try {
            db = await database.getDb();
            const user = await db.collection.findOne({ email });

            if (!user) {
                return res.status(401).json({
                    errors: {
                        status: 401,
                        title: "User not found",
                        detail: "User with provided email not found."
                    }
                });
            }

            if (!user.verified) {
                return res.status(403).json({
                    errors: {
                        status: 403,
                        title: "Email not verified",
                        detail: "Please verify your email before logging in."
                    }
                });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    errors: {
                        status: 401,
                        title: "Wrong password",
                        detail: "Password is incorrect."
                    }
                });
            }

            const payload = { email: user.email };
            const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

            return res.json({
                data: {
                    message: "User logged in successfully.",
                    token: jwtToken
                }
            });
        } catch (e) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    title: "Database error",
                    detail: e.message
                }
            });
        } finally {
            await db.client.close();
        }
    },

    checkToken: (req, res, next) => {
        const token = req.headers['x-access-token'];

        if (!token) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    title: "No token",
                    detail: "No token provided in request headers."
                }
            });
        }

        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    errors: {
                        status: 401,
                        title: "Failed authentication",
                        detail: "Invalid token."
                    }
                });
            }

            req.user = { email: decoded.email };
            next();
        });
    }
};

module.exports = auth;
