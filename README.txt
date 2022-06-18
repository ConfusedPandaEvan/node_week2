Week 2 project is created using Node, Express with Mysql as backend
jwt token is used for login and Signup
multer is used to save images from requests

API calls are as follows

*Signup
POST "/api/users"
req => body: {nickname, email, password, confirmPassword}
res => success: {}
        error: "ERROR_PASSWORD_MATCH", "ERROR_USER_EXISTS", "ERROR_INPUT_FORMAT"

*Login
POST "/api/auth"
req => body {email, password}
res => success: { token }
        error: "Email or Password is Incorrect.", "The requested format is incorrect2"

*Checking user
GET "/api/users/me"
req => header: {token}
res => {email, nickname}

*Getting all existing posts
GET "/api/post"
req => 
res => post: { postId, userId, title, content, createdAt, layout, imageLocation }

*Creating Post
POST "/api/post"
req => header: {token}, body: {userId, title, content, layout}
res => success: {success: true}
        error: "something went wrong with posting"


*Get single Post
GET "/api/post/:postId"
req => header: {token}
res =>  post: { postId, userId, title, content, createdAt, layout, imageLocation, likeCount, likeByMe }

*Delete post with postId
DELETE "/api/post/:postId"
req => header: {token}
res => success: {}
        error: "Please check the PostId.", "You cannot delete this post."

*Edit post with postId
PUT "/api/post/:postId"
req => header: {token} body: {title, content, imageLocation}
res => error: "You cannot change this post.", "You cannot change a non-existing Post"

*Like or Unlike Post with postId
GET "/api/post/:postId/like"
req => header: {token}
res => {}

