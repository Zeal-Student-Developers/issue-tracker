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
            disabled: false,
        });
        return new Promise(async (resolve, reject) => {
            try {
                const newUser = await user.save();
                return resolve(newUser);
            } catch (error) {
                return reject(error);
            }
        });
    }

    // FIND ALL USERS
    async getAllUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const users = await User.find({ disabled: false });
                return resolve(users);
            } catch (error) {
                return reject(error);
            }
        });
    }

    // FIND USER WITH ZPRN
    async getUser(zprn) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await User.findOne({
                    zprn: zprn,
                    disabled: false,
                });
                return resolve(user);
            } catch (error) {
                return reject(error);
            }
        });
    }

    // UPDATE USER
    /*
     * 'newUser' is the object containing updated details of the user.
     * The fields that aren't to be updated should be left undefined
     */
    async updateUser(newUser) {
        return new Promise(async (resolve, reject) => {
            const {
                zprn,
                firstName,
                lastName,
                password,
                department,
                role,
            } = newUser;
            try {
                const user = await User.findOne({ zprn: zprn });
                user.firstName =
                    firstName != undefined ? firstName : user.firstName;
                user.lastName =
                    lastName != undefined ? lastName : user.lastName;
                user.password =
                    password != undefined ? password : user.password;
                user.department =
                    department != undefined ? department : user.department;
                user.role = role != undefined ? role : user.role;
                const result = await user.save();
                return resolve(result);
            } catch (error) {
                console.log(error);
                return reject(error);
            }
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

    /* 
    ! The deleted user still has the valid JWT token. The API can still te accessed with that token!
      TODO: Somehow invalidate the deleted user's token(s)
    */
    async deleteUser(zprn) {
        return new Promise(async (resolve, reject) => {
            try {
                // const result = await User.deleteOne({ zprn: zprn });
                const user = await User.findOneAndUpdate(
                    { zprn: zprn },
                    { disabled: true }
                );
                return resolve(user);
            } catch (error) {
                return reject(error);
            }
        });
    }
}

module.exports = new UserService();
