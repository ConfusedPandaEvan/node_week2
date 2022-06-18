Week 2 project is created using Node, Express with Mysql as backend
jwt token is used for login and Signup
multer is used to save images from requests

--------------------------------------------------------------------------------------------
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
--------------------------------------------------------------------------------------------

<<< To Setup >>> - with Amazon EC2 Instance

Step 1.
In settings of Security in Amazon Instance -> Add a new rule for allowing IPv4 for all HTTP requests

Step 2.
Connect via SSH through command Line

Step 3.
Git Clone this Repository
Move to this folder by "cd node_week2" in terminal

Step 4.
Install node (enter following in terminal)

curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

Step 5. (When in folder node_week2)
Install Docker to create MySQL DB
- check the following website for reference
https://insight.infograb.net/docs/aws/installing-docker-on-aws-ec2/

Step 6.
Start MySQL by following command

docker run --rm -p 3306:3306 --name test-db -e MYSQL_ROOT_PASSWORD=1234 mysql:5.7 mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

Setup pw (optional)

Step 7.
Download Sequelizer

npm i sequelize mysql2 -S
npm i sequelize-cli -D

Step 8.
Create DB by sequelizing from migrations. Enter following in terminal

npx sequelize db:create
npx sequelize db:migrate

Step 9.
Use iptables to redirect from port 80 (default for HTTP requests) to port 3000 ( defined in the code for express server )
Enter following in Terminal

sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

Step 10. (Optional: for running it even turned off)
Use pm2 to run app.js in background

sudo -s
npm install -g pm2
pm2 start app.js



