# Reference documentation for the API.

#### Index
  - [Roles](#roles)
    - [Roles with their access rights](#roles-with-their-access-rights)
  - [Error Reporting](#error-reporting)
  - [Routes](#routes)
    - [Authentication & Authorization](#authentication--authorization)
      - [Login](#login)
      - [Refreshing the JWT token](#refreshing-the-jwt-token)
  - [Users](#users)
    - [User Resource](#user-resource)
    - [Creating Users](#creating-users)
      - [Create user profile](#create-user-profile)
    - [Getting Users](#getting-users)
      - [Get all user profiles](#get-all-user-profiles)
      - [Get currently logged in user profile](#get-currently-logged-in-user-profile)
      - [Get specific user profile](#get-specific-user-profile)
    - [Updating User](#updating-user)
      - [Update currently logged in user's password](#update-currently-logged-in-users-password)
      - [Update current user's profile](#update-current-users-profile)
      - [Updating user's profile (any user)](#updating-users-profile-any-user)
    - [Deleting Users](#deleting-users)
      - [Delete user profile](#delete-user-profile)
      - [Deleting current user's profile](#deleting-current-users-profile)
  - [Issues](#issues)
    - [Creating Issues](#creating-issues)
      - [Create Issue](#create-issue)
    - [Getting Issues](#getting-issues)
      - [Getting All Issues](#getting-all-issues)
      - [Get all issues](#get-all-issues)
      - [Get all resolved issues](#get-all-resolved-issues)
      - [Get all unresolved issues](#get-all-unresolved-issues)
      - [Get issues by phrase](#get-issues-by-phrase)
      - [Get issue by ID](#get-issue-by-id)
    - [Updating an issue](#updating-an-issue)
      - [Toggle issue resolve status](#toggle-issue-resolve-status)
      - [Post a comment on issue](#post-a-comment-on-issue)
      - [Post a solution on issue](#post-a-solution-on-issue)
    - [Deleting issue](#deleting-issue)
      - [Delete an issue](#delete-an-issue)
## Roles

### Roles with their access rights

- **student**: Can view, update & delete own profile. Create, read, comment & upvote related issues, and mark issues created by them as `resolved` or delete them.
- **student_moderator**: Extends all the rights of `student`. Additionally, can mark an issue as `inappropriate` or `resolved`.
- **auth_level_one**: All the rights of `student`. Additionally, can post solutions to issues.
- **auth_level_two**: Extends all the rights of `auth_level_one`. Additionally, can create, read, update & delete any user profile.
- **auth_level_three**: Extends all rights of `auth_level_two`.
  
**[⬆Back to index](#index)**


---

## Error Reporting
_Error reporting format_:
```JSON
statusCode: [401, 403, 500]

{
  "code": "<Error code>",
  "result": "FAILURE",
  "message": "<Error message>",
}
```

- `code` and `message` would be specified in the `String` format.
  
**[⬆Back to index](#index)**

---

## Routes

_All the requests must send the data in_ `application/JSON` _format only_.

### Authentication & Authorization

#### Login

**Method**: **`POST`**
<br>
**URL**: **`api/auth/login`**
<br>

**Required parameters**:

```JSON
{
  "zprn": "<zprn>",
  "password": "<password>",
}
```
- zprn should be exactly 7 characters long, and in `Integer` format.
- password should be at least 6 characters long,and in `String` format.

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "token": "<generated JWT token>",
  "refreshToken": "<generated refresh token token>",
}
```
- The JWT token expires in a predefined amount of time.
- On the expiry of the token, it must be renewed using the refresh token.
- The provided refresh token is persistent. It must be safely stored on the local storage of the client.

**[⬆Back to index](#index)**

#### Refreshing the JWT token

**Method**: **`POST`**
<br>
**URL**: **`api/auth/refresh`**
<br>

**Required parameters**:
```JSON
{
  "refreshToken": "<refresh token provided at login>"
}
```
>**Note:** The request must contain the expired JWT token in the `authorization` header as `'Bearer [the JWT token]`.

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "token": "<generated JWT token>"
}
```

**[⬆Back to index](#index)**

---
## Users

>**Note:** All requests must contain the valid non-expired JWT token in the `authorization` header as `Bearer [the JWT token].

### User Resource
The following details about the user are returned:
```JSON
{
  "zprn": "user's zprn",
  "firstName": "user's firstName",
  "lastName": "user's lastName",
  "department": "user's department",
  "role": "user's role",
}
```

### Creating Users

#### Create user profile

**Method**: **`POST`**
<br>
**URL**: **`api/users/add`**
<br>
**Accessible to**: Only to `auth_level_two` and above.
<br>

**Required parameters**:
```JSON
{
  "zprn": "<user's zprn>",
  "firstName": "<user's first name>",
  "lastName": "<user's last name>",
  "password": "<user's password>",
  "department": "<user's department>",
  "role": "<user's role>",
}
```
- zprn must be exactly 7 characters long, in `Integer` format.
- password must be at least 6 characters, in the `String` format.
- department must be at least 2 characters long, in `String` format.
- role should be any one of the specified roles.

_Successful Response format_:
```JSON
statusCode: 201

{
  "code": "CREATED",
  "result": "SUCCESS",
  "message": "User added",
}
```

**[⬆Back to index](#index)**

#### Creating user profiles from CSV file:

 
**Method**: **`POST`**
<br>
**URL**: **`api/users/add/all`**
<br>
**Accessible to**: `All`

**Required parameters**: The csv file must be sent to the API in `multipart/form-data` format, with the fieldname as `users`.
<br>
The CSV file must contain a header and must be in the following format: 
<table>
  <tr>
    <th>ZPRN</th>
    <th>FIRST_NAME</th>
    <th>LAST_NAME</th>
    <th>PASSWORD</th>
    <th>DEPARTMENT</th>
    <th>ROLE</th>
  </tr>
  <tr>
    <td colspan="6" style="text-align:center;font-style:italic">Data</td>
  </tr>
</table>

_Successful Response format_:
<br>
If there were no errors in creating the users, the API would respond with:

```JSON
statusCode : 200

{
  "code": "OK",
  "result": "SUCCESS",
  "message": "User profiles created",
}
```

The API checks the entire data once before creating the user profiles. If any user has inappropriate/insufficient data, the API would respond with:

```JSON
statusCode : 400

{
  "code": "BAD_REQUEST",
  "result": "FAILURE",
  "message": "Users with zprn [list] have inappropriate/insufficient data"
}
```
- The `list` would be a comma-seperated list of zprns of users profiles having inappropriate/insufficient data, with parantheses.

> **Note:** If any user has inappropriate/insufficient data, no user profiles are created at all. The client must again make a `POST` request to the API with the entire corrected data.

### Getting Users

#### Get all user profiles

**Method**: **`GET`**
<br>
****URL****: **`api/users/all`**
<br>
**Accessible to**: Only to `auth_level_two` and above.
<br>

**Required parameters**: `None`

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "user": "[List of users]",
}
```

**[⬆Back to index](#index)**

#### Get currently logged in user profile

**Method**: **`GET`**
<br>
**URL**: **`api/users`**
<br>
**Accessible to**: `All`
<br>

**Required parameters**: `None`

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "user": {
    "zprn": "<user's zprn>",
    "firstName": "<user's first name>",
    "lastName": "<user's last name>",
    "department": "<user's department>",
  }
}
```

**[⬆Back to index](#index)**

#### Get specific user profile

**Method**: **`GET`**
<br>
**URL**: **`api/users/:id`**
<br>
**Accessible to**: Only to `auth_level_two` and above.
<br>

**Required parameters**: No data should be passed in `application/JSON` format, only valid `userID (zprn)` should be specified in the **URL**.

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "user": {
    "zprn": "<user's zprn>",
    "firstName": "<user's first name>",
    "lastName": "<user's last name>",
    "department": "<user's department>",
    "role": "<user's role>",
  }
}
```

**[⬆Back to index](#index)**

### Updating User

#### Update currently logged in user's password

**Method**: **`PATCH`**
<br>
**URL**: **`api/users/update/password`**
<br>
**Accessible to**: `All`
<br>

**Required parameters**:
```JSON
{
  "oldPassword": "<user's current password>",
  "newPassword": "<user's updated password>".
}
```
- oldPassword must not be the same as the newPassword.
- New password must contain at least 6 characters, and in `String` format.

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Password updated",
}
```

**[⬆Back to index](#index)**

#### Update current user's profile

**Method**: **`POST`**
<br>
**URL**: **`api/users/update/profile`**
<br>
**Accessible to**: `All`
<br>

**Required parameters**:
```JSON
{
  "firstName":"<updated firstName>",
  "lastName":"<updated lastName>",
  "department":"<updated department>",
}
```
>**Note**: The currently logged in user can only update their firstName, lastName & department. Only those fields must be passed that are updated, rest must be left undefined.

_Successful response format_
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "message": "User updated"
}
```
**[⬆Back to index](#index)**

#### Updating user's profile (any user)

**Method**: **`POST`**
<br>
**URL**: **`api/users/update/profile/:id`**

**Accessible to**: Only to `auth_level_two` and above.
<br>

**Required parameters**:
```JSON
{
  "firstName": "<user's first name>",
  "lastName": "<user's last name>",
  "password": "<user's password>",
  "department": "<user's department>",
  "role": "<user's role>",
}
```
**Note:** Fields that are not updated, must not be defined.

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "message": "User updated",
}
```
**[⬆Back to index](#index)**

### Deleting Users
>**Note**: No document is deleted from the database, only it's visibility to the API is removed.

#### Delete user profile

**Method**: **`DELETE`**
<br>
**URL**: **`api/users/:id`**
<br>
**Accessible to**: `auth_level_two` & above.
<br>

**Required parameters**: No data should be passed in `application/JSON` format, only valid `userID (zprn)` should be specified in the **URL**.
<br>

_Successful Response format_:
```JSON
statusCode: 200

{
  "code": "OK",
  "result": "SUCCESS",
  "deleted": "<deleted user>",
}
```
**[⬆Back to index](#index)**

#### Deleting current user's profile

**Method**: **`Delete`**
<br>
**URL**: **`api/users/`**
<br>
**Accessible to**: `All`
<br>

**Required parameters**: `None`

_Successful Response format_:
```JSON
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "User deleted",
}
```
**[⬆Back to index](#index)**

---
## Issues

### Creating Issues
#### Create Issue
Creating an issue is a two-step process:

**Step I:** Sending images, if any.

**Method**: **`POST`**
<br>
**URL**: **`api/issues/images`**
<br>
**Accessible to**: `All`

**Required parameters**: The image(s) must be sent in `multipart/form-data` format, with the fieldname as `images`.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "files": "[paths to images]",
}
```

**Step II:** Sending issue details.

**Method**: **`POST`**
<br>
**URL**: **`api/issues/`**
<br>
**Accessible to**: `All`

**Required parameters**:
```JSON
{
  "title": "title of the issue",
  "description": "description of the issue",
  "images":"[paths to images]",
  "section": "section to which the issue belongs",
  "scope": "scope of the issue, [INTITUTE/DEPARTMENT]",
}
```
- `title` should be in `String` format.
- `description` should be in `String` format.
- `images` must be an array of paths to the images returned by the **STEP 1**. If there are no images, an empty array must be sent.
- `section` must be in `String` format.
- `scope` must be one of the two: `DEPARTMENT` or `INSTITUTE`.


_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Issue created",
}
```
**[⬆Back to index](#index)**

### Getting Issues

>**Note:** The routes returning a list of issues depend on the role of logged in user. Users with role of `auth_level_two` & above get the list of all issues irrespective of the department of the issue. Rest all users get list of issues related to their department or those whose scope is `institute`.

#### Getting All Issues

#### Get all issues

> Returns a list of all resolved & unresolved issues

**Method**: **`GET`**
<br>
**URL**: **`api/issues/all`**
<br>
**Accessible to**: `All`

**Required parameters**: `None`

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "issues":"[List of Issues]",
}
```
**[⬆Back to index](#index)**

#### Get all resolved issues
]Returns a list of all unresolved issues only.

**Method**: **`GET`**
<br>
**URL**: **`api/issues/all/resolved`**
<br>
**Accessible to**: `All`

**Required parameters**: `None`

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "issues": "[List of issues]",
}
```
**[⬆Back to index](#index)**

#### Get all unresolved issues
> Returns a list of all unresolved issues only.

**Method**: **`GET`**
<br>
**URL**: **`api/issues/all/unresolved`**
<br>
**Accessible to**: `All`

**Required parameters**: `None`

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "issues": "[List of issues]",
}
```
**[⬆Back to index](#index)**

#### Get issues by phrase:
**Method**: **`GET`**
<br>
**URL**: **`api/issues/phrase`**
<br>
**Accessible to**: `All`

**Required parameters**:
```JSON
{
  "phrase":"Phrase containing the keywords"
}
```

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "issues":"[List of issues containing the provided keywords]",
}
```

#### Get issue by ID
**Method**: **`GET`**
<br>
**URL**: **`api/issues/:id`**
<br>
**Accessible to**: `All`

**Required parameters**: `id` of the issue in the request URL itself.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "issue": "[issue]"
}
```
**[⬆Back to index](#index)**

### Updating issue

#### Toggle issue resolve status
**Method**: **`PUT`**
<br>
**URL**: **`api/:id/resolve`**
<br>
**Accessible to**: `student` and `student_moderator` only.

**Required parameters**: `id` of the issue in the request URL itself.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Resolve status updated",
}
```
**[⬆Back to index](#index)**
> **Note:** Only the student who created the issue or user with role `student_moderator` can toggle issue resolve status.


#### Post a comment on issue
**Method**: **`PUT`**
<br>
**URL**: **`api/issues/:id/comment`**
<br>
**Accessible to**: `All`

**Required parameters**: `id` of the issue in the request URL itself.
```JSON
{
  "comment":"<comment>"
}
```
- `comment` must be `String` format.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Comment posted",
}
```
**[⬆Back to index](#index)**

#### Post a solution on issue
**Method**: **`PUT`**
<br>
**URL**: **`api/issues/:id/solution`**
<br>
**Accessible to**: `auth_level_two` & above

**Required parameters**: `id` of the issue in the request URL itself.
```JSON
{
  "solution":"<solution>"
}
```
- `solution` must be `String` format.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Solution posted",
}
```
**[⬆Back to index](#index)**

### Deleting issue

#### Delete an issue
**Method**: **`DELETE`**
<br>
**URL**: **`api/issues/:id`**
<br>
**Accessible to**: `All`

**Required parameters**: `id` of the issue in the request URL itself.

_Successful Response format_:
```JSON
statusCode : 200
{
  "code": "OK",
  "result": "SUCCESS",
  "message": "Issue deleted",
}
```
**[⬆Back to index](#index)**
