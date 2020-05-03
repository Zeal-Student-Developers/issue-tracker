const User = require("../models/User");

class UserService {
    constructor() {}

    // ADD USER
    async addUser(zprn, firstName, lastName, password, department, role) {
        const user = new User({
            zprn: zprn,
            role: role,
            firstName: firstName,
            lastName: lastName,
            department: department,
            password: password,
            role: role,
        });
        return new Promise((resolve, reject) => {
            user.save()
                .then((user) => {
                    return resolve(user);
                })
                .catch((err) => {
                    return reject(err);
                });
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            User.find({}, (err, users) => {
                if (err) {
                    console.log(err);
                } else {
                    return resolve(users);
                }
            });
        });
    }

    // FIND USER WITH ZPRN
    async getUser(zprn) {
        return new Promise((resolve, reject) => {
            User.findOne({ zprn: zprn })
                .then((user) => {
                    return resolve(user);
                })
                .catch((err) => {
                    return reject(null);
                });
        });
    }
}

module.exports = new UserService();
