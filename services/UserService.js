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

    // FIND ALL USERS
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            User.find({}, (err, users) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(users);
                }
            });
        });
    }

    // FIND USER WITH ZPRN
    async getUser(zprn) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await User.findOne({ zprn: zprn });
                return resolve(user);
            } catch (error) {
                return reject(error);
            }
        });
    }

    // UPDATE USER PASSWORD
    async updateUser(zprn, password) {
        return new Promise((resolve, reject) => {
            User.findOneAndUpdate(
                { zprn: zprn },
                { password: password },
                (err, user) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return user != null ? resolve(user) : reject(null);
                    }
                }
            );
        });
    }

    async deleteUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await User.deleteMany({});
                return resolve(result.deletedCount);
            } catch (error) {
                return reject(error);
            }
        });
    }
}

module.exports = new UserService();
