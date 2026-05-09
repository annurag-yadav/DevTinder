DevTinder APIs

* authRouter
- POST /signup
- POST /login
- POST /logout

* profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /profile/password

* connectionRequestRoutes
- POST /request/send/:status/:userId

 - POST /request/send/intrested/:userId
 - POST /request/send/ignored/:userId

- POST /request/review/:status/:requestId

 - POST /request/review/accepted/:requestId
 - POST /request/review/rejected/:requestId

* userRouter
- GET /user/conncection
- GET /user/requests
- GET /user/feed - gets you the profiles of other users on platform 


status : ignore, interested, accepted, rejected
 
