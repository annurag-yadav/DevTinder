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
- POST /request/send/intrested/:userId
- POST /request/send/ignored/:userId
- POST /request/send/accepted/:userId
- POST /request/send/rejected/:userId

* userRouter
- GET /user/conncection
- GET /user/requests
- GET /user/feed - gets you the profiles of other users on platform 


status : ignore, interested, accepted, rejected
 
